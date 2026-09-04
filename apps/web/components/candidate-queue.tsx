"use client";

import type { IngestionCandidate } from "@dorak/domain-types";
import { Check, X } from "lucide-react";
import { useState } from "react";

type Action = "approved" | "rejected";
type ActionState = "idle" | "loading" | "error";

export function CandidateQueue({
  initialCandidates,
  dataAvailable,
}: Readonly<{
  initialCandidates: IngestionCandidate[];
  dataAvailable: boolean;
}>) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState(
    dataAvailable ? "" : "데이터베이스에 연결하지 못했습니다.",
  );

  async function review(candidate: IngestionCandidate, action: Action) {
    const previousIndex = candidates.findIndex(
      (item) => item.id === candidate.id,
    );
    setPendingId(candidate.id);
    setErrorId(null);
    setLiveMessage(`${candidate.proposedName} 후보를 처리하고 있습니다.`);
    setCandidates((current) =>
      current.filter((item) => item.id !== candidate.id),
    );

    try {
      const endpoint = action === "approved" ? "approve" : "reject";
      const response = await fetch(
        `/api/v1/ops/candidates/${candidate.id}/${endpoint}`,
        { method: "POST" },
      );

      if (!response.ok) {
        throw new Error(`Review request failed with ${response.status}`);
      }

      setLiveMessage(
        `${candidate.proposedName} 후보 ${action === "approved" ? "승인" : "반려"}이 반영됐습니다.`,
      );
    } catch {
      setCandidates((current) => {
        const next = [...current];
        next.splice(Math.max(previousIndex, 0), 0, candidate);
        return next;
      });
      setErrorId(candidate.id);
      setLiveMessage(
        `${candidate.proposedName} 후보 처리에 실패해 목록으로 되돌렸습니다.`,
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="queue" id="queue" aria-labelledby="queue-title">
      <div className="queue__heading">
        <div>
          <p>검수 대기열</p>
          <h2 id="queue-title">검수 대기</h2>
        </div>
        <strong aria-live="polite">{candidates.length}건</strong>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      {!dataAvailable ? (
        <div className="api-unavailable" role="alert">
          데이터베이스에 연결하지 못했습니다. 연결 설정을 확인한 뒤 페이지를
          새로고침하세요.
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <ol className="candidate-list">
          {candidates.map((candidate, index) => {
            const isLoading = pendingId === candidate.id;
            const hasError = errorId === candidate.id;
            const state: ActionState = isLoading
              ? "loading"
              : hasError
                ? "error"
                : "idle";

            return (
              <li className="candidate" key={candidate.id} data-state={state}>
                <div className="candidate__number">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>합성 후보</small>
                </div>
                <div className="candidate__body">
                  <div className="candidate__source">
                    <span>{candidate.sourceName}</span>
                    <span>{candidate.sourceRecordId}</span>
                  </div>
                  <h3>{candidate.proposedName}</h3>
                  <p>{candidate.proposedAddress}</p>
                  <dl>
                    <div>
                      <dt>장르</dt>
                      <dd>{candidate.cuisineLabel}</dd>
                    </div>
                    <div>
                      <dt>합성 일치도</dt>
                      <dd>{Math.round(candidate.confidence * 100)}%</dd>
                    </div>
                    <div>
                      <dt>수집 시각</dt>
                      <dd>
                        {new Intl.DateTimeFormat("ko-KR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Seoul",
                        }).format(new Date(candidate.createdAt))}
                      </dd>
                    </div>
                  </dl>
                  {hasError ? (
                    <p className="candidate__error" role="alert">
                      처리하지 못했습니다. 데이터 연결을 확인한 뒤 다시
                      시도하세요.
                    </p>
                  ) : null}
                </div>
                <div className="candidate__actions">
                  <button
                    type="button"
                    className="decision-button decision-button--approve"
                    disabled={pendingId !== null || !dataAvailable}
                    data-state={state}
                    onClick={() => void review(candidate, "approved")}
                  >
                    <Check aria-hidden="true" size={20} strokeWidth={2} />
                    {isLoading ? "처리 중" : "승인"}
                  </button>
                  <button
                    type="button"
                    className="decision-button decision-button--reject"
                    disabled={pendingId !== null || !dataAvailable}
                    data-state={state}
                    onClick={() => void review(candidate, "rejected")}
                  >
                    <X aria-hidden="true" size={20} strokeWidth={2} />
                    반려
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="queue-empty" role="status">
          <Check aria-hidden="true" size={32} strokeWidth={2} />
          <h3>
            {dataAvailable
              ? "대기 중인 후보가 없습니다."
              : "후보를 불러오지 못했습니다."}
          </h3>
          <p>
            {dataAvailable
              ? "새 수집 배치가 들어오면 이곳에 표시됩니다."
              : "데이터 연결을 확인한 뒤 페이지를 새로고침하세요."}
          </p>
        </div>
      )}
    </section>
  );
}
