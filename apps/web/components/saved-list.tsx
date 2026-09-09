"use client";

import type { BranchSummary } from "@dorak/domain-types";
import { Check, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const SAVED_STORAGE_KEY = "dorak:saved-branches:v1";

function ratingLabel(branch: BranchSummary): string {
  if (branch.rating === null) return "평가 전";
  if (branch.reviewCount < 5) return "리뷰가 적어요";
  return `리뷰 ${branch.reviewCount}건`;
}

export function SavedList({
  initialBranches,
  authenticated,
}: Readonly<{
  initialBranches: BranchSummary[];
  authenticated: boolean;
}>) {
  const [branches, setBranches] = useState(initialBranches);
  const [loaded, setLoaded] = useState(authenticated);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated) return;

    const controller = new AbortController();
    let publicIds: string[] = [];
    try {
      const stored = window.localStorage.getItem(SAVED_STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as unknown) : [];
      if (Array.isArray(parsed)) {
        publicIds = parsed.filter(
          (value): value is string => typeof value === "string",
        );
      }
    } catch {
      setError(
        "이 기기의 저장 목록을 읽지 못했습니다. 브라우저의 저장 공간 설정을 확인해 주세요.",
      );
    }

    void Promise.all(
      publicIds.map(async (publicId) => {
        const response = await fetch(`/api/v1/branches/${publicId}`, {
          signal: controller.signal,
        });
        if (!response.ok) return null;
        const payload = (await response.json()) as { data?: BranchSummary };
        return payload.data ?? null;
      }),
    )
      .then((items) => {
        if (controller.signal.aborted) return;
        setBranches(
          items.filter((item): item is BranchSummary => item !== null),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("저장한 식당을 불러오지 못했습니다. 다시 시도해 주세요.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });

    return () => controller.abort();
  }, [authenticated]);

  async function removeSaved(branch: BranchSummary) {
    if (pendingId) return;
    setPendingId(branch.publicId);
    setError(null);
    setBranches((current) =>
      current.filter((item) => item.publicId !== branch.publicId),
    );

    if (!authenticated) {
      const next = branches
        .filter((item) => item.publicId !== branch.publicId)
        .map((item) => item.publicId);
      try {
        window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        setBranches(branches);
        setError(
          "저장을 해제하지 못했습니다. 브라우저의 저장 공간 설정을 확인해 주세요.",
        );
      } finally {
        setPendingId(null);
      }
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/branches/${branch.publicId}/saved`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("saved.remove");
    } catch {
      setBranches((current) => [branch, ...current]);
      setError("저장한 식당을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <header className="saved-page__heading">
        <h1>저장한 식당</h1>
        <span>
          {loaded
            ? `${branches.length.toLocaleString("ko-KR")}곳`
            : "불러오는 중"}
        </span>
        {!authenticated ? (
          <p>
            이 브라우저에 저장됩니다. 계정에 이어서 보관하려면{" "}
            <Link href="/signin?callbackUrl=%2Fsaved">로그인</Link>하세요.
          </p>
        ) : null}
      </header>
      {error ? (
        <p className="saved-page__feedback" role="status">
          {error}
        </p>
      ) : null}
      {!loaded ? (
        <p className="saved-page__loading" role="status">
          저장한 식당을 불러오는 중입니다.
        </p>
      ) : branches.length === 0 ? (
        <section
          className="saved-page__empty"
          aria-labelledby="saved-empty-title"
        >
          <h2 id="saved-empty-title">아직 저장한 식당이 없습니다.</h2>
          <p>둘러보다가 다시 보고 싶은 식당을 저장해 보세요.</p>
          <Link className="saved-page__empty-link" href="/r">
            식당 둘러보기
          </Link>
        </section>
      ) : (
        <ol className="restaurant-list saved-restaurant-list">
          {branches.map((branch) => (
            <li className="restaurant-row" key={branch.publicId}>
              <div className="restaurant-main">
                <p className="restaurant-path">
                  {branch.neighborhood} · {branch.district} /{" "}
                  {branch.cuisineLabel}
                </p>
                <h2>
                  <Link href={`/restaurants/${branch.publicId}`}>
                    {branch.name}
                  </Link>
                </h2>
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
                <p className="restaurant-hours">
                  {branch.openingHours ?? "영업시간 정보 없음"}
                  {branch.closedDays ? ` · ${branch.closedDays} 휴무` : ""}
                </p>
              </div>
              <aside className="restaurant-facts" aria-label="평가 정보">
                <div>
                  <span>평점</span>
                  <strong>
                    {branch.rating === null ? "—" : branch.rating.toFixed(1)}
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
                  aria-pressed="true"
                  data-state={
                    pendingId === branch.publicId ? "loading" : "idle"
                  }
                  aria-busy={pendingId === branch.publicId}
                  disabled={pendingId !== null}
                  onClick={() => void removeSaved(branch)}
                >
                  <Check aria-hidden="true" size={16} strokeWidth={2.5} />
                  {pendingId === branch.publicId ? "해제 중…" : "저장됨"}
                </button>
              </aside>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
