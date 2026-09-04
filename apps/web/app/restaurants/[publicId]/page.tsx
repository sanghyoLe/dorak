import { ChevronLeft, MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewForm } from "../../../components/review-form";
import { KakaoMap } from "../../../components/kakao-map";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { findBranch, listBranchReviews } from "../../../server/catalog";
import { getViewer } from "../../../server/viewer";

type BranchPageProps = Readonly<{
  params: Promise<{ publicId: string }>;
}>;

export const dynamic = "force-dynamic";

const reviewContactEmail = process.env.DORAK_CONTACT_EMAIL;

export async function generateMetadata({
  params,
}: BranchPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const branch = await findBranch(publicId);

  if (!branch) return { title: "식당을 찾을 수 없음" };

  return {
    title: branch.name,
    description: `${branch.neighborhood} ${branch.cuisineLabel} 식당 ${branch.name}의 정보와 방문 리뷰`,
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

export default async function BranchPage({ params }: BranchPageProps) {
  const { publicId } = await params;
  const [branch, reviews, viewer] = await Promise.all([
    findBranch(publicId),
    listBranchReviews(publicId),
    getViewer(),
  ]);

  if (!branch) notFound();

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
          <div className="branch-heading__status" aria-label="정보 상태">
            <span data-state="attention">영업 정보 확인 전</span>
            {branch.provenance === "synthetic" ? (
              <span data-state="sample">예시 식당</span>
            ) : null}
          </div>
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
            <div>
              <dt>가격대</dt>
              <dd>{branch.priceBand}</dd>
            </div>
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
                  <h2 id="reviews-title">리뷰 {reviews.length}건</h2>
                </div>
                <p>평점은 공개 리뷰의 단순 평균입니다.</p>
              </header>

              {reviews.length ? (
                <ol className="review-list">
                  {reviews.map((review) => (
                    <li key={review.publicId}>
                      <article className="review-entry">
                        <header>
                          <div>
                            <strong>{review.authorName}</strong>
                            <span>
                              {formatKoreanDate(
                                review.visitedOn ?? review.createdAt,
                              )}{" "}
                              방문
                            </span>
                          </div>
                          <p>
                            <span>평점</span>
                            <strong>{review.rating.toFixed(1)}</strong>
                          </p>
                        </header>
                        <div
                          className="review-trust-labels"
                          aria-label="리뷰 신뢰 정보"
                        >
                          <span
                            data-level={
                              review.identityVerified ? "account" : "sample"
                            }
                          >
                            <ShieldCheck
                              aria-hidden="true"
                              size={14}
                              strokeWidth={2}
                            />
                            {review.identityVerified
                              ? "계정 확인"
                              : "예시 리뷰"}
                          </span>
                          <span>
                            {review.visitVerification === "self_reported"
                              ? "방문일 자기입력"
                              : "방문 확인"}
                          </span>
                        </div>
                        <p className="review-entry__body">{review.body}</p>
                        <footer>
                          <span>
                            {formatKoreanDate(review.createdAt)} 작성 · 방문
                            확인 자료 없음
                          </span>
                          {reviewContactEmail ? (
                            <a
                              href={`mailto:${reviewContactEmail}?subject=${encodeURIComponent(`[도락 리뷰 신고] ${branch.name}`)}&body=${encodeURIComponent(`리뷰 ID: ${review.publicId}\n문제가 되는 이유를 적어 주세요.`)}`}
                            >
                              문제 신고
                            </a>
                          ) : null}
                        </footer>
                      </article>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="review-empty">
                  <strong>아직 공개된 리뷰가 없습니다.</strong>
                  <p>직접 방문했다면 첫 기록을 남겨주세요.</p>
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
                <div>
                  <dt>가격대</dt>
                  <dd>
                    {branch.provenance === "approved_source"
                      ? "확인 전"
                      : branch.priceBand}
                  </dd>
                </div>
                <div>
                  <dt>영업시간</dt>
                  <dd>{branch.openingHours ?? "등록 정보 없음"}</dd>
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
              ‘계정 확인’은 작성자가 로그인한 계정임을 뜻합니다. ‘방문일
              자기입력’은 영수증이나 예약 내역을 확인했다는 의미가 아닙니다.
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
