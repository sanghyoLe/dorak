import { apiError, apiNotFound } from "../../../../../server/api-response";
import { getCatalog } from "../../../../../server/catalog";

export const dynamic = "force-dynamic";

type RouteContext = Readonly<{
  params: Promise<{ publicId: string }>;
}>;

export async function GET(_request: Request, { params }: RouteContext) {
  const { publicId } = await params;

  try {
    const branch = await getCatalog().findBranch(publicId);
    if (!branch) {
      return apiNotFound(
        "BRANCH_NOT_FOUND",
        "요청한 식당 지점을 찾을 수 없습니다.",
      );
    }

    return Response.json({ data: branch });
  } catch (error) {
    return apiError(error, "branches.detail");
  }
}
