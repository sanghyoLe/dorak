export default function HealthPage() {
  return (
    <main id="main-content" className="status-page">
      <p className="status-page__eyebrow">DORAK / WEB</p>
      <h1>정상 작동 중</h1>
      <p>소비자 웹 애플리케이션이 요청에 응답하고 있습니다.</p>
      <a href="/api/health">데이터 연결 상태 보기</a>
      <a href="/">탐색으로 돌아가기</a>
    </main>
  );
}
