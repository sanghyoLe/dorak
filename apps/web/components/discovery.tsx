"use client";

import type {
  BranchLocationGroup,
  BranchSummary,
  CuisineKey,
} from "@dorak/domain-types";
import { Bookmark, Check, ChevronDown, MapPin, Search } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

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
const PAGE_SIZE = 60;

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
  locations,
  totalCount,
}: Readonly<{
  branches: BranchSummary[];
  locations: BranchLocationGroup[];
  totalCount?: number;
}>) {
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
  const [hasMore, setHasMore] = useState(
    (totalCount ?? branches.length) > branches.length,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const loadControllerRef = useRef<AbortController | null>(null);

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
      const nextTotal = totalCount ?? branches.length;
      setResultTotal(nextTotal);
      setHasMore(nextTotal > branches.length);
      setLoadError(null);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      q: query,
      limit: String(PAGE_SIZE),
      offset: "0",
    });
    if (cuisine !== "all") params.set("cuisine", cuisine);

    setSearchState("loading");
    loadControllerRef.current?.abort();
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setLoadError(null);
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
        setHasMore(payload.data.length < nextTotal);
        setSearchState("success");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setSearchState("error");
      });

    return () => {
      controller.abort();
      loadControllerRef.current?.abort();
    };
  }, [branches, cuisine, query, totalCount]);

  const loadNextPage = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadError(null);
    const offset = loadedBranches.length;
    const params = new URLSearchParams({
      q: query,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (cuisine !== "all") params.set("cuisine", cuisine);
    const controller = new AbortController();
    loadControllerRef.current = controller;

    try {
      const response = await fetch(`/api/v1/branches?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("추가 식당을 불러오지 못했습니다.");
      const payload = (await response.json()) as {
        data: BranchSummary[];
        meta?: { total?: number };
      };
      const nextTotal = payload.meta?.total ?? offset + payload.data.length;
      setLoadedBranches((current) => {
        const seen = new Set(current.map((branch) => branch.publicId));
        return [
          ...current,
          ...payload.data.filter((branch) => !seen.has(branch.publicId)),
        ];
      });
      setResultTotal(nextTotal);
      setHasMore(
        payload.data.length > 0 && offset + payload.data.length < nextTotal,
      );
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setLoadError("추가 식당을 불러오지 못했습니다.");
    } finally {
      if (loadControllerRef.current === controller) {
        loadControllerRef.current = null;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [cuisine, hasMore, loadedBranches.length, query]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNextPage();
        }
      },
      { rootMargin: "640px 0px" },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, loadNextPage]);

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

  function focusDirectory() {
    document.getElementById("directory")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function chooseLandingLocation(value: string) {
    chooseNeighborhood(value);
    focusDirectory();
  }

  function chooseLandingCuisine(value: (typeof CUISINES)[number]["key"]) {
    if (value === "all") return;
    setCuisine(value);
    setSearchState("success");
    focusDirectory();
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
    <>
      <section className="home-portal" aria-labelledby="home-title">
        <div className="home-portal__intro">
          <div className="home-portal__title">
            <p className="home-portal__eyebrow">SEOUL · RESTAURANT INDEX</p>
            <h1 id="home-title">
              오늘 갈 식당,
              <br />
              도락에서 고르세요.
            </h1>
          </div>
          <p>
            동네와 음식, 방문자의 기록을 한 번에 살펴보고
            <br className="home-portal__break" />
            내게 맞는 식당을 천천히 고릅니다.
          </p>
        </div>

        <form
          className="search-panel home-search"
          role="search"
          onSubmit={submitSearch}
        >
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

        <div className="portal-rails">
          <section
            className="portal-rail"
            aria-labelledby="popular-location-title"
          >
            <div className="portal-rail__heading">
              <h2 id="popular-location-title">인기 지역</h2>
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
                  <small>찾아보기</small>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="trust-strip" aria-label="도락의 정보 원칙">
          <span>식당 정보는 출처를 표시합니다.</span>
          <span>리뷰에는 방문일을 남깁니다.</span>
          <span>저장한 식당은 브라우저에 보관됩니다.</span>
        </div>
      </section>

      <section
        className="directory"
        id="directory"
        aria-labelledby="directory-title"
      >
        <header className="directory-heading">
          <div>
            <p className="directory-heading__eyebrow">THE WHOLE INDEX</p>
            <h2 id="directory-title">서울 식당 둘러보기</h2>
          </div>
          <p>지역과 메뉴로 좁혀보고, 방문자의 구체적인 기록을 함께 읽습니다.</p>
        </header>

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
                          <MapPin
                            aria-hidden="true"
                            size={16}
                            strokeWidth={2}
                          />
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

            {filtered.length > 0 ? (
              <div
                ref={loadMoreSentinelRef}
                className="load-more-status"
                aria-live="polite"
                aria-busy={loadingMore}
              >
                {loadingMore ? (
                  <p>다음 식당을 불러오는 중…</p>
                ) : loadError ? (
                  <>
                    <p>{loadError}</p>
                    <button type="button" onClick={() => void loadNextPage()}>
                      다시 불러오기
                    </button>
                  </>
                ) : hasMore ? (
                  <>
                    <p>스크롤하면 다음 식당을 계속 보여드립니다.</p>
                    <button type="button" onClick={() => void loadNextPage()}>
                      다음 {PAGE_SIZE}곳 보기
                    </button>
                  </>
                ) : (
                  <p>
                    전체 {resultTotal.toLocaleString("ko-KR")}곳을 확인했습니다.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
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
  locations: ReadonlyArray<BranchLocationGroup>;
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
