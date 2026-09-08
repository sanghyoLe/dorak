import type { NearbyBranchSearchOptions } from "@dorak/domain-types";

import {
  apiBadRequest,
  apiError,
  apiForbidden,
} from "../../../../../server/api-response";
import { getCatalog } from "../../../../../server/catalog";
import { isCrossSiteMutation } from "../../../../../server/request-security";

export const dynamic = "force-dynamic";

const ALLOWED_RADII = new Set([1_000, 3_000, 5_000, 10_000]);
const MAX_REQUEST_BYTES = 1_024;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function POST(request: Request) {
  if (isCrossSiteMutation(request)) {
    return apiForbidden(
      "CROSS_SITE_REQUEST_REJECTED",
      "허용되지 않은 출처의 요청입니다.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return apiBadRequest(
      "LOCATION_REQUEST_TOO_LARGE",
      "위치 요청을 확인해 주세요.",
    );
  }

  const input = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const latitude = input?.latitude;
  const longitude = input?.longitude;
  const radiusMeters = input?.radiusMeters ?? 3_000;

  if (
    !isFiniteNumber(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !isFiniteNumber(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return apiBadRequest("INVALID_LOCATION", "현재 위치를 확인할 수 없습니다.");
  }

  if (!isFiniteNumber(radiusMeters) || !ALLOWED_RADII.has(radiusMeters)) {
    return apiBadRequest(
      "INVALID_RADIUS",
      "검색 범위는 1km, 3km, 5km, 10km 중에서 선택해 주세요.",
    );
  }

  const options: NearbyBranchSearchOptions = {
    latitude,
    longitude,
    radiusMeters,
    limit: 20,
  };

  try {
    const catalog = getCatalog();
    const data = await catalog.findNearbyBranches({
      ...options,
      approvedOnly:
        catalog.mode === "postgres" && process.env.DORAK_DEMO_AUTH !== "true",
    });
    return Response.json(
      { data, meta: { total: data.length, radiusMeters } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error, "branches.nearby");
  }
}
