import { describe, expect, it } from "vitest";

import { validateReviewSubmission } from "./review-validation";

const validReview = {
  usageType: "dine_in",
  authorName: "서울미식",
  rating: 4,
  body: "맑은 육수와 면의 탄력이 좋았고 다시 방문하고 싶은 식당입니다.",
  visitedOn: "2026-09-02",
  visitAttested: true,
  independentVisitAttested: true,
  website: "",
};

describe("validateReviewSubmission", () => {
  it.each(["dine_in", "takeout", "delivery"])(
    "accepts %s meals",
    (usageType) => {
      expect(
        validateReviewSubmission({ ...validReview, usageType }),
      ).toMatchObject({ ok: true, value: { usageType } });
    },
  );

  it.each([undefined, null, "unknown", "", "DELIVERY", 1, ["delivery"]])(
    "rejects invalid usage: %s",
    (usageType) => {
      expect(
        validateReviewSubmission({ ...validReview, usageType }),
      ).toMatchObject({ ok: false, code: "INVALID_USAGE_TYPE" });
    },
  );

  it.each([undefined, null, false, "true", 1])(
    "rejects missing or invalid independence declaration: %s",
    (independentVisitAttested) => {
      expect(
        validateReviewSubmission({ ...validReview, independentVisitAttested }),
      ).toMatchObject({ ok: false, code: "INDEPENDENT_VISIT_REQUIRED" });
    },
  );

  it("normalizes and accepts a concrete visit review", () => {
    const result = validateReviewSubmission(
      { ...validReview, body: `  ${validReview.body}  ` },
      new Date("2026-09-03T10:00:00.000Z"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.body).toBe(validReview.body);
  });

  it("does not accept client-supplied verification badges", () => {
    const result = validateReviewSubmission({
      ...validReview,
      identityVerified: true,
      visitVerification: "receipt",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.independentVisitAttested).toBe(true);
      expect(result.value).not.toHaveProperty("identityVerified");
      expect(result.value).not.toHaveProperty("visitVerification");
    }
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
