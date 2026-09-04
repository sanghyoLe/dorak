import Link from "next/link";

import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export const metadata = {
  title: "리뷰 원칙",
  description: "도락이 리뷰의 신뢰를 다루는 기준",
};

export default function ReviewPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="policy-page">
        <header>
          <p>도락 운영 원칙 01</p>
          <h1>확인한 것과 주장한 것을 구분합니다.</h1>
          <p>
            도락은 리뷰 수를 늘리기 위해 신뢰 수준을 부풀리지 않습니다. 아래
            표시는 서로 다른 의미를 가집니다.
          </p>
        </header>

        <section className="policy-levels" aria-label="리뷰 신뢰 표시">
          <article>
            <strong>계정 확인</strong>
            <p>외부 로그인 제공자가 실제 계정과 이메일을 확인했습니다.</p>
          </article>
          <article>
            <strong>방문일 입력</strong>
            <p>작성자가 직접 방문해 식사했다고 확인하고 날짜를 입력했습니다.</p>
          </article>
          <article>
            <strong>방문 확인</strong>
            <p>예약 내역이나 영수증처럼 별도의 근거를 도락이 확인했습니다.</p>
          </article>
        </section>

        <section className="policy-copy">
          <h2>작성 기준</h2>
          <ol>
            <li>직접 방문해 음식을 먹은 식당만 작성합니다.</li>
            <li>
              방문일과 먹은 메뉴, 맛 또는 서비스 경험을 구체적으로 적습니다.
            </li>
            <li>
              식당 관계자는 자신과 이해관계가 있는 식당을 평가하지 않습니다.
            </li>
            <li>
              광고, 대가성 홍보, 타인 비방과 확인하기 어려운 단정을 금지합니다.
            </li>
            <li>한 계정은 한 식당에 리뷰 하나를 유지합니다.</li>
          </ol>

          <h2>평점과 운영</h2>
          <p>
            MVP의 식당 평점은 공개 상태인 리뷰의 단순 평균입니다. 표본이 적은
            경우 리뷰 수를 함께 확인해야 하며, 숨김 처리된 리뷰는 계산에서
            제외됩니다. 가중 평점은 충분한 데이터와 공개 가능한 산식이 생긴
            뒤에만 도입합니다.
          </p>
          <p>
            리뷰 하단의 <strong>문제 신고</strong>로 허위 방문, 광고성 글,
            개인정보 노출 등을 운영자에게 알릴 수 있습니다. MVP에서는 메일로
            접수한 뒤 운영자가 확인하고 필요하면 공개 숨김 처리합니다.
          </p>
        </section>

        <Link className="back-to-results" href="/">
          서울 음식점 목록으로
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
