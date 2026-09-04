import { createDatabase } from "@dorak/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PostgresCatalog } from "./postgres-catalog.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("PostgresCatalog integration", () => {
  const catalog = new PostgresCatalog(databaseUrl!, { maxConnections: 1 });
  const database = createDatabase(databaseUrl!, { maxConnections: 1 });
  const reviewerId = "01991b38-6800-7000-9000-000000009999";

  beforeAll(async () => {
    await database.raw`
      INSERT INTO identity.users (id, name, email, email_verified)
      VALUES (
        ${reviewerId}::uuid,
        '통합테스터',
        'integration-reviewer@dorak.local',
        false
      )
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    await database.raw`
      DELETE FROM community.reviews WHERE reviewer_user_id = ${reviewerId}::uuid
    `;
    await database.raw`
      DELETE FROM identity.users WHERE id = ${reviewerId}::uuid
    `;
    await database.close();
    await catalog.close();
  });

  it("searches normalized branch text and menu fields", async () => {
    const result = await catalog.searchBranches("들기름");

    expect(result.data.map((branch) => branch.name)).toContain("골목 제면소");
  });

  it("groups active branches by district and neighborhood", async () => {
    const locations = await catalog.listLocations();
    const branchCount = locations.reduce(
      (total, location) => total + location.count,
      0,
    );

    expect(locations.length).toBeGreaterThan(0);
    expect(branchCount).toBeGreaterThan(0);
  });

  it("uses trigram similarity for a misspelled restaurant name", async () => {
    const result = await catalog.searchBranches("골목 제면쇼");

    expect(result.data[0]?.name).toBe("골목 제면소");
  });

  it("returns PostgreSQL timestamps as API-safe ISO strings", async () => {
    const candidates = await catalog.listCandidates();

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("publishes, aggregates, lists, and moderates a review", async () => {
    const branchPublicId = "br_L3nF8wQ2cV6jH9pB4sYk";
    const review = await catalog.createReview(
      branchPublicId,
      { userId: reviewerId, identityVerified: false },
      {
        authorName: "통합테스터",
        rating: 5,
        body: "숯불 향이 선명했고 채소와 고기의 구성이 좋아 다시 방문하고 싶습니다.",
        visitedOn: "2026-09-02",
        visitAttested: true,
      },
    );

    expect(review).toMatchObject({
      rating: 5,
      identityVerified: false,
      visitVerification: "self_reported",
    });
    expect(await catalog.findBranch(branchPublicId)).toMatchObject({
      rating: 5,
      reviewCount: 1,
    });
    expect((await catalog.listReviews(branchPublicId))[0]?.publicId).toBe(
      review?.publicId,
    );
    expect(
      (await catalog.listRecentReviews()).some(
        (candidate) => candidate.publicId === review?.publicId,
      ),
    ).toBe(true);

    expect((await catalog.hideReview(review!.publicId))?.status).toBe("hidden");
    expect(await catalog.findBranch(branchPublicId)).toMatchObject({
      rating: null,
      reviewCount: 0,
    });
  });
});
