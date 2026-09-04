import Link from "next/link";

type SiteFooterProps = Readonly<{
  showDemoNotice?: boolean;
}>;

export function SiteFooter({ showDemoNotice = false }: SiteFooterProps) {
  return (
    <footer className="footer-line">
      <p>
        <strong>도락 DORAK</strong>
        <span>좋은 식당을 찾는 즐거움</span>
        <Link href="/review-policy">리뷰 원칙</Link>
        <Link href="/privacy">개인정보 처리 안내</Link>
        {showDemoNotice ? <span>베타 · 예시 식당 데이터</span> : null}
      </p>
    </footer>
  );
}
