"use client";

import type { BranchSummary } from "@dorak/domain-types";
import { Check, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function ratingLabel(branch: BranchSummary): string {
  if (branch.reviewCount < 5 || branch.rating === null) return "아직 적음";
  if (branch.rating >= 4.5) return "아주 좋음";
  if (branch.rating >= 4) return "좋음";
  return "보통";
}

export function SavedList({
  initialBranches,
}: Readonly<{ initialBranches: BranchSummary[] }>) {
  const [branches, setBranches] = useState(initialBranches);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function removeSaved(branch: BranchSummary) {
    if (pendingId) return;
    setPendingId(branch.publicId);
    setError(null);
    setBranches((current) =>
      current.filter((item) => item.publicId !== branch.publicId),
    );

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

  if (branches.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {error ? (
        <p className="saved-page__feedback" role="status">
          {error}
        </p>
      ) : null}
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
                {branch.openingHours ?? "영업시간 확인 전"}
                {branch.closedDays ? ` · ${branch.closedDays} 휴무` : ""}
              </p>
            </div>
            <aside className="restaurant-facts" aria-label="평가와 가격">
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
                <div>
                  <dt>가격대</dt>
                  <dd>{branch.priceBand}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="save-button"
                aria-pressed="true"
                data-state={pendingId === branch.publicId ? "loading" : "idle"}
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
    </>
  );
}
