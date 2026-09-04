"use client";

import type { BranchSummary, CuisineKey } from "@dorak/domain-types";
import { Bookmark, Check, ChevronDown, MapPin, Search } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";

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

type LocationGroup = Readonly<{
  district: string;
  count: number;
  neighborhoods: ReadonlyArray<Readonly<{ name: string; count: number }>>;
}>;

function normalise(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR");
}

function compactRestaurantName(value: string): string {
  const characters = [...value];
  return characters.length > 16
    ? `${characters.slice(0, 15).join("")}…`
    : value;
}

export function Discovery({
  branches,
  totalCount,
}: Readonly<{ branches: BranchSummary[]; totalCount?: number }>) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] =
    useState<(typeof CUISINES)[number]["key"]>("all");
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [sort, setSort] = useState<SortKey>("default");
  const [loadedBranches, setLoadedBranches] = useState(branches);
  const [resultTotal, setResultTotal] = useState(totalCount ?? branches.length);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_STORAGE_KEY);
      const values = stored ? (JSON.parse(stored) as unknown) : [];
      if (Array.isArray(values)) {
        setSaved(
          new Set(
            values.filter(
              (value): value is string => typeof value === "string",
            ),
          ),
        );
      }
    } catch {
      setSaved(new Set());
    } finally {
      setSavedLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!savedLoaded) return;
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...saved]));
  }, [saved, savedLoaded]);

  useEffect(() => {
    if (!draftQuery) {
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
  }, [draftQuery]);

  useEffect(() => {
    if (!query && cuisine === "all") {
      setLoadedBranches(branches);
      setResultTotal(totalCount ?? branches.length);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      q: query,
      limit: "200",
    });
    if (cuisine !== "all") params.set("cuisine", cuisine);

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
        setResultTotal(payload.meta?.total ?? payload.data.length);
        setSearchState("success");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setSearchState("error");
      });

    return () => controller.abort();
  }, [branches, cuisine, query, totalCount]);

  const filtered = useMemo(() => {
    const needle = normalise(query);
    const matches = loadedBranches.filter((branch) => {
      const matchesCuisine = cuisine === "all" || branch.cuisine === cuisine;
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
      return matchesCuisine && matchesQuery;
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
  }, [cuisine, loadedBranches, query, sort]);

  const locations = useMemo(() => {
    const groups = new Map<
      string,
      { count: number; neighborhoods: Map<string, number> }
    >();

    for (const branch of loadedBranches) {
      const group = groups.get(branch.district) ?? {
        count: 0,
        neighborhoods: new Map<string, number>(),
      };
      group.count += 1;
      group.neighborhoods.set(
        branch.neighborhood,
        (group.neighborhoods.get(branch.neighborhood) ?? 0) + 1,
      );
      groups.set(branch.district, group);
    }

    return [...groups.entries()]
      .map(([district, group]): LocationGroup => ({
        district,
        count: group.count,
        neighborhoods: [...group.neighborhoods.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((left, right) => left.name.localeCompare(right.name, "ko-KR")),
      }))
      .sort((left, right) =>
        left.district.localeCompare(right.district, "ko-KR"),
      );
  }, [loadedBranches]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery.trim());
    setSearchState("success");
  }

  function chooseNeighborhood(neighborhood: string) {
    setDraftQuery(neighborhood);
    setQuery(neighborhood);
    setSearchState("success");
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setCuisine("all");
    setSearchState("idle");
  }

  function toggleSaved(publicId: string) {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }

  return (
    <section className="directory" aria-labelledby="directory-title">
      <header className="directory-heading">
        <h1 id="directory-title">서울 음식점 찾기</h1>
        <p>동네와 메뉴로 식당을 찾고 방문자의 구체적인 기록을 함께 읽습니다.</p>
      </header>

      <form className="search-panel" role="search" onSubmit={submitSearch}>
        <div className="location-field" aria-label="검색 지역">
          <MapPin aria-hidden="true" size={20} strokeWidth={2} />
          <span>
            <small>지역</small>
            서울 전체
          </span>
        </div>
        <label className="keyword-field" htmlFor="branch-search">
          <Search aria-hidden="true" size={20} strokeWidth={2} />
          <span className="sr-only">식당 검색어</span>
          <input
            id="branch-search"
            name="q"
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="식당명, 동네, 음식, 메뉴"
            autoComplete="off"
          />
        </label>
        <button
          className="search-button"
          type="submit"
          data-state={searchState}
          aria-busy={searchState === "loading"}
        >
          {searchState === "loading" ? "검색 중" : "검색"}
        </button>
        <p className="search-helper" aria-live="polite">
          {searchState === "loading"
            ? "검색 조건을 반영하고 있습니다."
            : "서울 전체 데이터에서 검색"}
        </p>
      </form>

      <details className="mobile-filter">
        <summary>
          검색 조건
          <ChevronDown aria-hidden="true" size={16} strokeWidth={2} />
        </summary>
        <FilterControls
          cuisine={cuisine}
          locations={locations}
          query={query}
          onCuisine={setCuisine}
          onNeighborhood={chooseNeighborhood}
          onClear={clearFilters}
        />
      </details>

      <div className="directory-layout">
        <aside className="filter-sidebar" aria-label="검색 조건">
          <FilterControls
            cuisine={cuisine}
            locations={locations}
            query={query}
            onCuisine={setCuisine}
            onNeighborhood={chooseNeighborhood}
            onClear={clearFilters}
          />
        </aside>

        <div className="results">
          <div className="result-heading">
            <div>
              <h2>검색 결과</h2>
              <p aria-live="polite" aria-atomic="true">
                <strong>{resultTotal.toLocaleString("ko-KR")}곳</strong>
                {resultTotal > filtered.length ? (
                  <small> · 현재 {filtered.length}곳 표시</small>
                ) : null}
                {query ? ` · “${query}”` : " · 서울 전체"}
              </p>
            </div>
            <span>공개 리뷰 기준</span>
          </div>

          <div className="sort-tabs" aria-label="결과 정렬">
            <button
              type="button"
              aria-pressed={sort === "default"}
              onClick={() => setSort("default")}
            >
              기본순
            </button>
            <button
              type="button"
              aria-pressed={sort === "rating"}
              onClick={() => setSort("rating")}
            >
              평점순
            </button>
            <button
              type="button"
              aria-pressed={sort === "reviews"}
              onClick={() => setSort("reviews")}
            >
              리뷰 많은 순
            </button>
          </div>

          {filtered.length > 0 ? (
            <ol className="restaurant-list">
              {filtered.map((branch) => {
                const isSaved = saved.has(branch.publicId);
                return (
                  <li className="restaurant-row" key={branch.publicId}>
                    <div
                      className="photo-pending"
                      role="img"
                      aria-label={`${branch.name} 사진 정보 없음`}
                    >
                      <span>{branch.cuisineLabel}</span>
                      <small>사진 정보 없음</small>
                    </div>

                    <div className="restaurant-main">
                      <p className="restaurant-path">
                        {branch.neighborhood} · {branch.district} /{" "}
                        {branch.cuisineLabel}
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
                        <MapPin aria-hidden="true" size={16} strokeWidth={2} />
                        {branch.address}
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
                        <small>
                          {branch.reviewCount ? "리뷰 평균" : "평가 전"}
                        </small>
                      </div>
                      <dl>
                        <div>
                          <dt>리뷰</dt>
                          <dd>{branch.reviewCount}건</dd>
                        </div>
                        <div>
                          <dt>가격대</dt>
                          <dd>
                            {branch.provenance === "approved_source"
                              ? "확인 전"
                              : branch.priceBand}
                          </dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        className="save-button"
                        aria-pressed={isSaved}
                        onClick={() => toggleSaved(branch.publicId)}
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
                        {isSaved ? "저장됨" : "저장"}
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
        </div>
      </div>
    </section>
  );
}

function FilterControls({
  cuisine,
  locations,
  query,
  onCuisine,
  onNeighborhood,
  onClear,
}: Readonly<{
  cuisine: (typeof CUISINES)[number]["key"];
  locations: ReadonlyArray<LocationGroup>;
  query: string;
  onCuisine: (value: (typeof CUISINES)[number]["key"]) => void;
  onNeighborhood: (value: string) => void;
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
                    normalise(query) === normalise(location.district)
                  }
                  onClick={() => onNeighborhood(location.district)}
                >
                  <span>{location.district} 전체</span>
                  <small>{location.count}곳</small>
                </button>
                {location.neighborhoods.map((neighborhood) => (
                  <button
                    key={`${location.district}-${neighborhood.name}`}
                    type="button"
                    aria-pressed={
                      normalise(query) === normalise(neighborhood.name)
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
