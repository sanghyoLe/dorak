import Link from "next/link";
import { redirect } from "next/navigation";

import { SavedList } from "../../components/saved-list";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { getCatalog } from "../../server/catalog";
import { getViewer } from "../../server/viewer";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?callbackUrl=%2Fsaved");

  const branches = await getCatalog().listSavedBranches(viewer.userId);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell saved-page">
        <nav className="breadcrumb" aria-label="현재 위치">
          <Link href="/">도락</Link>
          <span aria-hidden="true">›</span>
          <span>저장한 식당</span>
        </nav>
        <header className="saved-page__heading">
          <p>내 목록</p>
          <h1>저장한 식당</h1>
          <span>{branches.length.toLocaleString("ko-KR")}곳</span>
        </header>
        <SavedList initialBranches={branches} />
      </main>
      <SiteFooter />
    </>
  );
}
