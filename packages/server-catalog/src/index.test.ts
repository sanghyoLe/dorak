import { describe, expect, it } from "vitest";

import {
  InMemoryCatalog,
  ReviewRateLimitError,
  SYNTHETIC_DEMO_USER,
} from "./index.js";

const reviewSubmission = {
  usageType: "delivery" as const,
  authorName: "도락테스터",
  rating: 5,
  body: "숯불 향과 제철 채소의 조합이 좋았고 저녁에 다시 방문하고 싶습니다.",
  visitedOn: "2026-09-02",
  visitAttested: true as const,
  independentVisitAttested: true as const,
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

  it("groups all branches by district and neighborhood", () => {
    const catalog = new InMemoryCatalog();
    const locations = catalog.listLocations();

    expect(locations).toHaveLength(5);
    expect(
      locations.find((location) => location.district === "마포구"),
    ).toMatchObject({
      count: 2,
      neighborhoods: [
        { name: "망원동", count: 1 },
        { name: "연남동", count: 1 },
      ],
    });
  });

  it("saves, lists, merges, and removes branches per account", () => {
    const catalog = new InMemoryCatalog();
    const userId = "01991b38-6800-7000-9000-000000000999";
    const first = "br_Zk8sD1mP4qR7vT2xN5cA";
    const second = "br_L3nF8wQ2cV6jH9pB4sYk";

    expect(catalog.listSavedBranches(userId)).toEqual([]);
    expect(catalog.saveBranch(userId, first)?.publicId).toBe(first);
    expect(
      catalog.mergeSavedBranches(userId, [first, second, "missing"]),
    ).toEqual([catalog.findBranch(first), catalog.findBranch(second)]);

    catalog.removeSavedBranch(userId, first);
    expect(
      catalog.listSavedBranches(userId).map((branch) => branch.publicId),
    ).toEqual([second]);
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

  it("does not backfill declarations on existing reviews", () => {
    const catalog = new InMemoryCatalog();
    const reviews = catalog.listReviews("br_Zk8sD1mP4qR7vT2xN5cA");
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every((review) => review.usageType === null)).toBe(true);
    expect(
      reviews.every((review) => review.independentVisitAttested === null),
    ).toBe(true);
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
    expect(review?.independentVisitAttested).toBe(true);
    expect(review?.usageType).toBe("delivery");
    expect(catalog.listReviews(publicId)[0]?.usageType).toBe("delivery");
    expect(catalog.listReviews(publicId)[0]?.independentVisitAttested).toBe(
      true,
    );
    expect(catalog.findBranch(publicId)).toMatchObject({
      rating: 5,
      reviewCount: 1,
    });
    expect(() =>
      catalog.createReview(publicId, reviewer, reviewSubmission),
    ).toThrow("one review per branch");

    expect(catalog.hideReview(review!.publicId)).toMatchObject({
      status: "hidden",
      independentVisitAttested: true,
    });
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

  it("keeps review reports private until an operator decides them", () => {
    const catalog = new InMemoryCatalog();
    const review = catalog.listReviews("br_Zk8sD1mP4qR7vT2xN5cA")[0]!;

    const report = catalog.createReviewReport(
      review.publicId,
      "01991b38-6800-7000-9000-000000000999",
      {
        reason: "false_experience",
        detail:
          "리뷰에 실제로 주문한 메뉴와 이용 시점이 적혀 있지 않아 확인이 필요합니다.",
      },
    );

    expect(report).toMatchObject({ status: "pending" });
    expect(catalog.listReviewReports()).toHaveLength(1);
    expect(catalog.listReviewReports()[0]).toMatchObject({
      reviewPublicId: review.publicId,
      detail:
        "리뷰에 실제로 주문한 메뉴와 이용 시점이 적혀 있지 않아 확인이 필요합니다.",
      reporterAuthenticated: true,
    });

    expect(
      catalog.decideReviewReport(
        report!.publicId,
        "resolved",
        "리뷰 작성자에게 이용 경험 확인을 요청하고 신고를 처리했습니다.",
        "local",
      ),
    ).toMatchObject({ status: "resolved" });
    expect(catalog.listReviewReports()).toEqual([]);
  });
});
