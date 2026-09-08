import type { ReviewReportDecision } from "@dorak/domain-types";

import {
  apiConflict,
  apiError,
  apiForbidden,
  apiUnprocessable,
} from "../../../../../../../server/api-response";
import { getCatalog } from "../../../../../../../server/catalog";
import { isCrossSiteMutation } from "../../../../../../../server/request-security";
import {
  authorizeOps,
  opsAuthFailureResponse,
} from "../../../../../../../server/ops-auth";

export const dynamic = "force-dynamic";

type OpsReportRouteContext = Readonly<{
  params: Promise<{ reportId: string; decision: string }>;
}>;

function normalizeNote(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/gu, "\n")
    .replace(/[\t ]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export async function POST(
  request: Request,
  { params }: OpsReportRouteContext,
) {
  const authorization = authorizeOps(request.headers);
  if (!authorization.authorized) {
    return opsAuthFailureResponse(authorization, true);
  }
  if (isCrossSiteMutation(request)) {
    return apiForbidden(
      "CROSS_SITE_REQUEST_REJECTED",
      "허용되지 않은 출처의 요청입니다.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_192) {
    return apiUnprocessable(
      "REPORT_DECISION_TOO_LARGE",
      "처리 요청의 크기가 너무 큽니다.",
    );
  }

  const { reportId, decision: rawDecision } = await params;
  if (rawDecision !== "resolve" && rawDecision !== "dismiss") {
    return apiUnprocessable(
      "INVALID_REPORT_DECISION",
      "처리 결과를 확인해 주세요.",
    );
  }

  const input = await request.json().catch(() => null);
  const note =
    input && typeof input === "object" && "note" in input
      ? (input as { note?: unknown }).note
      : undefined;
  const normalizedNote = typeof note === "string" ? normalizeNote(note) : "";
  if (
    Array.from(normalizedNote).length < 5 ||
    Array.from(normalizedNote).length > 500
  ) {
    return apiUnprocessable(
      "INVALID_REPORT_DECISION_NOTE",
      "처리 사유를 5~500자로 적어 주세요.",
    );
  }

  const decision: ReviewReportDecision =
    rawDecision === "resolve" ? "resolved" : "dismissed";

  try {
    const report = await getCatalog().decideReviewReport(
      reportId,
      decision,
      normalizedNote,
      authorization.username,
    );
    if (!report) {
      return apiConflict(
        "REPORT_ALREADY_DECIDED",
        "이미 처리된 신고이거나 존재하지 않는 신고입니다.",
      );
    }

    return Response.json(
      { data: report },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error, "review-reports.decide");
  }
}
