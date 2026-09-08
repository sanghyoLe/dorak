import type { ReviewSummary, ReviewUsageType } from "@dorak/domain-types";

export const REVIEW_USAGE_LABELS = {
  dine_in: "매장 식사",
  takeout: "포장",
  delivery: "배달",
} as const satisfies Record<ReviewUsageType, string>;

export type ReviewUsageFilter = ReviewUsageType | "unknown" | "all";

export function isReviewUsageType(value: unknown): value is ReviewUsageType {
  return value === "dine_in" || value === "takeout" || value === "delivery";
}

export function parseReviewUsageFilter(value: unknown): ReviewUsageFilter {
  return isReviewUsageType(value) || value === "unknown" ? value : "all";
}

export function filterReviewsByUsage(
  reviews: ReviewSummary[],
  usage: ReviewUsageFilter,
) {
  return reviews.filter(
    (review) => usage === "all" || (review.usageType ?? "unknown") === usage,
  );
}

export function summarizeReviewUsage(reviews: ReviewSummary[]) {
  return (["dine_in", "takeout", "delivery", "unknown"] as const).map(
    (usage) => {
      const matching = filterReviewsByUsage(reviews, usage);
      return {
        usage,
        label:
          usage === "unknown" ? "이용 방식 미확인" : REVIEW_USAGE_LABELS[usage],
        count: matching.length,
        rating: matching.length
          ? matching.reduce((sum, review) => sum + review.rating, 0) /
            matching.length
          : null,
      };
    },
  );
}
