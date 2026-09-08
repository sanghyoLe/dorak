import type { Metadata } from "next";
import Link from "next/link";

import { NearbyFinder } from "../../components/nearby-finder";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "내 주변 식당",
  description: "현재 위치에서 가까운 서울 식당을 거리순으로 찾습니다.",
};

export default function NearbyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell nearby-page">
        <nav className="breadcrumb" aria-label="현재 위치">
          <Link href="/">도락</Link>
          <span aria-hidden="true">›</span>
          <span>내 주변 식당</span>
        </nav>
        <NearbyFinder />
      </main>
      <SiteFooter />
    </>
  );
}
