import { createHash } from "node:crypto";

import { createDatabase } from "@dorak/db";

import {
  SYNTHETIC_BRANCHES,
  SYNTHETIC_CANDIDATES,
  SYNTHETIC_DEMO_USER,
  SYNTHETIC_REVIEWS,
} from "./fixtures.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for the synthetic seed.");
}

const database = createDatabase(databaseUrl);
const cuisineKeyByLabel = new Map(
  SYNTHETIC_BRANCHES.map((branch) => [branch.cuisineLabel, branch.cuisine]),
);

try {
  await database.raw.begin(async (transaction) => {
    const [source] = await transaction<{ id: string }[]>`
      INSERT INTO ingestion.sources (source_key, display_name, provenance)
      VALUES ('dorak.synthetic.seed', '도락 합성 개발 데이터', 'synthetic')
      ON CONFLICT (source_key) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          provenance = EXCLUDED.provenance,
          is_enabled = true
      RETURNING id::text
    `;

    if (!source) throw new Error("Synthetic source could not be created.");

    for (const candidate of SYNTHETIC_CANDIDATES) {
      const payload = {
        name: candidate.proposedName,
        address: candidate.proposedAddress,
        cuisineLabel: candidate.cuisineLabel,
      };
      const checksum = createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");
      const [rawDocument] = await transaction<{ id: string }[]>`
        INSERT INTO ingestion.raw_documents (
          source_id,
          source_record_id,
          payload,
          payload_sha256,
          fetched_at
        ) VALUES (
          ${source.id}::uuid,
          ${candidate.sourceRecordId},
          ${JSON.stringify(payload)}::jsonb,
          ${checksum},
          ${candidate.createdAt}
        )
        ON CONFLICT (source_id, source_record_id, payload_sha256) DO UPDATE
        SET source_record_id = EXCLUDED.source_record_id
        RETURNING id::text
      `;

      if (!rawDocument)
        throw new Error("Synthetic raw document could not be created.");

      await transaction`
        INSERT INTO ops.branch_candidates (
          public_id,
          raw_document_id,
          proposed_name,
          proposed_address,
          proposed_cuisine_key,
          normalized_payload,
          confidence,
          created_at
        ) VALUES (
          ${candidate.id},
          ${rawDocument.id}::uuid,
          ${candidate.proposedName},
          ${candidate.proposedAddress},
          ${cuisineKeyByLabel.get(candidate.cuisineLabel) ?? "korean"},
          ${JSON.stringify(payload)}::jsonb,
          ${candidate.confidence},
          ${candidate.createdAt}
        )
        ON CONFLICT (public_id) DO UPDATE
        SET proposed_name = EXCLUDED.proposed_name,
            proposed_address = EXCLUDED.proposed_address,
            proposed_cuisine_key = EXCLUDED.proposed_cuisine_key,
            normalized_payload = EXCLUDED.normalized_payload,
            confidence = EXCLUDED.confidence
      `;
    }

    for (const branch of SYNTHETIC_BRANCHES) {
      await transaction`
        INSERT INTO catalog.branches (
          id,
          public_id,
          name,
          neighborhood,
          district,
          road_address,
          cuisine_key,
          short_description,
          price_band,
          signature_menu,
          rating,
          review_count,
          provenance,
          source_key,
          source_record_id
        ) VALUES (
          ${branch.id}::uuid,
          ${branch.publicId},
          ${branch.name},
          ${branch.neighborhood},
          ${branch.district},
          ${branch.address},
          ${branch.cuisine},
          ${branch.shortDescription},
          ${branch.priceBand?.length ?? null},
          ${transaction.array([...branch.signatureMenu])},
          ${branch.rating},
          ${branch.reviewCount},
          ${branch.provenance},
          'dorak.synthetic.seed',
          ${branch.publicId}
        )
        ON CONFLICT (public_id) DO UPDATE
        SET name = EXCLUDED.name,
            neighborhood = EXCLUDED.neighborhood,
            district = EXCLUDED.district,
            road_address = EXCLUDED.road_address,
            cuisine_key = EXCLUDED.cuisine_key,
            short_description = EXCLUDED.short_description,
            price_band = EXCLUDED.price_band,
            signature_menu = EXCLUDED.signature_menu,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            provenance = EXCLUDED.provenance,
            source_key = EXCLUDED.source_key,
            source_record_id = EXCLUDED.source_record_id,
            updated_at = now()
      `;
    }

    for (const review of SYNTHETIC_REVIEWS) {
      await transaction`
        INSERT INTO identity.users (
          id,
          name,
          email,
          email_verified
        ) VALUES (
          ${review.reviewerUserId}::uuid,
          ${review.authorName},
          ${review.reviewerEmail},
          false
        )
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            updated_at = now()
      `;

      await transaction`
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
          visit_verification,
          status,
          created_at
        )
        SELECT
          ${review.publicId},
          branch.id,
          ${review.reviewerUserId}::uuid,
          ${review.authorName},
          ${review.rating},
          ${review.body},
          ${review.visitedOn}::date,
          true,
          ${review.identityVerified},
          ${review.visitVerification},
          ${review.status},
          ${review.createdAt}
        FROM catalog.branches AS branch
        WHERE branch.public_id = ${review.branchPublicId}
        ON CONFLICT (public_id) DO UPDATE
        SET author_name = EXCLUDED.author_name,
            rating = EXCLUDED.rating,
            body = EXCLUDED.body,
            visited_on = EXCLUDED.visited_on,
            identity_verified = EXCLUDED.identity_verified,
            visit_verification = EXCLUDED.visit_verification,
            status = EXCLUDED.status,
            updated_at = now()
      `;
    }

    await transaction`
      INSERT INTO identity.users (
        id,
        name,
        email,
        email_verified
      ) VALUES (
        ${SYNTHETIC_DEMO_USER.id}::uuid,
        ${SYNTHETIC_DEMO_USER.name},
        ${SYNTHETIC_DEMO_USER.email},
        false
      )
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          email = EXCLUDED.email,
          updated_at = now()
    `;
  });

  console.log(
    `synthetic seed: ${SYNTHETIC_BRANCHES.length} branches, ${SYNTHETIC_CANDIDATES.length} candidates, ${SYNTHETIC_REVIEWS.length} reviews`,
  );
} finally {
  await database.close();
}
