import { CUISINE_KEYS, type CuisineKey } from "@dorak/domain-types";

import { apiBadRequest, apiError } from "../../../../server/api-response";
import { getCatalog } from "../../../../server/catalog";

export const dynamic = "force-dynamic";

function isCuisineKey(value: string): value is CuisineKey {
  return CUISINE_KEYS.some((key) => key === value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const cuisine = url.searchParams.get("cuisine");
  const requestedLimit = Number(url.searchParams.get("limit") ?? 100);
  const requestedOffset = Number(url.searchParams.get("offset") ?? 0);

  if (query.length > 100) {
    return apiBadRequest("QUERY_TOO_LONG", "검색어는 100자 이하여야 합니다.");
  }

  if (cuisine && !isCuisineKey(cuisine)) {
    return apiBadRequest("INVALID_CUISINE", "지원하지 않는 음식 장르입니다.");
  }

  if (
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1 ||
    requestedLimit > 200 ||
    !Number.isInteger(requestedOffset) ||
    requestedOffset < 0
  ) {
    return apiBadRequest(
      "INVALID_PAGINATION",
      "페이지 크기는 1~200, 시작 위치는 0 이상이어야 합니다.",
    );
  }

  try {
    const catalog = getCatalog();
    return Response.json(
      await catalog.searchBranches(query, cuisine ?? undefined, {
        limit: requestedLimit,
        offset: requestedOffset,
        approvedOnly:
          catalog.mode === "postgres" && process.env.DORAK_DEMO_AUTH !== "true",
      }),
    );
  } catch (error) {
    return apiError(error, "branches.search");
  }
}
