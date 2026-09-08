"use client";

import type { OpsReviewReport } from "@dorak/domain-types";
import { Check, Flag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { REVIEW_REPORT_REASON_LABELS } from "../lib/review-reports";

function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function ReportQueue({
  initialReports,
  dataAvailable,
}: Readonly<{
  initialReports: OpsReviewReport[];
  dataAvailable: boolean;
}>) {
  const [reports, setReports] = useState(initialReports);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function decide(
    report: OpsReviewReport,
    action: "resolve" | "dismiss",
  ) {
    const note = notes[report.publicId]?.trim() ?? "";
    if (Array.from(note).length < 5) {
      setMessage("처리 사유를 5자 이상 적어 주세요.");
      return;
    }

    setPendingId(report.publicId);
    setMessage(`${report.branchName} 신고를 처리하고 있습니다.`);
    setReports((current) =>
      current.filter((candidate) => candidate.publicId !== report.publicId),
    );

    try {
      const response = await fetch(
        `/api/v1/ops/reports/${report.publicId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        },
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(result.error?.message ?? "신고 처리에 실패했습니다.");
      }
      setMessage(
        action === "resolve"
          ? "신고 검토를 종료했습니다. 리뷰 공개 상태는 리뷰 관리에서 따로 바꿔야 합니다."
          : "신고를 기각으로 기록했습니다.",
      );
    } catch (error) {
      setReports((current) => [report, ...current]);
      setMessage(
        error instanceof Error ? error.message : "신고 처리에 실패했습니다.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section
      className="report-queue"
      id="reports"
      aria-labelledby="report-queue-title"
    >
      <div className="queue__heading">
        <div>
          <p>접수된 내용</p>
          <h2 id="report-queue-title">신고 대기열</h2>
        </div>
        <strong aria-live="polite">{reports.length}건</strong>
      </div>

      <p
        className="report-queue__message"
        aria-live="polite"
        aria-atomic="true"
      >
        {message || "신고 검토와 리뷰 공개 상태는 따로 처리됩니다."}
      </p>

      {reports.length ? (
        <ol className="ops-report-list">
          {reports.map((report) => {
            const pending = pendingId === report.publicId;
            return (
              <li key={report.publicId}>
                <header>
                  <div>
                    <Link href={`/restaurants/${report.branchPublicId}`}>
                      {report.branchName}
                    </Link>
                    <span>
                      {REVIEW_REPORT_REASON_LABELS[report.reason]} · 작성자{" "}
                      {report.reviewAuthorName}
                    </span>
                  </div>
                  <Flag aria-hidden="true" size={18} strokeWidth={2} />
                </header>
                <blockquote>{report.reviewBody}</blockquote>
                <p className="ops-report__detail">{report.detail}</p>
                <footer>
                  <span>
                    {report.reporterAuthenticated
                      ? "로그인 계정 신고"
                      : "익명 신고"}
                  </span>
                  <span>{formatReportDate(report.createdAt)}</span>
                </footer>
                <label className="ops-report__note">
                  처리 사유
                  <textarea
                    rows={3}
                    minLength={5}
                    maxLength={500}
                    value={notes[report.publicId] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [report.publicId]: event.target.value,
                      }))
                    }
                    placeholder="확인한 내용과 결정 이유를 적어 주세요."
                    disabled={pending || !dataAvailable}
                  />
                </label>
                <div className="ops-report__actions">
                  <button
                    type="button"
                    className="ops-report__resolve"
                    disabled={pending || !dataAvailable}
                    onClick={() => void decide(report, "resolve")}
                  >
                    <Check aria-hidden="true" size={16} strokeWidth={2} />
                    {pending ? "처리 중" : "검토 종료"}
                  </button>
                  <button
                    type="button"
                    className="ops-report__dismiss"
                    disabled={pending || !dataAvailable}
                    onClick={() => void decide(report, "dismiss")}
                  >
                    <X aria-hidden="true" size={16} strokeWidth={2} />
                    기각
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="queue-empty" role="status">
          <Flag aria-hidden="true" size={32} strokeWidth={2} />
          <h3>검토할 신고가 없습니다.</h3>
          <p>새 신고가 접수되면 이곳에서 확인할 수 있습니다.</p>
        </div>
      )}
    </section>
  );
}
