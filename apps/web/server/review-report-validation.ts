import type {
  ReviewReportReason,
  ReviewReportSubmission,
} from "@dorak/domain-types";
import { REVIEW_REPORT_REASON_LABELS } from "../lib/review-reports";

export { REVIEW_REPORT_REASON_LABELS } from "../lib/review-reports";

const REASONS = new Set(Object.keys(REVIEW_REPORT_REASON_LABELS));

type ValidationResult =
  | { ok: true; value: ReviewReportSubmission }
  | { ok: false; code: string; message: string };

function characterLength(value: string): number {
  return Array.from(value).length;
}

function normalizeDetail(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/gu, "\n")
    .replace(/[\t ]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function isReviewReportReason(
  value: unknown,
): value is ReviewReportReason {
  return typeof value === "string" && REASONS.has(value);
}

export function validateReviewReportSubmission(
  input: unknown,
): ValidationResult {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      code: "INVALID_REPORT",
      message: "신고 내용을 확인해 주세요.",
    };
  }

  const candidate = input as Record<string, unknown>;
  if (typeof candidate.website === "string" && candidate.website.trim()) {
    return {
      ok: false,
      code: "AUTOMATED_SUBMISSION_REJECTED",
      message: "신고를 접수하지 못했습니다.",
    };
  }

  if (!isReviewReportReason(candidate.reason)) {
    return {
      ok: false,
      code: "INVALID_REPORT_REASON",
      message: "신고 사유를 선택해 주세요.",
    };
  }

  const detail =
    typeof candidate.detail === "string"
      ? normalizeDetail(candidate.detail)
      : "";
  if (characterLength(detail) < 10 || characterLength(detail) > 1000) {
    return {
      ok: false,
      code: "INVALID_REPORT_DETAIL",
      message: "문제가 되는 부분을 10~1000자로 구체적으로 적어 주세요.",
    };
  }

  return { ok: true, value: { reason: candidate.reason, detail } };
}
