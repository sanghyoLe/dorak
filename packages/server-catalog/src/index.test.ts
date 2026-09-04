import { describe, expect, it } from "vitest";

import {
  InMemoryCatalog,
  ReviewRateLimitError,
  SYNTHETIC_DEMO_USER,
} from "./index.js";

const reviewSubmission = {
  authorName: "도락테스터",
  rating: 5,
  body: "숯불 향과 제철 채소의 조합이 좋았고 저녁에 다시 방문하고 싶습니다.",
  visitedOn: "2026-09-02",
  visitAttested: true as const,
};

describe("InMemoryCatalog", () => {
  it("searches by neighborhood and menu", () => {
    const catalog = new InMemoryCatalog();

    expect(catalog.searchBranches("망원").data).toHaveLength(1);
    expect(catalog.searchBranches("들기름").data[0]?.name).toBe("골목 제면소");
  });

  it("filters by cuisine", () => {
    const catalog = new InMemoryCatalog();

    expect(catalog.searchBranches("", "cafe").data).toHaveLength(1);
  });

  it("applies a candidate review once", () => {
    const catalog = new InMemoryCatalog();
    const candidate = catalog.listCandidates()[0];

    expect(candidate).toBeDefined();
    expect(catalog.reviewCandidate(candidate!.id, "approved")?.status).toBe(
      "approved",
    );
    expect(catalog.reviewCandidate(candidate!.id, "rejected")).toBeUndefined();
  });

  it("publishes one review per account and refreshes the public score", () => {
    const catalog = new InMemoryCatalog();
    const publicId = "br_L3nF8wQ2cV6jH9pB4sYk";
    const reviewer = {
      userId: SYNTHETIC_DEMO_USER.id,
      identityVerified: false,
    };

    const review = catalog.createReview(publicId, reviewer, reviewSubmission);

    expect(review?.visitVerification).toBe("self_reported");
    expect(catalog.findBranch(publicId)).toMatchObject({
      rating: 5,
      reviewCount: 1,
    });
    expect(() =>
      catalog.createReview(publicId, reviewer, reviewSubmission),
    ).toThrow("one review per branch");

    expect(catalog.hideReview(review!.publicId)?.status).toBe("hidden");
    expect(catalog.findBranch(publicId)).toMatchObject({
      rating: null,
      reviewCount: 0,
    });
  });

  it("limits an account to five reviews per day", () => {
    const catalog = new InMemoryCatalog();
    const reviewer = {
      userId: SYNTHETIC_DEMO_USER.id,
      identityVerified: false,
    };
    const branches = catalog.searchBranches().data;

    for (const branch of branches.slice(0, 5)) {
      catalog.createReview(branch.publicId, reviewer, reviewSubmission);
    }

    expect(() =>
      catalog.createReview(branches[5]!.publicId, reviewer, reviewSubmission),
    ).toThrow(ReviewRateLimitError);
  });
});
