import { Discovery } from "../components/discovery";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { getCatalog } from "../server/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = getCatalog();
  const approvedOnly =
    catalog.mode === "postgres" && process.env.DORAK_DEMO_AUTH !== "true";
  const [initialResult, locations] = await Promise.all([
    catalog.searchBranches("", undefined, {
      limit: 60,
      approvedOnly,
    }),
    catalog.listLocations({ approvedOnly }),
  ]);
  const loadedBranches = initialResult.data;
  const hasApprovedSource = loadedBranches.some(
    (branch) => branch.provenance === "approved_source",
  );
  const branches = hasApprovedSource
    ? loadedBranches.filter((branch) => branch.provenance === "approved_source")
    : loadedBranches;

  return (
    <>
      <SiteHeader />

      <main className="page-shell home-page">
        <Discovery
          branches={branches}
          locations={locations}
          totalCount={initialResult.meta.total}
        />
      </main>

      <SiteFooter
        showDemoNotice={branches.some(
          (branch) => branch.provenance === "synthetic",
        )}
      />
    </>
  );
}
