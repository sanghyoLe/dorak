import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "../../components/auth-controls";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { googleSignInEnabled } from "../../server/auth";
import { getViewer } from "../../server/viewer";

type SignInPageProps = Readonly<{
  searchParams: Promise<{ callbackUrl?: string }>;
}>;

function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [{ callbackUrl }, viewer] = await Promise.all([
    searchParams,
    getViewer(),
  ]);
  const destination = safeCallbackUrl(callbackUrl);
  if (viewer && !viewer.demo) redirect(destination);

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-sheet" aria-labelledby="signin-title">
          <p className="auth-sheet__eyebrow">도락 계정</p>
          <h1 id="signin-title">리뷰를 쓰기 전에 계정을 확인합니다.</h1>
          <p>
            현재는 Google 로그인을 사용합니다. 이메일은 계정 중복과 부정 사용
            방지에 쓰며 리뷰에는 선택한 닉네임만 공개합니다. 로그인 전에
            <Link href="/privacy"> 개인정보 처리 안내</Link>를 확인해 주세요.
          </p>

          {googleSignInEnabled ? (
            <GoogleSignInButton callbackURL={destination} />
          ) : (
            <div className="auth-unavailable">
              <strong>로컬 체험 모드</strong>
              <p>
                Google OAuth 키가 없어 체험 계정으로 표시됩니다. 배포 환경에서는
                OAuth 설정 없이는 리뷰를 작성할 수 없습니다.
              </p>
              <Link href={destination}>식당 페이지로 돌아가기</Link>
            </div>
          )}

          <div className="auth-trust-note">
            <ShieldCheck aria-hidden="true" size={22} strokeWidth={2} />
            <p>
              <strong>계정 확인은 방문 인증이 아닙니다.</strong>
              방문 여부는 리뷰 작성 시 별도로 확인하며, 영수증이나 예약 내역이
              확인된 경우에만 ‘방문 확인’으로 표시합니다.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
