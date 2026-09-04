import { createDatabase } from "@dorak/db";
import type {
  BranchSearchResponse,
  BranchSummary,
  CandidateStatus,
  CuisineKey,
  DataProvenance,
  IngestionCandidate,
  OpsReview,
  ReviewStatus,
  ReviewSubmission,
  ReviewSummary,
} from "@dorak/domain-types";
import { createPublicId } from "@dorak/ids";

import { DuplicateReviewError, ReviewRateLimitError } from "./review-errors.js";
import type { ReviewerIdentity } from "./reviewer-identity.js";

interface BranchRow {
  id: string;
  publicId: string;
  name: string;
  neighborhood: string;
  district: string;
  address: string;
  phone: string | null;
  websiteUrl: string | null;
  openingHours: string | null;
  closedDays: string | null;
  externalInfoSource: string | null;
  externalInfoUpdatedAt: Date | string | null;
  totalCount: number | null;
  cuisine: string;
  shortDescription: string;
  signatureMenu: string[];
  priceBand: number;
  rating: number | null;
  reviewCount: number;
  provenance: DataProvenance;
  latitude: number | null;
  longitude: number | null;
  sourceName: string | null;
  lastVerifiedAt: Date | string | null;
}

interface CandidateRow {
  id: string;
  sourceName: string;
  sourceRecordId: string;
  proposedName: string;
  proposedAddress: string;
  cuisine: string | null;
  confidence: number;
  status: CandidateStatus;
  provenance: DataProvenance;
  createdAt: Date | string;
}

interface ReviewRow {
  publicId: string;
  authorName: string;
  rating: number;
  body: string;
  visitedOn: Date | string | null;
  identityVerified: boolean;
  visitVerification: "self_reported" | "receipt" | "reservation";
  createdAt: Date | string;
}

interface OpsReviewRow extends ReviewRow {
  branchPublicId: string;
  branchName: string;
  status: ReviewStatus;
}

const CUISINE_LABELS: Record<CuisineKey, string> = {
  korean: "한식",
  noodle: "면요리",
  japanese: "일식",
  chinese: "중식",
  western: "양식",
  cafe: "카페·디저트",
};

function isCuisineKey(value: string): value is CuisineKey {
  return value in CUISINE_LABELS;
}

function toCuisineKey(value: string): CuisineKey {
  return isCuisineKey(value) ? value : "korean";
}

function mapBranch(row: BranchRow): BranchSummary {
  const cuisine = toCuisineKey(row.cuisine);
  const priceBand = "₩".repeat(Math.min(Math.max(row.priceBand, 1), 4)) as
    "₩" | "₩₩" | "₩₩₩" | "₩₩₩₩";

  return {
    id: row.id,
    publicId: row.publicId,
    name: row.name,
    neighborhood: row.neighborhood,
    district: row.district,
    address: row.address,
    phone: row.phone,
    websiteUrl: row.websiteUrl,
    openingHours: row.openingHours,
    closedDays: row.closedDays,
    externalInfoSource: row.externalInfoSource,
    externalInfoUpdatedAt:
      row.externalInfoUpdatedAt === null
        ? null
        : serializePostgresTimestamp(row.externalInfoUpdatedAt),
    cuisine,
    cuisineLabel: CUISINE_LABELS[cuisine],
    shortDescription: row.shortDescription,
    signatureMenu: row.signatureMenu,
    priceBand,
    rating: row.rating,
    reviewCount: row.reviewCount,
    provenance: row.provenance,
    latitude: row.latitude,
    longitude: row.longitude,
    sourceName: row.sourceName,
    lastVerifiedAt:
      row.lastVerifiedAt === null
        ? null
        : serializePostgresTimestamp(row.lastVerifiedAt),
  };
}

function mapCandidate(row: CandidateRow): IngestionCandidate {
  const cuisine = toCuisineKey(row.cuisine ?? "korean");
  return {
    id: row.id,
    sourceName: row.sourceName,
    sourceRecordId: row.sourceRecordId,
    proposedName: row.proposedName,
    proposedAddress: row.proposedAddress,
    cuisineLabel: CUISINE_LABELS[cuisine],
    confidence: row.confidence,
    status: row.status,
    provenance: row.provenance,
    createdAt: serializePostgresTimestamp(row.createdAt),
  };
}

function mapReview(row: ReviewRow): ReviewSummary {
  return {
    publicId: row.publicId,
    authorName: row.authorName,
    rating: row.rating,
    body: row.body,
    visitedOn: serializePostgresDate(row.visitedOn),
    identityVerified: row.identityVerified,
    visitVerification: row.visitVerification,
    createdAt: serializePostgresTimestamp(row.createdAt),
  };
}

function mapOpsReview(row: OpsReviewRow): OpsReview {
  return {
    ...mapReview(row),
    branchPublicId: row.branchPublicId,
    branchName: row.branchName,
    status: row.status,
  };
}

export function serializePostgresTimestamp(value: Date | string): string {
  const timestamp = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new TypeError("PostgreSQL returned an invalid timestamp.");
  }

  return timestamp.toISOString();
}

function serializePostgresDate(value: Date | string | null): string | null {
  if (value === null) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export class PostgresCatalog {
  readonly mode = "postgres" as const;
  readonly #database;

  constructor(
    databaseUrl: string,
    options: Readonly<{ maxConnections?: number }> = {},
  ) {
    this.#database = createDatabase(databaseUrl, options);
  }

  async ping(): Promise<void> {
    await this.#database.raw`SELECT 1`;
  }

  async close(): Promise<void> {
    await this.#database.close();
  }

  async searchBranches(
    query = "",
    cuisine?: string,
    options: Readonly<{
      limit?: number;
      offset?: number;
      approvedOnly?: boolean;
    }> = {},
  ): Promise<BranchSearchResponse> {
    const needle = query.normalize("NFKC").trim();
    const limit = Math.min(Math.max(Math.trunc(options.limit ?? 100), 1), 200);
    const offset = Math.max(Math.trunc(options.offset ?? 0), 0);
    if (!needle) {
      const rows = await this.#database.raw<BranchRow[]>`
        SELECT
          branch.id::text,
          branch.public_id AS "publicId",
          branch.name,
          branch.neighborhood,
          branch.district,
          branch.road_address AS address,
          branch.phone,
          branch.website_url AS "websiteUrl",
          branch.opening_hours AS "openingHours",
          branch.closed_days AS "closedDays",
          branch.external_info_source AS "externalInfoSource",
          branch.external_info_updated_at AS "externalInfoUpdatedAt",
          branch.cuisine_key AS cuisine,
          branch.short_description AS "shortDescription",
          branch.signature_menu AS "signatureMenu",
          branch.price_band::int AS "priceBand",
          branch.rating::float8 AS rating,
          branch.review_count::int AS "reviewCount",
          branch.provenance,
          ST_Y(branch.location::geometry)::float8 AS latitude,
          ST_X(branch.location::geometry)::float8 AS longitude,
          source.display_name AS "sourceName",
          branch.last_verified_at AS "lastVerifiedAt",
          count(*) OVER()::int AS "totalCount"
        FROM catalog.branches AS branch
        LEFT JOIN ingestion.sources AS source
          ON source.source_key = branch.source_key
        WHERE branch.status = 'active'
          AND (${cuisine ?? null}::text IS NULL OR branch.cuisine_key = ${cuisine ?? null})
          AND (${options.approvedOnly ?? false} = false OR branch.provenance = 'approved_source')
        ORDER BY branch.created_at, branch.public_id
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return {
        data: rows.map(mapBranch),
        meta: {
          query,
          total: rows[0]?.totalCount ?? 0,
          dataMode: "postgres",
        },
      };
    }

    const escapedNeedle = needle
      .replaceAll("\\", "\\\\")
      .replaceAll("%", "\\%")
      .replaceAll("_", "\\_");
    const pattern = `%${escapedNeedle}%`;
    const prefixPattern = `${escapedNeedle}%`;
    const rows = await this.#database.raw<BranchRow[]>`
      SELECT
        branch.id::text,
        branch.public_id AS "publicId",
        branch.name,
        branch.neighborhood,
        branch.district,
        branch.road_address AS address,
        branch.phone,
        branch.website_url AS "websiteUrl",
        branch.opening_hours AS "openingHours",
        branch.closed_days AS "closedDays",
        branch.external_info_source AS "externalInfoSource",
        branch.external_info_updated_at AS "externalInfoUpdatedAt",
        branch.cuisine_key AS cuisine,
        branch.short_description AS "shortDescription",
        branch.signature_menu AS "signatureMenu",
        branch.price_band::int AS "priceBand",
        branch.rating::float8 AS rating,
        branch.review_count::int AS "reviewCount",
        branch.provenance,
        ST_Y(branch.location::geometry)::float8 AS latitude,
        ST_X(branch.location::geometry)::float8 AS longitude,
        source.display_name AS "sourceName",
        branch.last_verified_at AS "lastVerifiedAt",
        count(*) OVER()::int AS "totalCount"
      FROM catalog.branches AS branch
      LEFT JOIN ingestion.sources AS source
        ON source.source_key = branch.source_key
        WHERE branch.status = 'active'
          AND (${cuisine ?? null}::text IS NULL OR branch.cuisine_key = ${cuisine ?? null})
          AND (${options.approvedOnly ?? false} = false OR branch.provenance = 'approved_source')
        AND (
          ${needle} = ''
          OR branch.search_text ILIKE ${pattern} ESCAPE '\\'
          OR branch.name % ${needle}
          OR to_tsvector('simple'::regconfig, branch.search_text)
            @@ plainto_tsquery('simple'::regconfig, ${needle})
        )
      ORDER BY
        CASE
          WHEN ${needle} = '' THEN 0
          WHEN lower(branch.name) = lower(${needle}) THEN 0
          WHEN branch.name ILIKE ${prefixPattern} ESCAPE '\\' THEN 1
          WHEN branch.name ILIKE ${pattern} ESCAPE '\\' THEN 2
          ELSE 3
        END,
        ts_rank(
          to_tsvector('simple'::regconfig, branch.search_text),
          plainto_tsquery('simple'::regconfig, ${needle})
        ) DESC,
        similarity(branch.name, ${needle}) DESC,
        branch.created_at,
        branch.public_id
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return {
      data: rows.map(mapBranch),
      meta: {
        query,
        total: rows[0]?.totalCount ?? 0,
        dataMode: "postgres",
      },
    };
  }

  async findBranch(publicId: string): Promise<BranchSummary | undefined> {
    const rows = await this.#database.raw<BranchRow[]>`
      SELECT
        branch.id::text,
        branch.public_id AS "publicId",
        branch.name,
        branch.neighborhood,
        branch.district,
        branch.road_address AS address,
        branch.phone,
        branch.website_url AS "websiteUrl",
        branch.opening_hours AS "openingHours",
        branch.closed_days AS "closedDays",
        branch.external_info_source AS "externalInfoSource",
        branch.external_info_updated_at AS "externalInfoUpdatedAt",
        branch.cuisine_key AS cuisine,
        branch.short_description AS "shortDescription",
        branch.signature_menu AS "signatureMenu",
        branch.price_band::int AS "priceBand",
        branch.rating::float8 AS rating,
        branch.review_count::int AS "reviewCount",
        branch.provenance,
        ST_Y(branch.location::geometry)::float8 AS latitude,
        ST_X(branch.location::geometry)::float8 AS longitude,
        source.display_name AS "sourceName",
        branch.last_verified_at AS "lastVerifiedAt"
      FROM catalog.branches AS branch
      LEFT JOIN ingestion.sources AS source
        ON source.source_key = branch.source_key
      WHERE branch.public_id = ${publicId}
        AND branch.status = 'active'
      LIMIT 1
    `;

    return rows[0] ? mapBranch(rows[0]) : undefined;
  }

  async listCandidates(
    status: CandidateStatus = "pending",
  ): Promise<IngestionCandidate[]> {
    const rows = await this.#database.raw<CandidateRow[]>`
      SELECT
        candidate.public_id AS id,
        source.source_key AS "sourceName",
        raw.source_record_id AS "sourceRecordId",
        candidate.proposed_name AS "proposedName",
        candidate.proposed_address AS "proposedAddress",
        candidate.proposed_cuisine_key AS cuisine,
        candidate.confidence::float8 AS confidence,
        candidate.status,
        source.provenance,
        candidate.created_at AS "createdAt"
      FROM ops.branch_candidates AS candidate
      JOIN ingestion.raw_documents AS raw ON raw.id = candidate.raw_document_id
      JOIN ingestion.sources AS source ON source.id = raw.source_id
      WHERE candidate.status = ${status}
      ORDER BY candidate.created_at, candidate.id
    `;

    return rows.map(mapCandidate);
  }

  async reviewCandidate(
    publicId: string,
    decision: Extract<CandidateStatus, "approved" | "rejected">,
  ): Promise<IngestionCandidate | undefined> {
    const candidateId = await this.#database.raw.begin(async (transaction) => {
      const updated = await transaction<{ id: string }[]>`
        UPDATE ops.branch_candidates
        SET status = ${decision}, decided_at = now()
        WHERE public_id = ${publicId}
          AND status = 'pending'
        RETURNING id::text
      `;

      if (!updated[0]) return undefined;

      await transaction`
        INSERT INTO platform.audit_log (
          action,
          entity_type,
          entity_id,
          before_state,
          after_state
        ) VALUES (
          ${`candidate.${decision}`},
          'branch_candidate',
          ${updated[0].id}::uuid,
          ${JSON.stringify({ status: "pending" })}::jsonb,
          ${JSON.stringify({ status: decision })}::jsonb
        )
      `;
      return updated[0].id;
    });

    if (!candidateId) return undefined;

    const rows = await this.#database.raw<CandidateRow[]>`
      SELECT
        candidate.public_id AS id,
        source.source_key AS "sourceName",
        raw.source_record_id AS "sourceRecordId",
        candidate.proposed_name AS "proposedName",
        candidate.proposed_address AS "proposedAddress",
        candidate.proposed_cuisine_key AS cuisine,
        candidate.confidence::float8 AS confidence,
        candidate.status,
        source.provenance,
        candidate.created_at AS "createdAt"
      FROM ops.branch_candidates AS candidate
      JOIN ingestion.raw_documents AS raw ON raw.id = candidate.raw_document_id
      JOIN ingestion.sources AS source ON source.id = raw.source_id
      WHERE candidate.id = ${candidateId}::uuid
    `;

    return rows[0] ? mapCandidate(rows[0]) : undefined;
  }

  async listReviews(branchPublicId: string): Promise<ReviewSummary[]> {
    const rows = await this.#database.raw<ReviewRow[]>`
      SELECT
        review.public_id AS "publicId",
        review.author_name AS "authorName",
        review.rating::int AS rating,
        review.body,
        review.visited_on AS "visitedOn",
        review.identity_verified AS "identityVerified",
        review.visit_verification AS "visitVerification",
        review.created_at AS "createdAt"
      FROM community.reviews AS review
      JOIN catalog.branches AS branch ON branch.id = review.branch_id
      WHERE branch.public_id = ${branchPublicId}
        AND branch.status = 'active'
        AND review.status = 'published'
      ORDER BY review.created_at DESC, review.id DESC
    `;

    return rows.map(mapReview);
  }

  async createReview(
    branchPublicId: string,
    reviewer: ReviewerIdentity,
    submission: ReviewSubmission,
  ): Promise<ReviewSummary | undefined> {
    try {
      const row = await this.#database.raw.begin(async (transaction) => {
        // Serialize a user's concurrent submissions before checking the daily cap.
        await transaction`
          SELECT pg_advisory_xact_lock(hashtextextended(${reviewer.userId}, 0))
        `;

        const existing = await transaction<{ exists: boolean }[]>`
          SELECT EXISTS (
            SELECT 1
            FROM community.reviews AS review
            JOIN catalog.branches AS branch ON branch.id = review.branch_id
            WHERE branch.public_id = ${branchPublicId}
              AND review.reviewer_user_id = ${reviewer.userId}::uuid
          ) AS exists
        `;
        if (existing[0]?.exists) throw new DuplicateReviewError();

        const recent = await transaction<{ count: number }[]>`
          SELECT count(*)::int AS count
          FROM community.reviews
          WHERE reviewer_user_id = ${reviewer.userId}::uuid
            AND created_at >= now() - interval '1 day'
        `;
        if ((recent[0]?.count ?? 0) >= 5) throw new ReviewRateLimitError();

        const rows = await transaction<ReviewRow[]>`
          INSERT INTO community.reviews (
            public_id,
            branch_id,
            reviewer_user_id,
            author_name,
            rating,
            body,
            visited_on,
            visit_attested,
            identity_verified,
            visit_verification
          )
          SELECT
            ${createPublicId("rv")},
            branch.id,
            ${reviewer.userId}::uuid,
            ${submission.authorName},
            ${submission.rating},
            ${submission.body},
            ${submission.visitedOn}::date,
            ${submission.visitAttested},
            ${reviewer.identityVerified},
            'self_reported'
          FROM catalog.branches AS branch
          WHERE branch.public_id = ${branchPublicId}
            AND branch.status = 'active'
          RETURNING
            public_id AS "publicId",
            author_name AS "authorName",
            rating::int AS rating,
            body,
            visited_on AS "visitedOn",
            identity_verified AS "identityVerified",
            visit_verification AS "visitVerification",
            created_at AS "createdAt"
        `;

        return rows[0];
      });

      return row ? mapReview(row) : undefined;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new DuplicateReviewError();
      }
      throw error;
    }
  }

  async listRecentReviews(
    status: ReviewStatus = "published",
  ): Promise<OpsReview[]> {
    const rows = await this.#database.raw<OpsReviewRow[]>`
      SELECT
        review.public_id AS "publicId",
        branch.public_id AS "branchPublicId",
        branch.name AS "branchName",
        review.author_name AS "authorName",
        review.rating::int AS rating,
        review.body,
        review.visited_on AS "visitedOn",
        review.identity_verified AS "identityVerified",
        review.visit_verification AS "visitVerification",
        review.status,
        review.created_at AS "createdAt"
      FROM community.reviews AS review
      JOIN catalog.branches AS branch ON branch.id = review.branch_id
      WHERE review.status = ${status}
      ORDER BY review.created_at DESC, review.id DESC
      LIMIT 100
    `;

    return rows.map(mapOpsReview);
  }

  async hideReview(publicId: string): Promise<OpsReview | undefined> {
    const reviewId = await this.#database.raw.begin(async (transaction) => {
      const updated = await transaction<{ id: string }[]>`
        UPDATE community.reviews
        SET status = 'hidden', updated_at = now()
        WHERE public_id = ${publicId}
          AND status = 'published'
        RETURNING id::text
      `;
      if (!updated[0]) return undefined;

      await transaction`
        INSERT INTO platform.audit_log (
          action,
          entity_type,
          entity_id,
          before_state,
          after_state
        ) VALUES (
          'review.hidden',
          'review',
          ${updated[0].id}::uuid,
          ${JSON.stringify({ status: "published" })}::jsonb,
          ${JSON.stringify({ status: "hidden" })}::jsonb
        )
      `;
      return updated[0].id;
    });
    if (!reviewId) return undefined;

    const rows = await this.#database.raw<OpsReviewRow[]>`
      SELECT
        review.public_id AS "publicId",
        branch.public_id AS "branchPublicId",
        branch.name AS "branchName",
        review.author_name AS "authorName",
        review.rating::int AS rating,
        review.body,
        review.visited_on AS "visitedOn",
        review.identity_verified AS "identityVerified",
        review.visit_verification AS "visitVerification",
        review.status,
        review.created_at AS "createdAt"
      FROM community.reviews AS review
      JOIN catalog.branches AS branch ON branch.id = review.branch_id
      WHERE review.id = ${reviewId}::uuid
    `;

    return rows[0] ? mapOpsReview(rows[0]) : undefined;
  }
}
