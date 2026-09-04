import {
  CUISINE_KEYS,
  type BranchSort,
  type CuisineKey,
} from "@dorak/domain-types";

import { apiBadRequest, apiError } from "../../../../server/api-response";
import { getCatalog } from "../../../../server/catalog";

export const dynamic = "force-dynamic";

function isCuisineKey(value: string): value is CuisineKey {
  return CUISINE_KEYS.some((key) => key === value);
}

function isBranchSort(value: string): value is BranchSort {
  return value === "default" || value === "rating" || value === "reviews";
}

function parsePriceBands(value: string | null): number[] | undefined {
  if (!value) return undefined;
  const bands = value.split(",").map((band) => Number(band));
  if (
    bands.length === 0 ||
    bands.some((band) => !Number.isInteger(band) || band < 1 || band > 4)
  ) {
    return undefined;
  }
  return [...new Set(bands)];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const cuisine = url.searchParams.get("cuisine");
  const district = url.searchParams.get("district") || undefined;
  const neighborhood = url.searchParams.get("neighborhood") || undefined;
  const priceBands = parsePriceBands(url.searchParams.get("price"));
  const minRatingValue = url.searchParams.get("rating");
  const minRating = minRatingValue ? Number(minRatingValue) : undefined;
  const sortValue = url.searchParams.get("sort") ?? "default";
  const pageValue = url.searchParams.get("page");
  const requestedPage = pageValue ? Number(pageValue) : 1;
  const requestedLimit = Number(url.searchParams.get("limit") ?? 20);
  const requestedOffset = url.searchParams.has("offset")
    ? Number(url.searchParams.get("offset"))
    : (requestedPage - 1) * requestedLimit;

  if (query.length > 100) {
    return apiBadRequest("QUERY_TOO_LONG", "검색어는 100자 이하여야 합니다.");
  }

  if (cuisine && !isCuisineKey(cuisine)) {
    return apiBadRequest("INVALID_CUISINE", "지원하지 않는 음식 장르입니다.");
  }

  if (url.searchParams.has("price") && !priceBands) {
    return apiBadRequest(
      "INVALID_PRICE",
      "가격대는 1~4 중에서 선택해야 합니다.",
    );
  }

  if (
    minRating !== undefined &&
    (!Number.isFinite(minRating) || minRating < 1 || minRating > 5)
  ) {
    return apiBadRequest("INVALID_RATING", "평점 기준은 1~5 사이여야 합니다.");
  }

  if (!isBranchSort(sortValue)) {
    return apiBadRequest("INVALID_SORT", "지원하지 않는 정렬 방식입니다.");
  }

  if (
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1 ||
    requestedLimit > 20 ||
    !Number.isInteger(requestedOffset) ||
    requestedOffset < 0 ||
    !Number.isInteger(requestedPage) ||
    requestedPage < 1
  ) {
    return apiBadRequest(
      "INVALID_PAGINATION",
      "페이지 크기는 1~20, 시작 위치는 0 이상이어야 합니다.",
    );
  }

  try {
    const catalog = getCatalog();
    return Response.json(
      await catalog.searchBranches(query, cuisine ?? undefined, {
        limit: requestedLimit,
        offset: requestedOffset,
        ...(pageValue === null ? {} : { page: requestedPage }),
        approvedOnly:
          catalog.mode === "postgres" && process.env.DORAK_DEMO_AUTH !== "true",
        ...(district ? { district } : {}),
        ...(neighborhood ? { neighborhood } : {}),
        ...(priceBands ? { priceBands } : {}),
        ...(minRating === undefined ? {} : { minRating }),
        sort: sortValue,
      }),
    );
  } catch (error) {
    return apiError(error, "branches.search");
  }
}
