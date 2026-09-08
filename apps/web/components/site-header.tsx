import Link from "next/link";

import { getViewer } from "../server/viewer";
import { SignOutButton } from "./auth-controls";
import { HeaderSearch } from "./header-search";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="도락 홈">
          <strong>도락</strong>
          <span>좋은 식당을 찾는 즐거움</span>
        </Link>
        <HeaderSearch />
        <nav aria-label="사용자 메뉴">
          <Link
            className="saved-nav-link"
            href="/saved"
            aria-label="저장한 식당"
          >
            저장
          </Link>
          {viewer ? (
            <>
              <span className="viewer-label">
                {viewer.demo ? "체험 계정" : `${viewer.name} 님`}
              </span>
              {viewer.demo ? null : <SignOutButton />}
            </>
          ) : (
            <Link href="/signin?callbackUrl=/">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
