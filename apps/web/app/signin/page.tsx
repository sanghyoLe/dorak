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
  const isSavedDestination = destination.startsWith("/saved");
  if (viewer && !viewer.demo) redirect(destination);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="auth-page">
        <section className="auth-sheet" aria-labelledby="signin-title">
          <h1 id="signin-title">로그인</h1>
          <p>
            {isSavedDestination
              ? "저장한 식당을 계정에 이어서 보관할 수 있습니다. "
              : "식당을 저장하고 리뷰를 남길 수 있습니다. "}
            현재는 Google 로그인을 사용합니다. 리뷰에는 선택한 닉네임만
            공개합니다. 로그인 전에
            <Link className="auth-privacy-link" href="/privacy">
              {" "}
              개인정보 처리 안내
            </Link>
            를 확인해 주세요.
          </p>

          {googleSignInEnabled ? (
            <GoogleSignInButton callbackURL={destination} />
          ) : (
            <div className="auth-unavailable">
              <strong>로그인 준비 중</strong>
              <p>현재 로그인할 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
              <Link href={destination}>이전 화면으로 돌아가기</Link>
            </div>
          )}

          <p className="auth-trust-note">
            로그인은 식당 이용 여부를 인증하지 않습니다.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
