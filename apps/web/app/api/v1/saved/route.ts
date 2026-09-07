import {
  apiBadRequest,
  apiError,
  apiForbidden,
  apiUnauthorized,
} from "../../../../server/api-response";
import { getCatalog } from "../../../../server/catalog";
import { isCrossSiteMutation } from "../../../../server/request-security";
import { resolveViewer } from "../../../../server/viewer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const viewer = await resolveViewer(request.headers);
  if (!viewer) {
    return apiUnauthorized(
      "SIGN_IN_REQUIRED",
      "저장한 식당을 보려면 먼저 로그인해 주세요.",
    );
  }

  try {
    const data = await getCatalog().listSavedBranches(viewer.userId);
    return Response.json(
      { data, meta: { total: data.length } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error, "saved.list");
  }
}

export async function POST(request: Request) {
  if (isCrossSiteMutation(request)) {
    return apiForbidden(
      "CROSS_SITE_REQUEST_REJECTED",
      "허용되지 않은 출처의 요청입니다.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return apiBadRequest(
      "SAVED_BRANCHES_TOO_LARGE",
      "저장한 식당 목록이 너무 큽니다.",
    );
  }

  const viewer = await resolveViewer(request.headers);
  if (!viewer) {
    return apiUnauthorized(
      "SIGN_IN_REQUIRED",
      "저장한 식당을 병합하려면 먼저 로그인해 주세요.",
    );
  }

  const input = await request.json().catch(() => null);
  if (
    !input ||
    typeof input !== "object" ||
    !("publicIds" in input) ||
    !Array.isArray(input.publicIds) ||
    input.publicIds.length > 100 ||
    input.publicIds.some(
      (publicId: unknown) =>
        typeof publicId !== "string" ||
        publicId.length === 0 ||
        publicId.length > 100,
    )
  ) {
    return apiBadRequest(
      "INVALID_SAVED_BRANCHES",
      "병합할 식당 목록을 확인해 주세요.",
    );
  }

  const publicIds = [...new Set(input.publicIds as string[])];
  try {
    const data = await getCatalog().mergeSavedBranches(
      viewer.userId,
      publicIds,
    );
    return Response.json(
      { data, meta: { total: data.length } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error, "saved.merge");
  }
}
