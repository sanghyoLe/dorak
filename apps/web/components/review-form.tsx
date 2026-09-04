"use client";

import { CheckCircle2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

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
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  if (!viewer) {
    const callbackUrl = `/restaurants/${branchPublicId}#write-review`;
    return (
      <div className="review-login-required" id="write-review">
        <p>리뷰를 쓰려면 계정 확인이 필요합니다.</p>
        <h3>로그인 후 방문 경험을 남겨주세요.</h3>
        <p>
          계정 로그인은 작성자의 실재성을 확인합니다. 식당 방문 여부는 별도로
          직접 확인받습니다.
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
            visitAttested: form.get("visitAttested") === "on",
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
          방문일
          <input name="visitedOn" type="date" max={today} required />
          <small>실제로 음식을 먹은 날짜를 입력하세요.</small>
        </label>
      </div>

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
        방문 경험
        <textarea
          name="body"
          minLength={20}
          maxLength={1000}
          rows={7}
          placeholder={`${branchName}에서 먹은 메뉴, 맛, 서비스와 분위기를 구체적으로 적어주세요.`}
          required
        />
        <small>
          20~1000자 · 광고 링크와 확인하기 어려운 단정은 제외합니다.
        </small>
      </label>

      <label className="review-attestation">
        <input name="visitAttested" type="checkbox" required />
        <span>
          이 식당에 직접 방문해 음식을 먹었으며, 개인적인 경험을 작성했습니다.
        </span>
      </label>

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
