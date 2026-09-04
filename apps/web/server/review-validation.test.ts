import { describe, expect, it } from "vitest";

import { validateReviewSubmission } from "./review-validation";

const validReview = {
  authorName: "서울미식",
  rating: 4,
  body: "맑은 육수와 면의 탄력이 좋았고 다시 방문하고 싶은 식당입니다.",
  visitedOn: "2026-09-02",
  visitAttested: true,
  website: "",
};

describe("validateReviewSubmission", () => {
  it("normalizes and accepts a concrete visit review", () => {
    const result = validateReviewSubmission(
      { ...validReview, body: `  ${validReview.body}  ` },
      new Date("2026-09-03T10:00:00.000Z"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.body).toBe(validReview.body);
  });

  it("requires an actual visit attestation", () => {
    const result = validateReviewSubmission(
      { ...validReview, visitAttested: false },
      new Date("2026-09-03T10:00:00.000Z"),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "VISIT_ATTESTATION_REQUIRED",
    });
  });

  it("rejects future dates, short content, and promotional links", () => {
    const now = new Date("2026-09-03T10:00:00.000Z");

    expect(
      validateReviewSubmission(
        { ...validReview, visitedOn: "2026-09-04" },
        now,
      ),
    ).toMatchObject({ ok: false, code: "INVALID_VISIT_DATE" });
    expect(
      validateReviewSubmission({ ...validReview, body: "좋아요" }, now),
    ).toMatchObject({ ok: false, code: "INVALID_REVIEW_BODY" });
    expect(
      validateReviewSubmission(
        { ...validReview, body: `${validReview.body} https://spam.example` },
        now,
      ),
    ).toMatchObject({ ok: false, code: "PROMOTIONAL_LINK_NOT_ALLOWED" });
  });
});
