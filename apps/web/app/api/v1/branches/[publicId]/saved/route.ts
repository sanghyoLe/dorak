import {
  apiError,
  apiForbidden,
  apiNotFound,
  apiUnauthorized,
} from "../../../../../../server/api-response";
import { getCatalog } from "../../../../../../server/catalog";
import { isCrossSiteMutation } from "../../../../../../server/request-security";
import { resolveViewer } from "../../../../../../server/viewer";

export const dynamic = "force-dynamic";

type SavedBranchRouteContext = Readonly<{
  params: Promise<{ publicId: string }>;
}>;

export async function PUT(
  request: Request,
  { params }: SavedBranchRouteContext,
) {
  if (isCrossSiteMutation(request)) {
    return apiForbidden(
      "CROSS_SITE_REQUEST_REJECTED",
      "허용되지 않은 출처의 요청입니다.",
    );
  }

  const viewer = await resolveViewer(request.headers);
  if (!viewer) {
    return apiUnauthorized(
      "SIGN_IN_REQUIRED",
      "식당을 저장하려면 먼저 로그인해 주세요.",
    );
  }

  const { publicId } = await params;
  try {
    const data = await getCatalog().saveBranch(viewer.userId, publicId);
    if (!data) {
      return apiNotFound("BRANCH_NOT_FOUND", "저장할 식당을 찾을 수 없습니다.");
    }

    return Response.json(
      { data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error, "saved.create");
  }
}

export async function DELETE(
  request: Request,
  { params }: SavedBranchRouteContext,
) {
  if (isCrossSiteMutation(request)) {
    return apiForbidden(
      "CROSS_SITE_REQUEST_REJECTED",
      "허용되지 않은 출처의 요청입니다.",
    );
  }

  const viewer = await resolveViewer(request.headers);
  if (!viewer) {
    return apiUnauthorized(
      "SIGN_IN_REQUIRED",
      "저장한 식당을 바꾸려면 먼저 로그인해 주세요.",
    );
  }

  const { publicId } = await params;
  try {
    await getCatalog().removeSavedBranch(viewer.userId, publicId);
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error, "saved.remove");
  }
}
