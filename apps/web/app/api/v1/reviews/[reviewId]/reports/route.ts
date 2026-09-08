import { DuplicateReviewReportError } from "@dorak/server-catalog";

import {
  apiConflict,
  apiError,
  apiForbidden,
  apiNotFound,
  apiUnprocessable,
} from "../../../../../../server/api-response";
import { getCatalog } from "../../../../../../server/catalog";
import { validateReviewReportSubmission } from "../../../../../../server/review-report-validation";
import { isCrossSiteMutation } from "../../../../../../server/request-security";
import { resolveViewer } from "../../../../../../server/viewer";

export const dynamic = "force-dynamic";

type ReviewReportsRouteContext = Readonly<{
  params: Promise<{ reviewId: string }>;
}>;

export async function POST(
  request: Request,
  { params }: ReviewReportsRouteContext,
) {
  if (isCrossSiteMutation(request)) {
    return apiForbidden(
      "CROSS_SITE_REQUEST_REJECTED",
      "허용되지 않은 출처의 요청입니다.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_192) {
    return apiUnprocessable(
      "REPORT_TOO_LARGE",
      "신고 요청의 크기가 너무 큽니다.",
    );
  }

  const input = await request.json().catch(() => null);
  const validation = validateReviewReportSubmission(input);
  if (!validation.ok) {
    return apiUnprocessable(validation.code, validation.message);
  }

  const viewer = await resolveViewer(request.headers);
  const { reviewId } = await params;

  try {
    const report = await getCatalog().createReviewReport(
      reviewId,
      viewer?.userId ?? null,
      validation.value,
    );
    if (!report) {
      return apiNotFound("REVIEW_NOT_FOUND", "신고할 리뷰를 찾을 수 없습니다.");
    }

    return Response.json(
      { data: report },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof DuplicateReviewReportError ||
      (error instanceof Error && error.name === "DuplicateReviewReportError")
    ) {
      return apiConflict(
        "REPORT_ALREADY_EXISTS",
        "같은 리뷰와 사유로 이미 접수한 신고가 있습니다.",
      );
    }
    return apiError(error, "review-reports.create");
  }
}
