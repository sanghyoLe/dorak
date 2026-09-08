import Link from "next/link";

import { SavedList } from "../../components/saved-list";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { getCatalog } from "../../server/catalog";
import { getViewer } from "../../server/viewer";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const viewer = await getViewer();
  const accountViewer = viewer && !viewer.demo ? viewer : null;
  const branches = accountViewer
    ? await getCatalog().listSavedBranches(accountViewer.userId)
    : [];

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell saved-page">
        <nav className="breadcrumb" aria-label="현재 위치">
          <Link href="/">도락</Link>
          <span aria-hidden="true">›</span>
          <span>저장한 식당</span>
        </nav>
        <SavedList
          initialBranches={branches}
          authenticated={Boolean(accountViewer)}
        />
      </main>
      <SiteFooter />
    </>
  );
}
