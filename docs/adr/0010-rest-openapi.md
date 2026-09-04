# ADR-010: REST/JSON과 OpenAPI 3.1.2

- 상태: Accepted
- 결정일: 2026-09-02
- owner: API Platform
- 검토자: Mobile, Web, Backend, Partners

## 맥락

도락의 모바일·웹·점주·운영 클라이언트는 검색·상세 조회와 리뷰·예약·권한 상태 명령을 사용한다. 예약·결제는 명시적인 HTTP 의미, 멱등성, 상태 코드, 캐시와 계약 검증이 중요하다.

## 결정 기준

- 리소스·명령 의미
- HTTP cache/ETag/status
- SDK와 schema generation
- 문서·파트너 친숙성
- 오류·버전 호환
- 운영 관측성

## 결정

외부 클라이언트 계약은 REST/JSON과 OpenAPI 3.1.2를 기본으로 한다. 주 버전은 `/v1` 경로에 둔다. 규격 minor와 schema 원본·생성 경계는 [ADR-013](./0013-contract-source-of-truth.md)을 따른다.

상태 전이 명령은 필요한 경우 colon action을 사용한다.

```text
POST /v1/reservations/{id}:cancel
POST /v1/reviews/{id}:publish
```

오류는 RFC 9457 Problem Details 기반의 안정된 `code`를 추가한다.

## 대안

### GraphQL

유연한 조회가 장점이나 예약 명령·HTTP cache·권한 복잡도와 운영 비용에서 v1 기본으로 선택하지 않았다.

### gRPC

내부 service-to-service에는 후보지만 웹·모바일·파트너 공개 계약의 기본으로는 도구·디버깅 부담이 있다.

### RPC JSON

명령 표현은 단순하지만 HTTP 리소스·캐시·표준 문서 이점을 잃는다.

## 긍정적 결과

- 명확한 method/status/cache
- OpenAPI SDK·lint·breaking detection
- 파트너와 일반적인 integration
- CDN/ETag 활용
- endpoint 단위 SLO·권한

## 부정적 결과

- 여러 화면에 맞춘 endpoint/읽기 모델 필요
- over/under-fetch 가능
- OpenAPI와 구현 drift 관리
- action endpoint 규약 필요

## 통제

- purpose-built read endpoint
- cursor pagination
- Idempotency-Key
- If-Match/resourceVersion
- Problem Details
- OpenAPI CI와 생성 SDK
- field allowlist와 DTO 분리
- consumer contract test

## 검증

- 모바일·웹 SDK build
- 예약 재시도·timeout
- 공개 상세 CDN cache
- 권한 matrix
- breaking change CI

## 재검토 조건

- 특정 클라이언트의 복합 조회가 지속적인 성능·개발 병목이 된다.
- 외부 파트너가 다른 표준을 명확히 요구한다.
- 서비스 분리 후 내부 streaming/RPC 경계가 필요하다.

## 되돌리기 비용

공개 API 변경은 클라이언트 호환 때문에 높다. 새로운 query/RPC 계층을 병행 추가할 수 있지만 기존 v1 폐기 절차가 필요하다.

## 관련 문서

- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [CONTRACTS_AND_SCHEMAS.md](../architecture/CONTRACTS_AND_SCHEMAS.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
