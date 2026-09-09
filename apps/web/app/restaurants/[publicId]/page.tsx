import { ChevronLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewForm } from "../../../components/review-form";
import { ReviewReportForm } from "../../../components/review-report-form";
import { KakaoMap } from "../../../components/kakao-map";
import { SavedBranchButton } from "../../../components/saved-branch-button";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { findBranch, listBranchReviews } from "../../../server/catalog";
import { getViewer } from "../../../server/viewer";
import {
  REVIEW_USAGE_LABELS,
  filterReviewsByUsage,
  parseReviewUsageFilter,
  summarizeReviewUsage,
} from "../../../lib/review-usage";

type BranchPageProps = Readonly<{
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ usage?: string | string[] }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: BranchPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const branch = await findBranch(publicId);

  if (!branch) return { title: "식당을 찾을 수 없음" };

  return {
    title: branch.name,
    description: `${branch.neighborhood} ${branch.cuisineLabel} 식당 ${branch.name}의 정보와 식사 리뷰`,
  };
}

function formatKoreanDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00+09:00`));
}

function todayInKorea(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

export default async function BranchPage({
  params,
  searchParams,
}: BranchPageProps) {
  const { publicId } = await params;
  const [branch, reviews, viewer] = await Promise.all([
    findBranch(publicId),
    listBranchReviews(publicId),
    getViewer(),
  ]);

  if (!branch) notFound();
  const usageFilter = parseReviewUsageFilter((await searchParams).usage);
  const visibleReviews = filterReviewsByUsage(reviews, usageFilter);
  const usageSummary = summarizeReviewUsage(reviews);

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="page-shell branch-page">
        <nav className="breadcrumb" aria-label="현재 위치">
          <Link href="/">도락</Link>
          <span aria-hidden="true">›</span>
          <Link href="/r">서울 식당</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/r/${encodeURIComponent(branch.district)}`}>
            {branch.district}
          </Link>
          <span aria-hidden="true">›</span>
          <Link
            href={`/r/${encodeURIComponent(branch.district)}/${branch.cuisine}`}
          >
            {branch.cuisineLabel}
          </Link>
          <span aria-hidden="true">›</span>
          <span>{branch.name}</span>
        </nav>

        <header className="branch-heading">
          <p>
            {branch.neighborhood} · {branch.district} / {branch.cuisineLabel}
          </p>
          <h1>{branch.name}</h1>
          <div className="branch-heading__actions">
            <a className="branch-write-link" href="#write-review">
              리뷰 쓰기
            </a>
            <SavedBranchButton publicId={branch.publicId} />
          </div>
          {branch.provenance === "synthetic" ? (
            <div className="branch-heading__status" aria-label="정보 상태">
              <span data-state="sample">예시 식당</span>
            </div>
          ) : null}
        </header>

        <section className="branch-overview" aria-label={`${branch.name} 요약`}>
          <div className="branch-overview__copy">
            <p>{branch.shortDescription}</p>
            <p className="branch-overview__address">
              <MapPin aria-hidden="true" size={18} strokeWidth={2} />
              {branch.address}
            </p>
          </div>

          <dl className="branch-scoreboard">
            <div>
              <dt>평점</dt>
              <dd>{branch.rating === null ? "—" : branch.rating.toFixed(1)}</dd>
              <small>{branch.reviewCount ? "리뷰 평균" : "평가 전"}</small>
            </div>
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
        </section>

        <nav className="branch-section-nav" aria-label="상세 정보 바로가기">
          <a href="#reviews">리뷰 {reviews.length}</a>
          <a href="#write-review">리뷰 쓰기</a>
          <a href="#information">기본 정보</a>
          {branch.signatureMenu.length > 0 ? (
            <a href="#menu">대표 메뉴</a>
          ) : null}
        </nav>

        <div className="branch-content">
          <div className="branch-content__main">
            <section
              className="branch-section review-section"
              id="reviews"
              aria-labelledby="reviews-title"
            >
              <header className="review-section__header">
                <div>
                  <h2 id="reviews-title">리뷰 {visibleReviews.length}건</h2>
                </div>
                <p>상단 평점은 이용 방식을 합친 전체 평균입니다.</p>
              </header>

              <nav
                className="review-usage-filter"
                aria-label="이용 방식별 리뷰와 평점"
              >
                <Link
                  href={`/restaurants/${publicId}#reviews`}
                  aria-current={usageFilter === "all" ? "page" : undefined}
                  scroll={false}
                >
                  전체 {reviews.length}건
                </Link>
                {usageSummary.map((summary) => (
                  <Link
                    key={summary.usage}
                    href={`/restaurants/${publicId}?usage=${summary.usage}#reviews`}
                    aria-current={
                      usageFilter === summary.usage ? "page" : undefined
                    }
                    scroll={false}
                  >
                    {summary.label} ·{" "}
                    {summary.rating === null
                      ? "평가 전"
                      : `${summary.rating.toFixed(1)}점`}{" "}
                    · {summary.count}건
                  </Link>
                ))}
              </nav>
              <p className="review-usage-note">
                방식별 평점은 해당 공개 리뷰의 평균입니다. 리뷰가 적으면 개별
                경험도 함께 읽어주세요.
              </p>

              {visibleReviews.length ? (
                <ol className="review-list">
                  {visibleReviews.map((review) => (
                    <li key={review.publicId}>
                      <article className="review-entry">
                        <header>
                          <div>
                            <strong>{review.authorName}</strong>
                            <span>
                              {review.visitedOn
                                ? `${formatKoreanDate(review.visitedOn)} 이용`
                                : "이용일 미입력"}
                            </span>
                          </div>
                          <p>
                            <span>평점</span>
                            <strong>{review.rating.toFixed(1)}</strong>
                          </p>
                        </header>
                        <p className="review-entry__context">
                          {review.usageType
                            ? REVIEW_USAGE_LABELS[review.usageType]
                            : "이용 방식 미확인"}
                          {review.independentVisitAttested === true
                            ? " · 협찬 없음(작성자 응답)"
                            : " · 이해관계 미확인"}
                        </p>
                        <p className="review-entry__body">{review.body}</p>
                        <details className="review-entry__details">
                          <summary>리뷰 정보</summary>
                          <p>
                            {review.identityVerified
                              ? "이메일이 확인된 계정"
                              : "이메일 미확인 계정"}
                            {" · "}
                            {review.visitVerification === "self_reported"
                              ? "이용일은 작성자가 입력했으며 증빙은 확인하지 않음"
                              : review.visitVerification === "receipt"
                                ? "영수증 확인"
                                : "예약 내역 확인"}
                          </p>
                        </details>
                        <footer>
                          <span>{formatKoreanDate(review.createdAt)} 작성</span>
                        </footer>
                        <ReviewReportForm
                          reviewPublicId={review.publicId}
                          branchName={branch.name}
                        />
                      </article>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="review-empty">
                  <strong>
                    {usageFilter === "all"
                      ? "아직 공개된 리뷰가 없습니다."
                      : "이 이용 방식의 리뷰가 없습니다."}
                  </strong>
                  <p>직접 먹어봤다면 첫 기록을 남겨주세요.</p>
                </div>
              )}
            </section>

            <section
              className="branch-section"
              aria-labelledby="write-review-title"
            >
              <header>
                <h2 id="write-review-title">리뷰 쓰기</h2>
              </header>
              <ReviewForm
                branchPublicId={branch.publicId}
                branchName={branch.name}
                today={todayInKorea()}
                viewer={
                  viewer
                    ? {
                        name: viewer.name,
                        identityVerified: viewer.identityVerified,
                        demo: viewer.demo,
                      }
                    : null
                }
              />
            </section>

            <section
              className="branch-section"
              id="information"
              aria-labelledby="information-title"
            >
              <header>
                <h2 id="information-title">기본 정보</h2>
              </header>
              <dl className="information-table">
                <div>
                  <dt>식당명</dt>
                  <dd>{branch.name}</dd>
                </div>
                <div>
                  <dt>음식 장르</dt>
                  <dd>{branch.cuisineLabel}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{branch.address}</dd>
                </div>
                {branch.phone ? (
                  <div>
                    <dt>전화</dt>
                    <dd>
                      <a href={phoneHref(branch.phone)}>{branch.phone}</a>
                    </dd>
                  </div>
                ) : null}
                {branch.websiteUrl ? (
                  <div>
                    <dt>홈페이지</dt>
                    <dd>
                      <a
                        href={branch.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        홈페이지 열기 <span aria-hidden="true">↗</span>
                      </a>
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>지역</dt>
                  <dd>
                    {branch.district} {branch.neighborhood}
                  </dd>
                </div>
                {branch.priceBand ? (
                  <div>
                    <dt>가격대</dt>
                    <dd>{branch.priceBand}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>영업시간</dt>
                  <dd>{branch.openingHours ?? "영업시간 정보 없음"}</dd>
                </div>
                {branch.closedDays ? (
                  <div>
                    <dt>휴무일</dt>
                    <dd>{branch.closedDays}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>대표 메뉴</dt>
                  <dd>
                    {branch.signatureMenu.length > 0
                      ? branch.signatureMenu.join(" · ")
                      : "등록된 정보 없음"}
                  </dd>
                </div>
              </dl>
            </section>

            {branch.signatureMenu.length > 0 ? (
              <section
                className="branch-section"
                id="menu"
                aria-labelledby="menu-title"
              >
                <header>
                  <h2 id="menu-title">대표 메뉴</h2>
                  {branch.externalInfoUpdatedAt ? (
                    <p className="section-note">
                      서울관광재단 정보 기준{" "}
                      {formatKoreanDate(branch.externalInfoUpdatedAt)}
                    </p>
                  ) : null}
                </header>
                <ul className="branch-menu-list">
                  {branch.signatureMenu.map((menu) => (
                    <li key={menu}>
                      <strong>{menu}</strong>
                      <span>
                        {branch.externalInfoUpdatedAt
                          ? "서울관광재단 메뉴 데이터"
                          : "가격 정보 확인 전"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="branch-data-note" aria-labelledby="data-note-title">
            <h2 id="data-note-title">리뷰 기준</h2>
            <p>
              ‘이메일 확인’은 본인 인증이나 이용 인증이 아닙니다. 이용
              방식·이용일과 협찬·관계 여부는 작성자가 직접 확인한 내용이며,
              도락이 증빙을 확인했다는 뜻은 아닙니다.
            </p>
            <dl>
              <div>
                <dt>현재 평점</dt>
                <dd>공개 리뷰 단순 평균</dd>
              </div>
              <div>
                <dt>작성 제한</dt>
                <dd>계정당 식당별 1건</dd>
              </div>
              <div>
                <dt>상세 기준</dt>
                <dd>
                  <Link href="/review-policy">리뷰 원칙 보기</Link>
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className="branch-location" aria-labelledby="location-title">
          <header>
            <h2 id="location-title">찾아가기</h2>
          </header>
          <KakaoMap
            name={branch.name}
            address={branch.address}
            latitude={branch.latitude ?? null}
            longitude={branch.longitude ?? null}
            isSynthetic={branch.provenance === "synthetic"}
          />
          {branch.sourceName ? (
            <p className="branch-location__source">
              위치·주소 출처:{" "}
              {branch.provenance === "approved_source" ? (
                <a
                  href="https://data.seoul.go.kr/dataList/OA-16094/A/1/datasetView.do"
                  target="_blank"
                  rel="noreferrer"
                >
                  {branch.sourceName}
                </a>
              ) : (
                branch.sourceName
              )}
              {branch.lastVerifiedAt
                ? ` · ${new Intl.DateTimeFormat("ko-KR", {
                    dateStyle: "medium",
                    timeZone: "Asia/Seoul",
                  }).format(new Date(branch.lastVerifiedAt))} 기준`
                : null}
            </p>
          ) : null}
        </section>

        <Link className="back-to-results" href="/">
          <ChevronLeft aria-hidden="true" size={18} strokeWidth={2} />
          서울 식당 목록으로
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}
