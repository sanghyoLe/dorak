"use client";

import type { OpsReview } from "@dorak/domain-types";
import { EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ReviewQueue({
  initialReviews,
  dataAvailable,
}: Readonly<{
  initialReviews: OpsReview[];
  dataAvailable: boolean;
}>) {
  const [reviews, setReviews] = useState(initialReviews);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function hide(review: OpsReview) {
    setPendingId(review.publicId);
    setMessage(`${review.authorName} 리뷰를 숨기고 있습니다.`);
    setReviews((current) =>
      current.filter((candidate) => candidate.publicId !== review.publicId),
    );

    try {
      const response = await fetch(
        `/api/v1/ops/reviews/${review.publicId}/hide`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error(`Hide failed with ${response.status}`);
      setMessage(`${review.authorName} 리뷰를 공개 목록에서 숨겼습니다.`);
    } catch {
      setReviews((current) => [review, ...current]);
      setMessage("숨김 처리에 실패해 리뷰를 목록으로 되돌렸습니다.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section
      className="review-queue"
      id="reviews"
      aria-labelledby="review-queue-title"
    >
      <div className="queue__heading">
        <div>
          <p>공개 리뷰 관리</p>
          <h2 id="review-queue-title">최근 리뷰</h2>
        </div>
        <strong aria-live="polite">{reviews.length}건</strong>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {message}
      </p>

      {reviews.length ? (
        <ol className="ops-review-list">
          {reviews.map((review) => {
            const pending = pendingId === review.publicId;
            return (
              <li key={review.publicId}>
                <header>
                  <div>
                    <Link href={`/restaurants/${review.branchPublicId}`}>
                      {review.branchName}
                    </Link>
                    <span>{review.authorName}</span>
                  </div>
                  <strong>{review.rating.toFixed(1)}</strong>
                </header>
                <div className="ops-review-trust">
                  <span>
                    <ShieldCheck aria-hidden="true" size={14} strokeWidth={2} />
                    {review.identityVerified ? "계정 확인" : "예시 계정"}
                  </span>
                  <span>
                    {review.visitVerification === "self_reported"
                      ? "방문일 자기입력"
                      : "방문 확인"}
                  </span>
                </div>
                <p>{review.body}</p>
                <footer>
                  <span>{review.visitedOn ?? "방문일 없음"} 방문</span>
                  <button
                    type="button"
                    disabled={pendingId !== null || !dataAvailable}
                    onClick={() => void hide(review)}
                  >
                    <EyeOff aria-hidden="true" size={16} strokeWidth={2} />
                    {pending ? "처리 중" : "공개 숨김"}
                  </button>
                </footer>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="queue-empty" role="status">
          <ShieldCheck aria-hidden="true" size={32} strokeWidth={2} />
          <h3>관리할 공개 리뷰가 없습니다.</h3>
          <p>새 리뷰가 작성되면 이곳에서 확인할 수 있습니다.</p>
        </div>
      )}
    </section>
  );
}
