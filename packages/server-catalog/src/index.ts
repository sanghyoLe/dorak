import type {
  BranchLocationGroup,
  BranchSearchOptions,
  BranchSearchResponse,
  BranchSummary,
  CandidateStatus,
  IngestionCandidate,
  OpsReview,
  OpsReviewReport,
  ReviewStatus,
  ReviewReportDecision,
  ReviewReportStatus,
  ReviewReportSubmission,
  ReviewReportSummary,
  ReviewSubmission,
  ReviewSummary,
} from "@dorak/domain-types";
import { createPublicId } from "@dorak/ids";

import {
  SYNTHETIC_BRANCHES,
  SYNTHETIC_CANDIDATES,
  SYNTHETIC_DEMO_USER,
  SYNTHETIC_REVIEWS,
} from "./fixtures.js";
import {
  DuplicateReviewError,
  DuplicateReviewReportError,
  ReviewRateLimitError,
} from "./review-errors.js";
import type { ReviewerIdentity } from "./reviewer-identity.js";

function normalise(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export class InMemoryCatalog {
  readonly mode = "memory" as const;
  readonly #branches: BranchSummary[];
  readonly #candidates = new Map(
    SYNTHETIC_CANDIDATES.map((candidate) => [candidate.id, { ...candidate }]),
  );
  readonly #reviews: StoredReview[];
  readonly #reports: StoredReviewReport[] = [];
  readonly #savedBranches = new Map<string, Set<string>>();

  constructor() {
    this.#branches = SYNTHETIC_BRANCHES.map((branch) => ({ ...branch }));
    this.#reviews = SYNTHETIC_REVIEWS.map((review) => ({ ...review }));
    for (const branch of this.#branches) this.#refreshRating(branch.publicId);
  }

  searchBranches(
    query = "",
    cuisine?: string,
    options: Readonly<BranchSearchOptions> = {},
  ): BranchSearchResponse {
    const needle = normalise(query);
    const data = this.#branches.filter((branch) => {
      const matchesProvenance =
        !options.approvedOnly || branch.provenance === "approved_source";
      const matchesCuisine = !cuisine || branch.cuisine === cuisine;
      const matchesDistrict =
        !options.district || branch.district === options.district;
      const matchesNeighborhood =
        !options.neighborhood || branch.neighborhood === options.neighborhood;
      const matchesPrice =
        !options.priceBands?.length ||
        options.priceBands.includes(branch.priceBand.length);
      const matchesRating =
        options.minRating === undefined ||
        (branch.rating !== null && branch.rating >= options.minRating);
      const haystack = normalise(
        [
          branch.name,
          branch.neighborhood,
          branch.district,
          branch.address,
          branch.cuisineLabel,
          branch.shortDescription,
          ...branch.signatureMenu,
        ].join(" "),
      );

      return (
        matchesProvenance &&
        matchesCuisine &&
        matchesDistrict &&
        matchesNeighborhood &&
        matchesPrice &&
        matchesRating &&
        (!needle || haystack.includes(needle))
      );
    });

    const total = data.length;
    const limit = Math.min(Math.max(Math.trunc(options.limit ?? 100), 1), 200);
    const offset = Math.max(Math.trunc(options.offset ?? 0), 0);
    const sorted = data.toSorted((left, right) => {
      if (options.sort === "rating") {
        return (
          (right.rating ?? -1) - (left.rating ?? -1) ||
          right.reviewCount - left.reviewCount
        );
      }
      if (options.sort === "reviews") {
        return (
          right.reviewCount - left.reviewCount ||
          (right.rating ?? -1) - (left.rating ?? -1)
        );
      }
      if (needle) {
        return 0;
      }
      return (
        right.reviewCount - left.reviewCount ||
        (right.rating ?? -1) - (left.rating ?? -1) ||
        left.name.localeCompare(right.name, "ko-KR")
      );
    });

    return {
      data: sorted.slice(offset, offset + limit),
      meta: {
        query,
        total,
        dataMode: "memory",
        pageSize: limit,
        sort: options.sort ?? "default",
        ...(options.page === undefined ? {} : { page: options.page }),
      },
    };
  }

  listLocations(
    options: Readonly<{ approvedOnly?: boolean }> = {},
  ): BranchLocationGroup[] {
    const groups = new Map<string, Map<string, number>>();

    for (const branch of this.#branches) {
      if (options.approvedOnly && branch.provenance !== "approved_source") {
        continue;
      }

      const neighborhoods = groups.get(branch.district) ?? new Map();
      neighborhoods.set(
        branch.neighborhood,
        (neighborhoods.get(branch.neighborhood) ?? 0) + 1,
      );
      groups.set(branch.district, neighborhoods);
    }

    return [...groups.entries()]
      .map(([district, neighborhoods]): BranchLocationGroup => ({
        district,
        count: [...neighborhoods.values()].reduce(
          (total, count) => total + count,
          0,
        ),
        neighborhoods: [...neighborhoods.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((left, right) => left.name.localeCompare(right.name, "ko-KR")),
      }))
      .sort((left, right) =>
        left.district.localeCompare(right.district, "ko-KR"),
      );
  }

  findBranch(publicId: string): BranchSummary | undefined {
    return this.#branches.find((branch) => branch.publicId === publicId);
  }

  listSavedBranches(userId: string): BranchSummary[] {
    const saved = this.#savedBranches.get(userId);
    if (!saved) return [];

    return [...saved]
      .map((publicId) => this.findBranch(publicId))
      .filter((branch): branch is BranchSummary => branch !== undefined);
  }

  saveBranch(userId: string, publicId: string): BranchSummary | undefined {
    const branch = this.findBranch(publicId);
    if (!branch) return undefined;

    const saved = this.#savedBranches.get(userId) ?? new Set<string>();
    saved.add(publicId);
    this.#savedBranches.set(userId, saved);
    return branch;
  }

  removeSavedBranch(userId: string, publicId: string): void {
    const saved = this.#savedBranches.get(userId);
    if (!saved) return;

    saved.delete(publicId);
    if (saved.size === 0) this.#savedBranches.delete(userId);
  }

  mergeSavedBranches(userId: string, publicIds: string[]): BranchSummary[] {
    const saved = this.#savedBranches.get(userId) ?? new Set<string>();
    for (const publicId of publicIds) {
      if (this.findBranch(publicId)) saved.add(publicId);
    }
    if (saved.size > 0) this.#savedBranches.set(userId, saved);
    return this.listSavedBranches(userId);
  }

  listCandidates(status: CandidateStatus = "pending"): IngestionCandidate[] {
    return [...this.#candidates.values()].filter(
      (candidate) => candidate.status === status,
    );
  }

  reviewCandidate(
    id: string,
    decision: Extract<CandidateStatus, "approved" | "rejected">,
  ): IngestionCandidate | undefined {
    const candidate = this.#candidates.get(id);
    if (!candidate || candidate.status !== "pending") {
      return undefined;
    }

    const reviewed = { ...candidate, status: decision };
    this.#candidates.set(id, reviewed);
    return reviewed;
  }

  listReviews(branchPublicId: string): ReviewSummary[] {
    return this.#reviews
      .filter(
        (review) =>
          review.branchPublicId === branchPublicId &&
          review.status === "published",
      )
      .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(toReviewSummary);
  }

  createReview(
    branchPublicId: string,
    reviewer: ReviewerIdentity,
    submission: ReviewSubmission,
  ): ReviewSummary | undefined {
    const branch = this.#branches.find(
      (candidate) => candidate.publicId === branchPublicId,
    );
    if (!branch) return undefined;

    if (
      this.#reviews.some(
        (review) =>
          review.branchPublicId === branchPublicId &&
          review.reviewerUserId === reviewer.userId,
      )
    ) {
      throw new DuplicateReviewError();
    }

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentCount = this.#reviews.filter(
      (review) =>
        review.reviewerUserId === reviewer.userId &&
        new Date(review.createdAt).getTime() >= oneDayAgo,
    ).length;
    if (recentCount >= 5) throw new ReviewRateLimitError();

    const review: StoredReview = {
      publicId: createPublicId("rv"),
      branchPublicId,
      branchName: branch.name,
      reviewerUserId: reviewer.userId,
      authorName: submission.authorName,
      rating: submission.rating,
      body: submission.body,
      visitedOn: submission.visitedOn,
      identityVerified: reviewer.identityVerified,
      independentVisitAttested: submission.independentVisitAttested,
      usageType: submission.usageType,
      visitVerification: "self_reported",
      status: "published",
      createdAt: new Date().toISOString(),
    };
    this.#reviews.push(review);
    this.#refreshRating(branchPublicId);
    return toReviewSummary(review);
  }

  listRecentReviews(status: ReviewStatus = "published"): OpsReview[] {
    return this.#reviews
      .filter((review) => review.status === status)
      .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(toOpsReview);
  }

  hideReview(publicId: string): OpsReview | undefined {
    const review = this.#reviews.find(
      (candidate) =>
        candidate.publicId === publicId && candidate.status === "published",
    );
    if (!review) return undefined;

    review.status = "hidden";
    this.#refreshRating(review.branchPublicId);
    return toOpsReview(review);
  }

  createReviewReport(
    reviewPublicId: string,
    reporterUserId: string | null,
    submission: ReviewReportSubmission,
  ): ReviewReportSummary | undefined {
    const review = this.#reviews.find(
      (candidate) => candidate.publicId === reviewPublicId,
    );
    if (!review) return undefined;

    if (
      reporterUserId &&
      this.#reports.some(
        (report) =>
          report.reporterUserId === reporterUserId &&
          report.reviewPublicId === reviewPublicId &&
          report.reason === submission.reason,
      )
    ) {
      throw new DuplicateReviewReportError();
    }

    const report: StoredReviewReport = {
      publicId: createPublicId("rr"),
      reviewPublicId: review.publicId,
      branchPublicId: review.branchPublicId,
      branchName: review.branchName,
      reviewAuthorName: review.authorName,
      reviewBody: review.body,
      reason: submission.reason,
      detail: submission.detail,
      reporterAuthenticated: Boolean(reporterUserId),
      reporterUserId,
      status: "pending",
      decisionNote: null,
      decidedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.#reports.push(report);
    return toReviewReportSummary(report);
  }

  listReviewReports(status: ReviewReportStatus = "pending"): OpsReviewReport[] {
    return this.#reports
      .filter((report) => report.status === status)
      .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(toOpsReviewReport);
  }

  decideReviewReport(
    publicId: string,
    decision: ReviewReportDecision,
    note: string,
    _operator: string,
  ): OpsReviewReport | undefined {
    const report = this.#reports.find(
      (candidate) =>
        candidate.publicId === publicId && candidate.status === "pending",
    );
    if (!report) return undefined;

    report.status = decision;
    report.decisionNote = note;
    report.decidedAt = new Date().toISOString();
    return toOpsReviewReport(report);
  }

  #refreshRating(branchPublicId: string): void {
    const branch = this.#branches.find(
      (candidate) => candidate.publicId === branchPublicId,
    );
    if (!branch) return;

    const published = this.#reviews.filter(
      (review) =>
        review.branchPublicId === branchPublicId &&
        review.status === "published",
    );
    branch.reviewCount = published.length;
    branch.rating = published.length
      ? Number(
          (
            published.reduce((sum, review) => sum + review.rating, 0) /
            published.length
          ).toFixed(2),
        )
      : null;
  }
}

interface StoredReview extends OpsReview {
  reviewerUserId: string;
  reviewerEmail?: string;
}

interface StoredReviewReport extends OpsReviewReport {
  reporterUserId: string | null;
}

function toReviewSummary(review: StoredReview): ReviewSummary {
  return {
    publicId: review.publicId,
    authorName: review.authorName,
    rating: review.rating,
    body: review.body,
    visitedOn: review.visitedOn,
    identityVerified: review.identityVerified,
    independentVisitAttested: review.independentVisitAttested ?? null,
    usageType: review.usageType ?? null,
    visitVerification: review.visitVerification,
    createdAt: review.createdAt,
  };
}

function toOpsReview(review: StoredReview): OpsReview {
  const {
    reviewerUserId: _reviewerUserId,
    reviewerEmail: _reviewerEmail,
    ...publicReview
  } = review;
  return { ...publicReview };
}

function toReviewReportSummary(
  report: StoredReviewReport,
): ReviewReportSummary {
  return {
    publicId: report.publicId,
    status: report.status,
    createdAt: report.createdAt,
  };
}

function toOpsReviewReport(report: StoredReviewReport): OpsReviewReport {
  const { reporterUserId: _reporterUserId, ...publicReport } = report;
  return { ...publicReport };
}

export {
  SYNTHETIC_BRANCHES,
  SYNTHETIC_CANDIDATES,
  SYNTHETIC_DEMO_USER,
  SYNTHETIC_REVIEWS,
} from "./fixtures.js";
export { PostgresCatalog } from "./postgres-catalog.js";
export {
  DuplicateReviewError,
  DuplicateReviewReportError,
  ReviewRateLimitError,
} from "./review-errors.js";
export type { ReviewerIdentity } from "./reviewer-identity.js";
