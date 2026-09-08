import type { ReviewSummary } from "@dorak/domain-types";
import { describe, expect, it } from "vitest";
import {
  filterReviewsByUsage,
  parseReviewUsageFilter,
  summarizeReviewUsage,
} from "./review-usage";

const makeReview = (
  rating: number,
  usageType?: ReviewSummary["usageType"],
): ReviewSummary => ({
  publicId: `test-${rating}-${usageType}`,
  authorName: "테스터",
  rating,
  body: "식사 경험",
  visitedOn: "2026-09-01",
  identityVerified: false,
  visitVerification: "self_reported",
  createdAt: "2026-09-02",
  ...(usageType === undefined ? {} : { usageType }),
});

describe("review usage", () => {
  it("keeps legacy reviews separate and calculates each mean from its own reviews", () => {
    const reviews = [
      makeReview(5, "dine_in"),
      makeReview(4, "delivery"),
      makeReview(2, "delivery"),
      makeReview(1),
      makeReview(3, null),
    ];
    expect(summarizeReviewUsage(reviews)).toEqual([
      { usage: "dine_in", label: "매장 식사", count: 1, rating: 5 },
      { usage: "takeout", label: "포장", count: 0, rating: null },
      { usage: "delivery", label: "배달", count: 2, rating: 3 },
      { usage: "unknown", label: "이용 방식 미확인", count: 2, rating: 2 },
    ]);
    expect(filterReviewsByUsage(reviews, "all")).toHaveLength(5);
    expect(filterReviewsByUsage(reviews, "unknown")).toHaveLength(2);
    expect(filterReviewsByUsage(reviews, "takeout")).toEqual([]);
    expect(
      filterReviewsByUsage(reviews, "delivery").every(
        (review) => review.usageType === "delivery",
      ),
    ).toBe(true);
  });

  it("does not turn an empty group into a zero-star rating", () => {
    expect(
      summarizeReviewUsage([]).every(
        (group) => group.rating === null && group.count === 0,
      ),
    ).toBe(true);
  });

  it.each([undefined, "bad", ["delivery"], "toString"])(
    "falls back to all for invalid URL values: %s",
    (value) => {
      expect(parseReviewUsageFilter(value)).toBe("all");
    },
  );

  it.each(["dine_in", "takeout", "delivery", "unknown"])(
    "recognizes filter %s",
    (value) => {
      expect(parseReviewUsageFilter(value)).toBe(value);
    },
  );
});
