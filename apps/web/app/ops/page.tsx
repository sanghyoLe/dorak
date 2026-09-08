import type {
  IngestionCandidate,
  OpsReview,
  OpsReviewReport,
} from "@dorak/domain-types";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CandidateQueue } from "../../components/candidate-queue";
import { ReportQueue } from "../../components/report-queue";
import { ReviewQueue } from "../../components/review-queue";
import { getCatalog } from "../../server/catalog";
import { authorizeOps } from "../../server/ops-auth";

export const dynamic = "force-dynamic";

interface OpsLoadResult {
  candidates: IngestionCandidate[];
  reviews: OpsReview[];
  reports: OpsReviewReport[];
  dataAvailable: boolean;
  dataMode: "memory" | "postgres";
}

async function loadOpsData(): Promise<OpsLoadResult> {
  const catalog = getCatalog();

  try {
    const [candidates, reviews, reports] = await Promise.all([
      catalog.listCandidates(),
      catalog.listRecentReviews(),
      catalog.listReviewReports(),
    ]);
    return {
      candidates,
      reviews,
      reports,
      dataAvailable: true,
      dataMode: catalog.mode,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DORAK_OPS_LOAD_ERROR", { message });
    return {
      candidates: [],
      reviews: [],
      reports: [],
      dataAvailable: false,
      dataMode: catalog.mode,
    };
  }
}

export default async function OpsPage() {
  const authorization = authorizeOps(await headers());
  if (!authorization.authorized) notFound();

  const { candidates, reviews, reports, dataAvailable, dataMode } =
    await loadOpsData();
  const dataModeLabel = dataMode === "postgres" ? "PostgreSQL" : "인메모리";

  return (
    <main id="main-content" className="ops-shell">
      <header className="ops-header">
        <div>
          <p>도락</p>
          <h1>운영</h1>
          <span>
            신고 {reports.length}건 · 후보 {candidates.length}건 · 리뷰{" "}
            {reviews.length}건
          </span>
        </div>
        <nav aria-label="운영 메뉴">
          <a href="#reports">신고 검토</a>
          <a href="#queue">식당 후보</a>
          <a href="#reviews">리뷰 관리</a>
          <Link href="/">소비자 웹</Link>
          <Link href="/api/health">데이터 상태</Link>
        </nav>
      </header>

      <ReportQueue initialReports={reports} dataAvailable={dataAvailable} />

      <CandidateQueue
        initialCandidates={candidates}
        dataAvailable={dataAvailable}
      />

      <ReviewQueue initialReviews={reviews} dataAvailable={dataAvailable} />

      <footer className="ops-footer">
        <strong>도락 운영</strong>
        <span>{dataModeLabel} 저장소</span>
      </footer>
    </main>
  );
}
