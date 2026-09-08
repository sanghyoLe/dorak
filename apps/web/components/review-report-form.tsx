"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";

import { REVIEW_REPORT_REASON_LABELS } from "../lib/review-reports";

type SubmissionState = "idle" | "submitting" | "success" | "error";

interface ApiErrorBody {
  error?: { message?: string };
}

export function ReviewReportForm({
  reviewPublicId,
  branchName,
}: Readonly<{
  reviewPublicId: string;
  branchName: string;
}>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const form = new FormData(event.currentTarget);
    setState("submitting");
    setMessage("신고를 접수하고 있습니다.");

    try {
      const response = await fetch(
        `/api/v1/reviews/${reviewPublicId}/reports`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: form.get("reason"),
            detail: form.get("detail"),
            website: form.get("website"),
          }),
        },
      );

      if (!response.ok) {
        const result = (await response
          .json()
          .catch(() => ({}))) as ApiErrorBody;
        throw new Error(result.error?.message ?? "신고를 접수하지 못했습니다.");
      }

      formRef.current?.reset();
      setReason("");
      setState("success");
      setMessage("신고가 접수되었습니다. 운영팀이 내용을 확인합니다.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "신고를 접수하지 못했습니다.",
      );
    }
  }

  return (
    <details className="review-report">
      <summary>문제 신고</summary>
      <div className="review-report__body">
        <p>
          {branchName} 리뷰에서 문제가 되는 부분을 알려주세요. 신고 내용은
          공개하지 않고 운영 검토에만 사용합니다.
        </p>
        <form ref={formRef} onSubmit={(event) => void submitReport(event)}>
          <label>
            신고 사유
            <select
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              disabled={state === "submitting"}
            >
              <option value="" disabled>
                사유 선택
              </option>
              {Object.entries(REVIEW_REPORT_REASON_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            문제가 되는 부분
            <textarea
              name="detail"
              minLength={10}
              maxLength={1000}
              rows={4}
              placeholder="리뷰의 어떤 내용이 문제인지 구체적으로 적어 주세요."
              required
              disabled={state === "submitting"}
            />
            <small>
              10~1000자 · 낮은 평점이나 의견 불일치만으로는 신고 사유가 되지
              않습니다.
            </small>
          </label>
          <label className="review-report__trap" aria-hidden="true">
            웹사이트
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <button type="submit" disabled={state === "submitting"}>
            {state === "submitting" ? "접수 중" : "신고 접수"}
          </button>
        </form>
        <p className="review-report__message" aria-live="polite">
          {message}
        </p>
      </div>
    </details>
  );
}
