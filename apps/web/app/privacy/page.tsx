import Link from "next/link";

import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export const metadata = {
  title: "개인정보 처리 안내",
  description: "도락 MVP가 수집하고 이용하는 정보에 대한 안내",
};

const contactEmail =
  process.env.DORAK_CONTACT_EMAIL ?? "contact@example.invalid";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="policy-page">
        <header>
          <p>도락 운영 원칙 02</p>
          <h1>필요한 정보만, 쓰임이 보이게 다룹니다.</h1>
          <p>
            이 안내는 도락 MVP 기준입니다. 수집 항목이나 이용 목적이 달라지면
            공개 전에 내용을 먼저 고칩니다.
          </p>
        </header>

        <section className="policy-copy">
          <h2>수집하는 정보</h2>
          <ul>
            <li>
              Google 로그인에서 제공되는 이름, 이메일, 이메일 확인 여부, 프로필
              이미지
            </li>
            <li>로그인 유지와 보안을 위한 세션, 접속 IP, 브라우저 정보</li>
            <li>
              리뷰 작성 시 닉네임, 평점, 본문, 방문일, 방문 확인 상태와 작성
              시각
            </li>
          </ul>

          <h2>어디에 쓰는지</h2>
          <p>
            계정 중복과 부정 사용 방지, 로그인 유지, 리뷰 공개, 신고·분쟁 대응,
            서비스 보안에만 사용합니다. 이메일과 접속 정보는 공개 리뷰에
            표시하지 않으며 광고 판매를 위해 제공하지 않습니다.
          </p>

          <h2>보관과 삭제</h2>
          <p>
            계정과 리뷰는 서비스 이용 및 운영상 분쟁 대응에 필요한 동안
            보관합니다. 탈퇴·삭제 요청이 접수되면 법령상 보존 의무나 진행 중인
            분쟁에 필요한 범위를 제외하고 삭제하거나 식별할 수 없게 처리합니다.
            OAuth 토큰은 저장 시 암호화하고, 세션은 만료되거나 로그아웃하면 더
            이상 로그인에 사용할 수 없습니다.
          </p>

          <h2>문의와 권리 행사</h2>
          <p>
            자신의 정보 열람·정정·삭제나 리뷰 신고를 요청하려면 운영자에게
            연락할 수 있습니다. 정식 공개 전에는 실제 연락 가능한 이메일로 아래
            주소를 반드시 교체합니다.
          </p>
          <p>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
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
