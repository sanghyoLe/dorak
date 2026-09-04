import {
  DuplicateReviewError,
  ReviewRateLimitError,
} from "@dorak/server-catalog";

import {
  apiConflict,
  apiError,
  apiForbidden,
  apiNotFound,
  apiTooManyRequests,
  apiUnauthorized,
  apiUnprocessable,
} from "../../../../../../server/api-response";
import { getCatalog } from "../../../../../../server/catalog";
import { validateReviewSubmission } from "../../../../../../server/review-validation";
import { resolveViewer } from "../../../../../../server/viewer";
import { isCrossSiteMutation } from "../../../../../../server/request-security";

export const dynamic = "force-dynamic";

type ReviewsRouteContext = Readonly<{
  params: Promise<{ publicId: string }>;
}>;

export async function GET(_request: Request, { params }: ReviewsRouteContext) {
  const { publicId } = await params;
  try {
    const data = await getCatalog().listReviews(publicId);
    return Response.json({ data, meta: { total: data.length } });
  } catch (error) {
    return apiError(error, "reviews.list");
  }
}

export async function POST(request: Request, { params }: ReviewsRouteContext) {
  if (isCrossSiteMutation(request)) {
    return apiForbidden(
      "CROSS_SITE_REQUEST_REJECTED",
      "허용되지 않은 출처의 요청입니다.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return apiUnprocessable(
      "REVIEW_TOO_LARGE",
      "리뷰 요청의 크기가 너무 큽니다.",
    );
  }

  const viewer = await resolveViewer(request.headers);
  if (!viewer) {
    return apiUnauthorized(
      "SIGN_IN_REQUIRED",
      "리뷰를 쓰려면 먼저 로그인해 주세요.",
    );
  }

  const input = await request.json().catch(() => null);
  const validation = validateReviewSubmission(input);
  if (!validation.ok) {
    return apiUnprocessable(validation.code, validation.message);
  }

  const { publicId } = await params;
  try {
    const review = await getCatalog().createReview(
      publicId,
      {
        userId: viewer.userId,
        identityVerified: viewer.identityVerified,
      },
      validation.value,
    );
    if (!review) {
      return apiNotFound(
        "BRANCH_NOT_FOUND",
        "리뷰를 작성할 식당을 찾을 수 없습니다.",
      );
    }

    return Response.json(
      { data: review },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof DuplicateReviewError ||
      (error instanceof Error && error.name === "DuplicateReviewError")
    ) {
      return apiConflict(
        "REVIEW_ALREADY_EXISTS",
        "한 식당에는 리뷰를 하나만 작성할 수 있습니다.",
      );
    }
    if (
      error instanceof ReviewRateLimitError ||
      (error instanceof Error && error.name === "ReviewRateLimitError")
    ) {
      return apiTooManyRequests(
        "REVIEW_RATE_LIMITED",
        "하루에 작성할 수 있는 리뷰는 최대 5개입니다.",
      );
    }
    return apiError(error, "reviews.create");
  }
}
