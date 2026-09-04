import {
  CUISINE_KEYS,
  type BranchSort,
  type CuisineKey,
} from "@dorak/domain-types";
import Link from "next/link";

import { Discovery } from "../../../components/discovery";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { getCatalog } from "../../../server/catalog";

export const dynamic = "force-dynamic";

type DirectoryPageProps = Readonly<{
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{
    q?: string;
    cuisine?: string;
    neighborhood?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  }>;
}>;

const PAGE_SIZE = 20;

const CUISINE_LABELS: Readonly<Record<CuisineKey, string>> = {
  korean: "한식",
  noodle: "면요리",
  japanese: "일식",
  chinese: "중식",
  western: "양식",
  cafe: "카페·디저트",
};

function isCuisine(value: string | undefined): value is CuisineKey {
  return value !== undefined && CUISINE_KEYS.includes(value as CuisineKey);
}

function parsePriceBands(value: string | undefined): number[] | undefined {
  if (!value) return undefined;
  const bands = value.split(",").map(Number);
  return bands.every((band) => Number.isInteger(band) && band >= 1 && band <= 4)
    ? [...new Set(bands)]
    : undefined;
}

function parsePage(value: string | undefined): number {
  const page = Number(value ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseRating(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5
    ? rating
    : undefined;
}

function parseSort(value: string | undefined): BranchSort {
  return value === "rating" || value === "reviews" ? value : "default";
}

function decodePathSegment(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function DirectoryPage({
  params,
  searchParams,
}: DirectoryPageProps) {
  const [{ path }, search] = await Promise.all([params, searchParams]);
  const district = decodePathSegment(path?.[0]);
  const cuisine = isCuisine(path?.[1])
    ? path[1]
    : isCuisine(search.cuisine)
      ? search.cuisine
      : undefined;
  const query = search.q?.trim().slice(0, 100) ?? "";
  const neighborhood = search.neighborhood?.trim() || undefined;
  const priceBands = parsePriceBands(search.price);
  const minRating = parseRating(search.rating);
  const sort = parseSort(search.sort);
  const page = parsePage(search.page);
  const catalog = getCatalog();
  const approvedOnly =
    catalog.mode === "postgres" && process.env.DORAK_DEMO_AUTH !== "true";
  const [initialResult, locations] = await Promise.all([
    catalog.searchBranches(query, cuisine, {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      page,
      approvedOnly,
      ...(district ? { district } : {}),
      ...(neighborhood ? { neighborhood } : {}),
      ...(priceBands ? { priceBands } : {}),
      ...(minRating === undefined ? {} : { minRating }),
      sort,
    }),
    catalog.listLocations({ approvedOnly }),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell search-page">
        <nav className="breadcrumb" aria-label="현재 위치">
          <Link href="/">도락</Link>
          <span aria-hidden="true">›</span>
          <span>{district ?? "서울 전체"}</span>
          {cuisine ? (
            <>
              <span aria-hidden="true">›</span>
              <span>{CUISINE_LABELS[cuisine]}</span>
            </>
          ) : null}
          <span aria-hidden="true">›</span>
          <span>검색 결과</span>
        </nav>
        <Discovery
          mode="results"
          initialQuery={query}
          initialCuisine={cuisine ?? "all"}
          initialDistrict={district}
          initialNeighborhood={neighborhood}
          initialPriceBands={priceBands}
          initialMinRating={minRating}
          initialSort={sort}
          currentPage={page}
          branches={initialResult.data}
          locations={locations}
          totalCount={initialResult.meta.total}
        />
      </main>
      <SiteFooter
        showDemoNotice={initialResult.data.some(
          (branch) => branch.provenance === "synthetic",
        )}
      />
    </>
  );
}
