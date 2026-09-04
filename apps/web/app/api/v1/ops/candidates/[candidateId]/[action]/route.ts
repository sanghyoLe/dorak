import {
  apiBadRequest,
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
  params: Promise<{
    candidateId: string;
    action: string;
  }>;
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

  const { candidateId, action } = await params;

  if (action !== "approve" && action !== "reject") {
    return apiBadRequest(
      "INVALID_CANDIDATE_ACTION",
      "지원하지 않는 검수 작업입니다.",
    );
  }

  const decision = action === "approve" ? "approved" : "rejected";

  try {
    const candidate = await getCatalog().reviewCandidate(candidateId, decision);
    if (!candidate) {
      return apiNotFound(
        "PENDING_CANDIDATE_NOT_FOUND",
        "검수 대기 중인 후보를 찾을 수 없습니다.",
      );
    }

    return Response.json({ data: candidate });
  } catch (error) {
    return apiError(error, "ops.candidates.review");
  }
}
