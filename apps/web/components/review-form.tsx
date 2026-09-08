"use client";

import { CheckCircle2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { REVIEW_USAGE_LABELS } from "../lib/review-usage";

type SubmissionState = "idle" | "submitting" | "success" | "error";

interface ApiErrorBody {
  error?: { message?: string };
}

export function ReviewForm({
  branchPublicId,
  branchName,
  today,
  viewer,
}: Readonly<{
  branchPublicId: string;
  branchName: string;
  today: string;
  viewer: null | {
    name: string;
    identityVerified: boolean;
    demo: boolean;
  };
}>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [rating, setRating] = useState(0);
  const [usageType, setUsageType] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  if (!viewer) {
    const callbackUrl = `/restaurants/${branchPublicId}#write-review`;
    return (
      <div className="review-login-required" id="write-review">
        <p>리뷰를 쓰려면 계정 확인이 필요합니다.</p>
        <h3>로그인 후 식사 경험을 남겨주세요.</h3>
        <p>
          매장 식사·포장·배달 모두 남길 수 있습니다. 로그인은 본인 인증이나 이용
          인증이 아니며, 식사 경험과 협찬 여부는 작성자가 직접 확인합니다.
        </p>
        <Link href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          <LogIn aria-hidden="true" size={18} strokeWidth={2} />
          로그인하고 리뷰 쓰기
        </Link>
      </div>
    );
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const form = new FormData(event.currentTarget);
    setState("submitting");
    setMessage("리뷰를 등록하고 있습니다.");

    try {
      const response = await fetch(
        `/api/v1/branches/${branchPublicId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorName: form.get("authorName"),
            rating: Number(form.get("rating")),
            body: form.get("body"),
            visitedOn: form.get("visitedOn"),
            usageType: form.get("usageType"),
            visitAttested: form.get("visitAttested") === "on",
            independentVisitAttested:
              form.get("independentVisitAttested") === "on",
            website: form.get("website"),
          }),
        },
      );

      if (!response.ok) {
        const result = (await response
          .json()
          .catch(() => ({}))) as ApiErrorBody;
        throw new Error(result.error?.message ?? "리뷰를 등록하지 못했습니다.");
      }

      formRef.current?.reset();
      setRating(0);
      setUsageType("");
      setState("success");
      setMessage("리뷰가 등록되었습니다. 평점과 리뷰 목록에 반영했습니다.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "리뷰를 등록하지 못했습니다.",
      );
    }
  }

  return (
    <form
      className="review-form"
      id="write-review"
      ref={formRef}
      onSubmit={(event) => void submitReview(event)}
    >
      <div className="review-form__identity">
        <CheckCircle2 aria-hidden="true" size={20} strokeWidth={2} />
        <span>
          <strong>{viewer.demo ? "로컬 체험 계정" : "로그인 계정 확인"}</strong>
          {viewer.demo
            ? "배포 환경에서는 Google 로그인이 필요합니다."
            : `${viewer.name} 계정으로 작성합니다.`}
        </span>
      </div>

      <div className="review-form__grid">
        <label>
          공개 닉네임
          <input
            name="authorName"
            type="text"
            minLength={2}
            maxLength={20}
            placeholder="2~20자"
            autoComplete="nickname"
            required
          />
          <small>로그인 계정 이름 대신 리뷰에 공개됩니다.</small>
        </label>

        <label>
          이용일
          <input name="visitedOn" type="date" max={today} required />
          <small>실제로 음식을 먹은 날짜를 입력하세요.</small>
        </label>
      </div>

      <label className="review-body-field">
        이용 방식
        <select
          name="usageType"
          disabled={state === "submitting"}
          value={usageType}
          onChange={(event) => setUsageType(event.target.value)}
          required
        >
          <option value="" disabled>
            이용 방식 선택
          </option>
          {Object.entries(REVIEW_USAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <small>배달·포장은 주문한 지점이 맞는지 확인해 주세요.</small>
      </label>

      <fieldset className="rating-fieldset">
        <legend>전체 평점</legend>
        <div className="rating-options">
          {[1, 2, 3, 4, 5].map((score) => (
            <label key={score} data-selected={rating === score}>
              <input
                name="rating"
                type="radio"
                value={score}
                required
                onChange={() => setRating(score)}
              />
              <strong>{score}</strong>
              <span>
                {score === 1 ? "아쉬움" : score === 5 ? "훌륭함" : "점"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="review-body-field">
        식사 경험
        <textarea
          name="body"
          minLength={20}
          maxLength={1000}
          rows={7}
          placeholder={
            usageType === "delivery" || usageType === "takeout"
              ? `${branchName}에서 주문한 메뉴, 맛, 온도와 포장 상태를 적어주세요.`
              : `${branchName}에서 먹은 메뉴, 맛, 서비스와 분위기를 구체적으로 적어주세요.`
          }
          required
        />
        <small>
          20~1000자 · 광고 링크와 확인하기 어려운 단정은 제외합니다.
        </small>
      </label>

      {usageType === "delivery" || usageType === "takeout" ? (
        <p>
          경험하지 않은 매장 서비스·분위기는 평가하지 마세요. 배달비·배달 지연은
          음식에 대한 평가와 구분해서 적어주세요.
        </p>
      ) : null}

      <label className="review-attestation">
        <input name="visitAttested" type="checkbox" required />
        <span>
          이 지점의 음식을 직접 먹었으며, 개인적인 경험을 작성했습니다.
        </span>
      </label>

      <label className="review-attestation">
        <input
          name="independentVisitAttested"
          type="checkbox"
          required
          aria-describedby="independent-visit-help"
        />
        <span>협찬·리뷰 대가·식당과의 이해관계가 없습니다.</span>
      </label>
      <p id="independent-visit-help">
        식사 협찬이나 리뷰를 조건으로 한 금전·할인 혜택을 받았거나, 본인·가족이
        운영하거나 근무하는 식당은 평가할 수 없습니다. 일반 고객에게 제공되는
        할인은 괜찮습니다. <Link href="/review-policy">리뷰 원칙</Link>
      </p>

      <label className="review-honeypot" aria-hidden="true">
        웹사이트
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="review-form__submit">
        <button type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "등록 중" : "리뷰 등록"}
        </button>
        <p data-state={state} aria-live="polite">
          {message ||
            "등록 후 즉시 공개되며 운영 원칙 위반 시 숨김 처리됩니다."}
        </p>
      </div>
    </form>
  );
}
