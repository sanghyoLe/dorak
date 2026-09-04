import { apiError } from "../../../../../server/api-response";
import { getCatalog } from "../../../../../server/catalog";
import {
  authorizeOps,
  opsAuthFailureResponse,
} from "../../../../../server/ops-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = authorizeOps(request.headers);
  if (!authorization.authorized) {
    return opsAuthFailureResponse(authorization, true);
  }

  try {
    const catalog = getCatalog();
    const data = await catalog.listCandidates();
    return Response.json({
      data,
      meta: { total: data.length, dataMode: catalog.mode },
    });
  } catch (error) {
    return apiError(error, "ops.candidates.list");
  }
}
