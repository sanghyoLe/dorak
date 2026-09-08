import { describe, expect, it } from "vitest";

import { validateReviewReportSubmission } from "./review-report-validation";

const validReport = {
  reason: "false_experience",
  detail: "리뷰에 실제 주문 경험이 아닌 내용이 있어 확인이 필요합니다.",
  website: "",
};

describe("validateReviewReportSubmission", () => {
  it("accepts every policy report reason", () => {
    for (const reason of [
      "false_experience",
      "undisclosed_interest",
      "privacy",
      "harassment",
      "discrimination",
      "threat_safety",
      "advertising_spam",
      "copyright",
      "restaurant_info",
      "other",
    ]) {
      expect(
        validateReviewReportSubmission({ ...validReport, reason }),
      ).toMatchObject({ ok: true, value: { reason } });
    }
  });

  it("normalizes report detail", () => {
    const result = validateReviewReportSubmission({
      ...validReport,
      detail: "  리뷰 본문에서\n\n\n확인이 필요한 부분입니다.  ",
    });

    expect(result).toMatchObject({
      ok: true,
      value: { detail: "리뷰 본문에서\n\n확인이 필요한 부분입니다." },
    });
  });

  it("rejects invalid reason, short detail, and automated submissions", () => {
    expect(
      validateReviewReportSubmission({ ...validReport, reason: "low_rating" }),
    ).toMatchObject({ ok: false, code: "INVALID_REPORT_REASON" });
    expect(
      validateReviewReportSubmission({ ...validReport, detail: "짧음" }),
    ).toMatchObject({ ok: false, code: "INVALID_REPORT_DETAIL" });
    expect(
      validateReviewReportSubmission({ ...validReport, website: "spam" }),
    ).toMatchObject({ ok: false, code: "AUTOMATED_SUBMISSION_REJECTED" });
  });
});
