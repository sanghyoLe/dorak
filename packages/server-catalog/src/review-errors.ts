export class DuplicateReviewError extends Error {
  constructor() {
    super("A reviewer can publish only one review per branch.");
    this.name = "DuplicateReviewError";
  }
}

export class ReviewRateLimitError extends Error {
  constructor() {
    super("The reviewer has submitted too many reviews recently.");
    this.name = "ReviewRateLimitError";
  }
}
