import { getCatalog } from "../../../server/catalog";
import { apiError } from "../../../server/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = getCatalog();
    if (catalog instanceof Object && "ping" in catalog) {
      await catalog.ping();
    }

    return Response.json({
      data: {
        service: "dorak-web",
        status: "ok",
        dataMode: catalog.mode,
      },
    });
  } catch (error) {
    return apiError(error, "health");
  }
}
