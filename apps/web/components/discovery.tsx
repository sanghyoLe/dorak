"use client";

import type {
  BranchSort,
  BranchLocationGroup,
  BranchSummary,
  CuisineKey,
} from "@dorak/domain-types";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const CUISINES: readonly { key: "all" | CuisineKey; label: string }[] = [
  { key: "all", label: "전체 음식" },
  { key: "korean", label: "한식" },
  { key: "noodle", label: "면요리" },
  { key: "japanese", label: "일식" },
  { key: "chinese", label: "중식" },
  { key: "western", label: "양식" },
  { key: "cafe", label: "카페·디저트" },
];

type SearchState = "idle" | "loading" | "success" | "error";
type SortKey = "default" | "rating" | "reviews";
const SAVED_STORAGE_KEY = "dorak:saved-branches:v1";
const PAGE_SIZE = 20;

function readLocalSaved(): Set<string> {
  try {
    const stored = window.localStorage.getItem(SAVED_STORAGE_KEY);
    const values = stored ? (JSON.parse(stored) as unknown) : [];
    return new Set(
      Array.isArray(values)
        ? values.filter(
            (value): value is string =>
              typeof value === "string" && value.length > 0,
          )
        : [],
    );
  } catch {
    return new Set();
  }
}

function normalise(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR");
}

function compactRestaurantName(value: string): string {
  const characters = [...value];
  return characters.length > 16
    ? `${characters.slice(0, 15).join("")}…`
    : value;
}

function ratingLabel(branch: BranchSummary): string {
  if (branch.rating === null) return "평가 전";
  if (branch.reviewCount < 5) return "리뷰가 적어요";
  return `리뷰 ${branch.reviewCount}건`;
}

function paginationItems(
  currentPage: number,
  pageCount: number,
): Array<number | "ellipsis"> {
  const visiblePages = new Set(
    [1, pageCount, currentPage - 1, currentPage, currentPage + 1].filter(
      (page) => page >= 1 && page <= pageCount,
    ),
  );
  const pages = [...visiblePages].toSorted((left, right) => left - right);
  const items: Array<number | "ellipsis"> = [];

  for (const [index, page] of pages.entries()) {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  }

  return items;
}

export function Discovery({
  branches,
  locations,
  totalCount,
  mode = "home",
  initialQuery = "",
  initialCuisine = "all",
  initialDistrict,
  initialNeighborhood,
  initialPriceBands,
  initialMinRating,
  initialSort = "default",
  currentPage = 1,
}: Readonly<{
  branches: BranchSummary[];
  locations: BranchLocationGroup[];
  totalCount?: number;
  mode?: "home" | "results";
  initialQuery?: string;
  initialCuisine?: (typeof CUISINES)[number]["key"];
  initialDistrict?: string | undefined;
  initialNeighborhood?: string | undefined;
  initialPriceBands?: number[] | undefined;
  initialMinRating?: number | undefined;
  initialSort?: BranchSort;
  currentPage?: number;
}>) {
  const router = useRouter();
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [cuisine, setCuisine] =
    useState<(typeof CUISINES)[number]["key"]>(initialCuisine);
  const [priceBands, setPriceBands] = useState<number[]>(
    initialPriceBands ?? [],
  );
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<
    string | undefined
  >(initialNeighborhood);
  const [minRating, setMinRating] = useState<number | undefined>(
    initialMinRating,
  );
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [savedSource, setSavedSource] = useState<
    "loading" | "server" | "local"
  >("loading");
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveInteractionRef = useRef(false);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [loadedBranches, setLoadedBranches] = useState(branches);
  const [resultTotal, setResultTotal] = useState(totalCount ?? branches.length);

  useEffect(() => {
    let cancelled = false;
    const localSaved = readLocalSaved();
    setSaved(localSaved);

    async function loadSavedState() {
      try {
        const response = await fetch("/api/v1/saved", { cache: "no-store" });
        if (response.status === 401) {
          if (!cancelled) {
            setSavedSource("local");
            setSavedLoaded(true);
          }
          return;
        }
        if (!response.ok) throw new Error("saved.list");

        const payload = (await response.json()) as {
          data?: Array<{ publicId: string }>;
        };
        if (saveInteractionRef.current) return;
        let serverSaved = new Set(
          (payload.data ?? []).map((branch) => branch.publicId),
        );

        if (localSaved.size > 0) {
          const mergeResponse = await fetch("/api/v1/saved", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ publicIds: [...localSaved] }),
          });
          if (mergeResponse.ok) {
            const merged = (await mergeResponse.json()) as {
              data?: Array<{ publicId: string }>;
            };
            serverSaved = new Set(
              (merged.data ?? []).map((branch) => branch.publicId),
            );
            window.localStorage.removeItem(SAVED_STORAGE_KEY);
          }
        }

        if (!cancelled) {
          setSaved(serverSaved);
          setSavedSource("server");
          setSavedLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setSaved(localSaved);
          setSavedSource("local");
          setSavedLoaded(true);
        }
      }
    }

    void loadSavedState();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!savedLoaded || savedSource !== "local") return;
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...saved]));
  }, [saved, savedLoaded, savedSource]);

  useEffect(() => {
    if (mode === "results") return;
    if (!draftQuery.trim()) {
      setQuery("");
      setSearchState("idle");
      return;
    }

    setSearchState("loading");
    const timer = window.setTimeout(() => {
      setQuery(draftQuery.trim());
      setSearchState("success");
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draftQuery, mode]);

  useEffect(() => {
    if (mode === "results") {
      setLoadedBranches(branches);
      setResultTotal(totalCount ?? branches.length);
      return;
    }

    if (!query && cuisine === "all") {
      setLoadedBranches(branches);
      const nextTotal = totalCount ?? branches.length;
      setResultTotal(nextTotal);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      q: query,
      limit: String(PAGE_SIZE),
      offset: "0",
    });
    if (cuisine !== "all") params.set("cuisine", cuisine);
    if (priceBands.length) params.set("price", priceBands.join(","));
    if (minRating !== undefined) params.set("rating", String(minRating));

    setSearchState("loading");
    fetch(`/api/v1/branches?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("검색 요청에 실패했습니다.");
        return (await response.json()) as {
          data: BranchSummary[];
          meta?: { total?: number };
        };
      })
      .then((payload) => {
        setLoadedBranches(payload.data);
        const nextTotal = payload.meta?.total ?? payload.data.length;
        setResultTotal(nextTotal);
        setSearchState("success");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setSearchState("error");
      });

    return () => {
      controller.abort();
    };
  }, [branches, cuisine, minRating, mode, priceBands, query, totalCount]);

  const filtered = useMemo(() => {
    const needle = normalise(query);
    const matches = loadedBranches.filter((branch) => {
      const matchesCuisine = cuisine === "all" || branch.cuisine === cuisine;
      const matchesPrice =
        priceBands.length === 0 ||
        (branch.priceBand !== null &&
          priceBands.includes(branch.priceBand.length));
      const matchesRating =
        minRating === undefined ||
        (branch.rating !== null && branch.rating >= minRating);
      const haystack = normalise(
        [
          branch.name,
          branch.neighborhood,
          branch.district,
          branch.cuisineLabel,
          branch.shortDescription,
          ...branch.signatureMenu,
        ].join(" "),
      );
      const matchesQuery = query ? true : !needle || haystack.includes(needle);
      return matchesCuisine && matchesPrice && matchesRating && matchesQuery;
    });

    if (sort === "rating") {
      return matches.toSorted(
        (left, right) =>
          (right.rating ?? -1) - (left.rating ?? -1) ||
          right.reviewCount - left.reviewCount,
      );
    }
    if (sort === "reviews") {
      return matches.toSorted(
        (left, right) =>
          right.reviewCount - left.reviewCount ||
          (right.rating ?? -1) - (left.rating ?? -1),
      );
    }
    return matches;
  }, [cuisine, loadedBranches, minRating, priceBands, query, sort]);

  const popularLocations = useMemo(
    () =>
      [...locations]
        .toSorted(
          (left, right) =>
            right.count - left.count ||
            left.district.localeCompare(right.district, "ko-KR"),
        )
        .slice(0, 8),
    [locations],
  );

  const pageCount = Math.max(1, Math.ceil(resultTotal / PAGE_SIZE));
  const visibleStart =
    resultTotal === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const visibleEnd = Math.min(currentPage * PAGE_SIZE, resultTotal);

  function pageHref(nextPage: number): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (initialNeighborhood) params.set("neighborhood", initialNeighborhood);
    if (priceBands.length) {
      params.set("price", priceBands.join(","));
    }
    if (minRating !== undefined) {
      params.set("rating", String(minRating));
    }
    if (sort !== "default") params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const path = [
      initialDistrict ? encodeURIComponent(initialDistrict) : "",
      cuisine !== "all" ? cuisine : "",
    ]
      .filter(Boolean)
      .join("/");
    return `/r${path ? `/${path}` : ""}${params.size ? `?${params}` : ""}`;
  }

  function navigateResults({
    nextQuery = draftQuery.trim(),
    nextCuisine = cuisine,
    nextDistrict = initialDistrict,
    nextNeighborhood = initialNeighborhood,
    nextPriceBands = priceBands,
    nextMinRating = minRating,
    nextSort = sort,
    nextPage = 1,
  }: Readonly<{
    nextQuery?: string;
    nextCuisine?: (typeof CUISINES)[number]["key"];
    nextDistrict?: string | undefined;
    nextNeighborhood?: string | undefined;
    nextPriceBands?: number[] | undefined;
    nextMinRating?: number | undefined;
    nextSort?: SortKey;
    nextPage?: number;
  }> = {}) {
    const params = new URLSearchParams();
    const queryValue = nextQuery.trim();
    if (queryValue) params.set("q", queryValue);
    if (nextNeighborhood) params.set("neighborhood", nextNeighborhood);
    if (nextPriceBands?.length) {
      params.set("price", nextPriceBands.join(","));
    }
    if (nextMinRating !== undefined) {
      params.set("rating", String(nextMinRating));
    }
    if (nextSort !== "default") params.set("sort", nextSort);
    if (nextPage > 1) params.set("page", String(nextPage));

    const path = [
      nextDistrict ? encodeURIComponent(nextDistrict) : "",
      nextCuisine && nextCuisine !== "all" ? nextCuisine : "",
    ]
      .filter(Boolean)
      .join("/");
    router.push(
      `/r${path ? `/${path}` : ""}${params.size ? `?${params}` : ""}`,
    );
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateResults({ nextPage: 1 });
    setSearchState("success");
  }

  function chooseNeighborhood(neighborhood: string) {
    if (mode === "results") {
      navigateResults({ nextNeighborhood: neighborhood });
      return;
    }
    setSelectedNeighborhood(neighborhood);
    setDraftQuery(neighborhood);
    setQuery(neighborhood);
    setSearchState("success");
  }

  function chooseDistrict(district: string | undefined) {
    if (mode === "results") {
      navigateResults({
        nextDistrict: district,
        nextNeighborhood: undefined,
        nextPage: 1,
      });
      return;
    }
    router.push(district ? `/r/${encodeURIComponent(district)}` : "/r");
  }

  function clearFilters() {
    if (mode === "results") {
      router.push("/r");
      return;
    }
    setDraftQuery("");
    setQuery("");
    setCuisine("all");
    setPriceBands([]);
    setSelectedNeighborhood(undefined);
    setMinRating(undefined);
    setSearchState("idle");
  }

  function focusDirectory() {
    document.getElementById("directory")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function chooseLandingLocation(value: string) {
    if (mode === "home") {
      chooseDistrict(value);
      return;
    }
    chooseDistrict(value);
    focusDirectory();
  }

  function chooseLandingCuisine(value: (typeof CUISINES)[number]["key"]) {
    if (value === "all") return;
    if (mode === "home") {
      router.push(`/r?cuisine=${value}`);
      return;
    }
    setCuisine(value);
    setSearchState("success");
    focusDirectory();
  }

  function chooseCuisine(value: (typeof CUISINES)[number]["key"]) {
    if (mode === "results") {
      navigateResults({ nextCuisine: value, nextPage: 1 });
      return;
    }
    setCuisine(value);
  }

  function choosePriceBand(value: number) {
    const nextPriceBands = priceBands.includes(value)
      ? priceBands.filter((band) => band !== value)
      : [...priceBands, value].toSorted();
    if (mode === "results") {
      navigateResults({ nextPriceBands, nextPage: 1 });
      return;
    }
    setPriceBands(nextPriceBands);
  }

  function chooseMinRating(value: number | undefined) {
    if (mode === "results") {
      navigateResults({ nextMinRating: value, nextPage: 1 });
      return;
    }
    setMinRating(value);
  }

  function changeSort(value: SortKey) {
    if (mode === "results") {
      navigateResults({ nextSort: value, nextPage: 1 });
      return;
    }
    setSort(value);
  }

  async function toggleSaved(publicId: string) {
    if (savingIds.has(publicId)) return;

    const nextSaved = !saved.has(publicId);
    saveInteractionRef.current = true;
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
    setSaveError(null);

    if (savedSource === "loading" || savedSource === "local") {
      const next = readLocalSaved();
      if (nextSaved) next.add(publicId);
      else next.delete(publicId);
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...next]));
      setSavedSource("local");
      return;
    }

    setSavingIds((current) => new Set(current).add(publicId));
    try {
      const response = await fetch(`/api/v1/branches/${publicId}/saved`, {
        method: nextSaved ? "PUT" : "DELETE",
      });
      if (response.status === 401) {
        const next = readLocalSaved();
        if (nextSaved) next.add(publicId);
        else next.delete(publicId);
        window.localStorage.setItem(
          SAVED_STORAGE_KEY,
          JSON.stringify([...next]),
        );
        setSavedSource("local");
        return;
      }
      if (!response.ok) throw new Error("saved.toggle");
    } catch {
      setSaved((current) => {
        const next = new Set(current);
        if (nextSaved) next.delete(publicId);
        else next.add(publicId);
        return next;
      });
      setSaveError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(publicId);
        return next;
      });
    }
  }

  return (
    <>
      {mode === "home" ? (
        <section className="home-portal" aria-labelledby="home-title">
          <BranchSearchForm
            className="home-search"
            draftQuery={draftQuery}
            searchState={searchState}
            locations={locations}
            selectedDistrict={initialDistrict}
            onDistrict={chooseDistrict}
            onChange={setDraftQuery}
            onSubmit={submitSearch}
          />

          <Link className="home-nearby-link" href="/nearby">
            <MapPin aria-hidden="true" size={17} strokeWidth={2} />
            현재 위치에서 찾기
          </Link>

          <header className="home-index__masthead">
            <div className="home-index__heading">
              <h1 id="home-title">
                서울 식당 {(totalCount ?? resultTotal).toLocaleString("ko-KR")}
                곳
              </h1>
              <p>지역과 음식, 식당 이름으로 찾아보세요.</p>
            </div>
          </header>

          <div className="portal-rails">
            <section
              className="portal-rail"
              aria-labelledby="popular-location-title"
            >
              <div className="portal-rail__heading">
                <h2 id="popular-location-title">식당이 많은 지역</h2>
                <span>{locations.length.toLocaleString("ko-KR")}개 지역</span>
              </div>
              <div className="portal-link-grid">
                {popularLocations.map((location) => (
                  <button
                    key={location.district}
                    type="button"
                    className="portal-link"
                    onClick={() => chooseLandingLocation(location.district)}
                  >
                    <span>{location.district}</span>
                    <small>{location.count.toLocaleString("ko-KR")}곳</small>
                  </button>
                ))}
              </div>
            </section>

            <section
              className="portal-rail"
              aria-labelledby="popular-cuisine-title"
            >
              <div className="portal-rail__heading">
                <h2 id="popular-cuisine-title">음식 장르</h2>
                <span>서울 전체</span>
              </div>
              <div className="portal-link-grid portal-link-grid--cuisine">
                {CUISINES.filter((item) => item.key !== "all").map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="portal-link"
                    onClick={() => chooseLandingCuisine(item.key)}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {branches.length > 0 ? (
            <section
              className="home-index__preview"
              aria-labelledby="home-preview-title"
            >
              <div className="home-index__preview-heading">
                <h2 id="home-preview-title">식당 목록</h2>
                <Link href="/r">
                  전체 보기
                  <ChevronRight aria-hidden="true" size={16} strokeWidth={2} />
                </Link>
              </div>
              <ul className="home-index__preview-list">
                {branches.slice(0, 6).map((branch) => (
                  <li key={branch.publicId}>
                    <Link href={`/restaurants/${branch.publicId}`}>
                      <span className="home-index__preview-name">
                        <strong>{branch.name}</strong>
                        <small>
                          {branch.district} · {branch.neighborhood} ·{" "}
                          {branch.cuisineLabel}
                        </small>
                      </span>
                      <span className="home-index__preview-meta">
                        {branch.rating !== null
                          ? branch.rating.toFixed(1)
                          : `${branch.reviewCount}건`}
                        <ChevronRight
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      ) : null}

      {mode === "results" ? (
        <section
          className="directory"
          id="directory"
          aria-labelledby="directory-title"
        >
          <header className="directory-heading">
            <h2 id="directory-title">서울 식당 둘러보기</h2>
          </header>

          {mode === "results" ? (
            <BranchSearchForm
              draftQuery={draftQuery}
              searchState={searchState}
              locations={locations}
              selectedDistrict={initialDistrict}
              onDistrict={chooseDistrict}
              onChange={setDraftQuery}
              onSubmit={submitSearch}
            />
          ) : null}

          <details className="mobile-filter">
            <summary>
              검색 조건
              <ChevronDown aria-hidden="true" size={16} strokeWidth={2} />
            </summary>
            <FilterControls
              cuisine={cuisine}
              locations={locations}
              query={query}
              selectedDistrict={initialDistrict}
              selectedNeighborhood={initialNeighborhood ?? selectedNeighborhood}
              priceBands={priceBands}
              minRating={minRating}
              onCuisine={chooseCuisine}
              onDistrict={chooseDistrict}
              onNeighborhood={chooseNeighborhood}
              onPriceBand={choosePriceBand}
              onMinRating={chooseMinRating}
              onClear={clearFilters}
            />
          </details>

          <div className="directory-layout">
            <aside className="filter-sidebar" aria-label="검색 조건">
              <FilterControls
                cuisine={cuisine}
                locations={locations}
                query={query}
                selectedDistrict={initialDistrict}
                selectedNeighborhood={
                  initialNeighborhood ?? selectedNeighborhood
                }
                priceBands={priceBands}
                minRating={minRating}
                onCuisine={chooseCuisine}
                onDistrict={chooseDistrict}
                onNeighborhood={chooseNeighborhood}
                onPriceBand={choosePriceBand}
                onMinRating={chooseMinRating}
                onClear={clearFilters}
              />
            </aside>

            <div className="results">
              <div className="result-heading">
                <div>
                  <h2>검색 결과</h2>
                  <p aria-live="polite" aria-atomic="true">
                    <strong>{resultTotal.toLocaleString("ko-KR")}곳</strong>
                    <small>
                      {mode === "results"
                        ? ` · ${visibleStart}–${visibleEnd} 표시`
                        : resultTotal > filtered.length
                          ? ` · 현재 ${filtered.length}곳 표시`
                          : ""}
                    </small>
                    {query ? ` · “${query}”` : " · 서울 전체"}
                  </p>
                  {saveError ? (
                    <p className="save-feedback" role="status">
                      {saveError}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="sort-tabs" aria-label="결과 정렬">
                <button
                  type="button"
                  aria-pressed={sort === "default"}
                  onClick={() => changeSort("default")}
                >
                  기본순
                </button>
                <button
                  type="button"
                  aria-pressed={sort === "rating"}
                  onClick={() => changeSort("rating")}
                >
                  평점순
                </button>
                <button
                  type="button"
                  aria-pressed={sort === "reviews"}
                  onClick={() => changeSort("reviews")}
                >
                  리뷰 많은 순
                </button>
              </div>

              {filtered.length > 0 ? (
                <ol className="restaurant-list">
                  {filtered.map((branch, index) => {
                    const isSaved = saved.has(branch.publicId);
                    const rank = (currentPage - 1) * PAGE_SIZE + index + 1;
                    return (
                      <li className="restaurant-row" key={branch.publicId}>
                        <div className="restaurant-main">
                          <p className="restaurant-path">
                            <strong>{rank}</strong> {branch.neighborhood} ·{" "}
                            {branch.district} / {branch.cuisineLabel}
                          </p>
                          <h3>
                            <Link
                              href={`/restaurants/${branch.publicId}`}
                              aria-label={branch.name}
                            >
                              <span
                                className="restaurant-name-short"
                                aria-hidden="true"
                              >
                                {compactRestaurantName(branch.name)}
                              </span>
                              <span
                                className="restaurant-name-full"
                                aria-hidden="true"
                              >
                                {branch.name}
                              </span>
                            </Link>
                          </h3>
                          <p className="restaurant-description">
                            {branch.shortDescription}
                          </p>
                          {branch.signatureMenu.length > 0 ? (
                            <ul className="menu-tags" aria-label="대표 메뉴">
                              {branch.signatureMenu.map((menu) => (
                                <li key={menu}>{menu}</li>
                              ))}
                            </ul>
                          ) : null}
                          <p className="restaurant-address">
                            <MapPin
                              aria-hidden="true"
                              size={16}
                              strokeWidth={2}
                            />
                            {branch.address}
                          </p>
                          <p className="restaurant-hours">
                            {branch.openingHours ?? "영업시간 정보 없음"}
                            {branch.closedDays
                              ? ` · ${branch.closedDays} 휴무`
                              : ""}
                          </p>
                        </div>

                        <aside
                          className="restaurant-facts"
                          aria-label="평가와 가격"
                        >
                          <div>
                            <span>평점</span>
                            <strong>
                              {branch.rating === null
                                ? "—"
                                : branch.rating.toFixed(1)}
                            </strong>
                            <small>{ratingLabel(branch)}</small>
                          </div>
                          <dl>
                            <div>
                              <dt>리뷰</dt>
                              <dd>{branch.reviewCount}건</dd>
                            </div>
                            {branch.priceBand ? (
                              <div>
                                <dt>가격대</dt>
                                <dd>{branch.priceBand}</dd>
                              </div>
                            ) : null}
                          </dl>
                          <button
                            type="button"
                            className="save-button"
                            aria-pressed={isSaved}
                            aria-busy={savingIds.has(branch.publicId)}
                            data-state={
                              savingIds.has(branch.publicId)
                                ? "loading"
                                : "idle"
                            }
                            disabled={savingIds.has(branch.publicId)}
                            onClick={() => void toggleSaved(branch.publicId)}
                          >
                            {isSaved ? (
                              <Check
                                aria-hidden="true"
                                size={16}
                                strokeWidth={2.5}
                              />
                            ) : (
                              <Bookmark
                                aria-hidden="true"
                                size={16}
                                strokeWidth={2}
                              />
                            )}
                            {isSaved
                              ? "저장됨"
                              : savedSource === "loading"
                                ? "확인 중…"
                                : "저장"}
                          </button>
                        </aside>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="empty-state" role="status">
                  <h3>조건에 맞는 식당이 없습니다.</h3>
                  <p>검색어나 음식 장르를 바꿔보세요.</p>
                  <button type="button" onClick={clearFilters}>
                    검색 조건 초기화
                  </button>
                </div>
              )}

              {filtered.length > 0 ? (
                <nav className="pagination" aria-label="검색 결과 페이지">
                  {currentPage > 1 ? (
                    <Link href={pageHref(currentPage - 1)}>이전</Link>
                  ) : null}
                  <ol>
                    {paginationItems(currentPage, pageCount).map(
                      (item, index) =>
                        item === "ellipsis" ? (
                          <li key={`ellipsis-${index}`}>
                            <span
                              className="pagination__ellipsis"
                              aria-hidden="true"
                            >
                              …
                            </span>
                          </li>
                        ) : (
                          <li key={item}>
                            {item === currentPage ? (
                              <span aria-current="page">{item}</span>
                            ) : (
                              <Link href={pageHref(item)}>{item}</Link>
                            )}
                          </li>
                        ),
                    )}
                  </ol>
                  {currentPage < pageCount ? (
                    <Link href={pageHref(currentPage + 1)}>다음</Link>
                  ) : null}
                </nav>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function BranchSearchForm({
  className,
  draftQuery,
  searchState,
  locations,
  selectedDistrict,
  onDistrict,
  onChange,
  onSubmit,
}: Readonly<{
  className?: string;
  draftQuery: string;
  searchState: SearchState;
  locations: ReadonlyArray<BranchLocationGroup>;
  selectedDistrict?: string | undefined;
  onDistrict: (value: string | undefined) => void;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>) {
  const districtFieldId = useId();

  return (
    <form
      className={className ? `search-panel ${className}` : "search-panel"}
      role="search"
      onSubmit={onSubmit}
    >
      <label className="location-field" htmlFor={districtFieldId}>
        <MapPin aria-hidden="true" size={20} strokeWidth={2} />
        <span>
          <small>지역</small>
          <select
            id={districtFieldId}
            name="district"
            value={selectedDistrict ?? ""}
            onChange={(event) => onDistrict(event.target.value || undefined)}
          >
            <option value="">서울 전체</option>
            {locations.map((location) => (
              <option key={location.district} value={location.district}>
                {location.district} ({location.count.toLocaleString("ko-KR")}곳)
              </option>
            ))}
          </select>
        </span>
      </label>
      <label className="keyword-field" htmlFor="branch-search">
        <Search aria-hidden="true" size={20} strokeWidth={2} />
        <span className="sr-only">식당 검색어</span>
        <input
          id="branch-search"
          name="q"
          type="search"
          value={draftQuery}
          onChange={(event) => onChange(event.target.value)}
          placeholder="식당명, 동네, 음식, 메뉴…"
          autoComplete="off"
        />
      </label>
      <button
        className="search-button"
        type="submit"
        data-state={searchState}
        aria-busy={searchState === "loading"}
      >
        {searchState === "loading" ? "검색 중…" : "검색"}
      </button>
      {searchState === "loading" ? (
        <p className="search-helper" aria-live="polite">
          검색 중…
        </p>
      ) : null}
    </form>
  );
}

function FilterControls({
  cuisine,
  locations,
  query,
  selectedDistrict,
  selectedNeighborhood,
  priceBands,
  minRating,
  onCuisine,
  onDistrict,
  onNeighborhood,
  onPriceBand,
  onMinRating,
  onClear,
}: Readonly<{
  cuisine: (typeof CUISINES)[number]["key"];
  locations: ReadonlyArray<BranchLocationGroup>;
  query: string;
  selectedDistrict?: string | undefined;
  selectedNeighborhood?: string | undefined;
  priceBands: ReadonlyArray<number>;
  minRating?: number | undefined;
  onCuisine: (value: (typeof CUISINES)[number]["key"]) => void;
  onDistrict: (value: string | undefined) => void;
  onNeighborhood: (value: string) => void;
  onPriceBand: (value: number) => void;
  onMinRating: (value: number | undefined) => void;
  onClear: () => void;
}>) {
  const filterId = useId();
  const cuisineTitleId = `${filterId}-cuisine`;
  const locationTitleId = `${filterId}-location`;

  return (
    <div className="filter-groups">
      <section aria-labelledby={cuisineTitleId}>
        <h2 id={cuisineTitleId}>음식 장르</h2>
        <div className="filter-options">
          {CUISINES.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={cuisine === item.key}
              onClick={() => onCuisine(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby={`${filterId}-price`}>
        <h2 id={`${filterId}-price`}>가격대</h2>
        <div className="filter-options">
          {[1, 2, 3, 4].map((band) => (
            <button
              key={band}
              type="button"
              aria-pressed={priceBands.includes(band)}
              onClick={() => onPriceBand(band)}
            >
              {"₩".repeat(band)}
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby={`${filterId}-rating`}>
        <h2 id={`${filterId}-rating`}>평점</h2>
        <div className="filter-options">
          {[4, 3.5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={minRating === value}
              onClick={() =>
                onMinRating(minRating === value ? undefined : value)
              }
            >
              {value.toFixed(1)} 이상
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby={locationTitleId}>
        <h2 id={locationTitleId}>지역</h2>
        <div className="area-neighborhood-groups">
          {locations.map((location) => (
            <details key={location.district}>
              <summary>
                <span>{location.district}</span>
                <span className="area-summary-meta">
                  <small>{location.count}곳</small>
                  <ChevronDown aria-hidden="true" size={15} strokeWidth={2} />
                </span>
              </summary>
              <div className="filter-options area-neighborhood-options">
                <button
                  className="area-district-button"
                  type="button"
                  aria-pressed={
                    selectedDistrict === location.district ||
                    (!selectedDistrict &&
                      normalise(query) === normalise(location.district))
                  }
                  onClick={() => onDistrict(location.district)}
                >
                  <span>{location.district} 전체</span>
                  <small>{location.count}곳</small>
                </button>
                {location.neighborhoods.map((neighborhood) => (
                  <button
                    key={`${location.district}-${neighborhood.name}`}
                    type="button"
                    aria-pressed={
                      selectedNeighborhood === neighborhood.name ||
                      (!selectedNeighborhood &&
                        normalise(query) === normalise(neighborhood.name))
                    }
                    onClick={() => onNeighborhood(neighborhood.name)}
                  >
                    <span>{neighborhood.name}</span>
                    <small>{neighborhood.count}곳</small>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
      <button type="button" className="clear-button" onClick={onClear}>
        조건 초기화
      </button>
    </div>
  );
}
