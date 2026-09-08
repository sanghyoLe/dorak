import type { ReviewSubmission } from "@dorak/domain-types";
import { isReviewUsageType } from "../lib/review-usage";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LINK_PATTERN = /(?:https?:\/\/|www\.)/iu;

type ValidationResult =
  | { ok: true; value: ReviewSubmission }
  | { ok: false; code: string; message: string };

function characterLength(value: string): number {
  return Array.from(value).length;
}

function normalizeBody(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/gu, "\n")
    .replace(/[\t ]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function isRealPastOrPresentDate(value: string, now: Date): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  if (parsed.toISOString().slice(0, 10) !== value) return false;
  return value <= now.toISOString().slice(0, 10);
}

export function validateReviewSubmission(
  input: unknown,
  now = new Date(),
): ValidationResult {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      code: "INVALID_REVIEW",
      message: "리뷰 내용을 확인해 주세요.",
    };
  }

  const candidate = input as Record<string, unknown>;
  if (!isReviewUsageType(candidate.usageType)) {
    return {
      ok: false,
      code: "INVALID_USAGE_TYPE",
      message: "매장 식사·포장·배달 중 이용 방식을 선택해 주세요.",
    };
  }
  if (typeof candidate.website === "string" && candidate.website.trim()) {
    return {
      ok: false,
      code: "AUTOMATED_SUBMISSION_REJECTED",
      message: "리뷰를 등록하지 못했습니다.",
    };
  }

  const authorName =
    typeof candidate.authorName === "string"
      ? candidate.authorName.normalize("NFKC").trim().replace(/\s+/gu, " ")
      : "";
  if (characterLength(authorName) < 2 || characterLength(authorName) > 20) {
    return {
      ok: false,
      code: "INVALID_AUTHOR_NAME",
      message: "공개 닉네임은 2~20자로 입력해 주세요.",
    };
  }

  const rating = Number(candidate.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      ok: false,
      code: "INVALID_RATING",
      message: "평점은 1점부터 5점 사이에서 선택해 주세요.",
    };
  }

  const body =
    typeof candidate.body === "string" ? normalizeBody(candidate.body) : "";
  if (characterLength(body) < 20 || characterLength(body) > 1000) {
    return {
      ok: false,
      code: "INVALID_REVIEW_BODY",
      message: "리뷰는 실제 식사 경험을 담아 20~1000자로 작성해 주세요.",
    };
  }
  if (LINK_PATTERN.test(body)) {
    return {
      ok: false,
      code: "PROMOTIONAL_LINK_NOT_ALLOWED",
      message: "리뷰 본문에는 외부 링크를 넣을 수 없습니다.",
    };
  }

  const visitedOn =
    typeof candidate.visitedOn === "string" ? candidate.visitedOn : "";
  if (!isRealPastOrPresentDate(visitedOn, now)) {
    return {
      ok: false,
      code: "INVALID_VISIT_DATE",
      message: "오늘 또는 이전의 실제 이용일을 입력해 주세요.",
    };
  }

  if (candidate.visitAttested !== true) {
    return {
      ok: false,
      code: "VISIT_ATTESTATION_REQUIRED",
      message: "이 지점의 음식을 직접 먹었다는 확인이 필요합니다.",
    };
  }

  if (candidate.independentVisitAttested !== true) {
    return {
      ok: false,
      code: "INDEPENDENT_VISIT_REQUIRED",
      message:
        "협찬·리뷰 대가·식당과의 이해관계가 없는 식사 경험만 등록할 수 있습니다.",
    };
  }

  return {
    ok: true,
    value: {
      usageType: candidate.usageType,
      authorName,
      rating,
      body,
      visitedOn,
      visitAttested: true,
      independentVisitAttested: true,
    },
  };
}
