import type { IngestionCandidate, OpsReview } from "@dorak/domain-types";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CandidateQueue } from "../../components/candidate-queue";
import { ReviewQueue } from "../../components/review-queue";
import { getCatalog } from "../../server/catalog";
import { authorizeOps } from "../../server/ops-auth";

export const dynamic = "force-dynamic";

interface OpsLoadResult {
  candidates: IngestionCandidate[];
  reviews: OpsReview[];
  dataAvailable: boolean;
  dataMode: "memory" | "postgres";
}

async function loadOpsData(): Promise<OpsLoadResult> {
  const catalog = getCatalog();

  try {
    const [candidates, reviews] = await Promise.all([
      catalog.listCandidates(),
      catalog.listRecentReviews(),
    ]);
    return {
      candidates,
      reviews,
      dataAvailable: true,
      dataMode: catalog.mode,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DORAK_OPS_LOAD_ERROR", { message });
    return {
      candidates: [],
      reviews: [],
      dataAvailable: false,
      dataMode: catalog.mode,
    };
  }
}

export default async function OpsPage() {
  const authorization = authorizeOps(await headers());
  if (!authorization.authorized) notFound();

  const { candidates, reviews, dataAvailable, dataMode } = await loadOpsData();
  const dataModeLabel = dataMode === "postgres" ? "PostgreSQL" : "인메모리";

  return (
    <main className="ops-shell">
      <header className="ops-header">
        <div>
          <p>도락 / 운영실</p>
          <h1>식당 후보 검수</h1>
        </div>
        <nav aria-label="운영 메뉴">
          <a href="#queue">대기열</a>
          <a href="#reviews">리뷰 관리</a>
          <Link href="/">소비자 웹</Link>
          <Link href="/api/health">데이터 상태</Link>
        </nav>
      </header>

      <section className="ops-intro" aria-labelledby="ops-intro-title">
        <p>수집 후보 → 검수 결정</p>
        <h2 id="ops-intro-title">
          원문을 보존하고, 지점으로 만들기 전에 사람이 확인합니다.
        </h2>
        <p>
          현재 후보와 주소는 제품 검증용 합성 데이터입니다. 승인과 반려는 같은
          애플리케이션의 API를 거쳐 {dataModeLabel} 저장소에 반영됩니다.
        </p>
      </section>

      <CandidateQueue
        initialCandidates={candidates}
        dataAvailable={dataAvailable}
      />

      <ReviewQueue initialReviews={reviews} dataAvailable={dataAvailable} />

      <footer className="ops-footer">
        <strong>도락 운영실</strong>
        <span>합성 데이터 환경 · {dataModeLabel}</span>
      </footer>
    </main>
  );
}
