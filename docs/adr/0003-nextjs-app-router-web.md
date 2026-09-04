# ADR-003: Next.js App Router 웹 애플리케이션

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Web
- 검토자: Product, Platform, SEO

## 맥락

도락은 공유 가능한 음식점 상세와 검색 유입을 위한 공개 웹, 인증된 점주·운영자 업무 앱이 필요하다. 공개 페이지는 서버 렌더링·메타데이터·캐시가 중요하고, 업무 앱은 복잡한 폼과 권한·동적 데이터가 중요하다.

## 결정 기준

- 공개 렌더링과 SEO
- React 생태계와 팀 역량
- 서버/클라이언트 데이터 경계
- 캐시·재검증
- 배포 유연성
- 인증된 업무 앱 지원

## 결정

Next.js App Router를 사용한다.

```text
apps/web    공개 웹
apps/owner  점주 콘솔
apps/ops    운영자 콘솔
```

초기에는 package와 배포를 분리하되 동일 Next.js 선택을 사용한다. Server Component를 기본으로 하고 상호작용이 필요한 영역만 Client Component로 둔다.

## 대안

### 단일 Next.js 앱

초기 단순성은 높지만 공개/점주/운영의 인증·캐시·배포·보안 경계가 섞인다.

### Remix/React Router framework

좋은 서버 중심 모델을 제공하지만 현재 팀·생태계와 공개 렌더링 요구에서 Next.js를 선택했다.

### SPA + 별도 SSR

인프라와 데이터 fetching이 이중화된다.

## 긍정적 결과

- 공개 상세의 SSR/streaming/metadata
- route 단위 server/client 경계
- React 공용 컴포넌트·토큰
- 앱별 독립 배포와 보안 header

## 부정적 결과

- App Router 캐시 의미를 정확히 관리해야 한다.
- server/client component 경계가 학습 비용을 만든다.
- framework upgrade와 호스팅 특성에 영향받는다.
- 잘못된 dynamic 사용은 공개 페이지 성능을 해친다.

## 통제

- route별 cache 계약 문서
- 사용자·예약 응답 `private/no-store`
- bundle·hydration budget
- 공개/owner/ops 인증 middleware 분리
- framework 기능을 도메인 서비스 경계로 누출하지 않음
- 접근성·Core Web Vitals 검증

## 검증

- branch 상세의 검색엔진·공유 metadata
- 캐시된 공개 정보와 실시간 예약 영역 분리
- 점주 메뉴/예약 폼의 충돌 처리
- 운영자 민감 페이지의 캐시·권한 부정 테스트

## 재검토 조건

- framework 캐시·배포 모델이 SLO를 반복 위반한다.
- 앱별 요구가 크게 달라져 다른 framework가 명확한 이득을 준다.
- 운영 비용 또는 보안 경계가 유지 불가능하다.

## 되돌리기 비용

React 컴포넌트 일부는 재사용 가능하지만 routing, server data, caching을 재작성해야 해 중간~높음이다.

## 관련 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)

