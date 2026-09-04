import type {
  BranchSearchResponse,
  BranchSummary,
  CandidateStatus,
  IngestionCandidate,
  OpsReview,
  ReviewStatus,
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
import { DuplicateReviewError, ReviewRateLimitError } from "./review-errors.js";
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

  constructor() {
    this.#branches = SYNTHETIC_BRANCHES.map((branch) => ({ ...branch }));
    this.#reviews = SYNTHETIC_REVIEWS.map((review) => ({ ...review }));
    for (const branch of this.#branches) this.#refreshRating(branch.publicId);
  }

  searchBranches(
    query = "",
    cuisine?: string,
    options: Readonly<{
      limit?: number;
      offset?: number;
      approvedOnly?: boolean;
    }> = {},
  ): BranchSearchResponse {
    const needle = normalise(query);
    const data = this.#branches.filter((branch) => {
      const matchesProvenance =
        !options.approvedOnly || branch.provenance === "approved_source";
      const matchesCuisine = !cuisine || branch.cuisine === cuisine;
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
        (!needle || haystack.includes(needle))
      );
    });

    const total = data.length;
    const limit = Math.min(Math.max(Math.trunc(options.limit ?? 100), 1), 200);
    const offset = Math.max(Math.trunc(options.offset ?? 0), 0);

    return {
      data: data.slice(offset, offset + limit),
      meta: {
        query,
        total,
        dataMode: "memory",
      },
    };
  }

  findBranch(publicId: string): BranchSummary | undefined {
    return this.#branches.find((branch) => branch.publicId === publicId);
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

function toReviewSummary(review: StoredReview): ReviewSummary {
  return {
    publicId: review.publicId,
    authorName: review.authorName,
    rating: review.rating,
    body: review.body,
    visitedOn: review.visitedOn,
    identityVerified: review.identityVerified,
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

export {
  SYNTHETIC_BRANCHES,
  SYNTHETIC_CANDIDATES,
  SYNTHETIC_DEMO_USER,
  SYNTHETIC_REVIEWS,
} from "./fixtures.js";
export { PostgresCatalog } from "./postgres-catalog.js";
export { DuplicateReviewError, ReviewRateLimitError } from "./review-errors.js";
export type { ReviewerIdentity } from "./reviewer-identity.js";
