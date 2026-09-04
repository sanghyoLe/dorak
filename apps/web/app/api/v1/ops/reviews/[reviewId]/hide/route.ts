import {
  apiError,
  apiForbidden,
  apiNotFound,
} from "../../../../../../../server/api-response";
import { getCatalog } from "../../../../../../../server/catalog";
import { isCrossSiteMutation } from "../../../../../../../server/request-security";
import {
  authorizeOps,
  opsAuthFailureResponse,
} from "../../../../../../../server/ops-auth";

type RouteContext = Readonly<{
  params: Promise<{ reviewId: string }>;
}>;

export async function POST(request: Request, { params }: RouteContext) {
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

  const { reviewId } = await params;
  try {
    const review = await getCatalog().hideReview(reviewId);
    if (!review) {
      return apiNotFound(
        "PUBLISHED_REVIEW_NOT_FOUND",
        "공개 상태인 리뷰를 찾을 수 없습니다.",
      );
    }
    return Response.json({ data: review });
  } catch (error) {
    return apiError(error, "ops.reviews.hide");
  }
}
