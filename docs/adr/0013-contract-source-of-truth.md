# ADR-013: 계약 원본과 스키마 버전

- 상태: Accepted
- 결정일: 2026-09-02
- owner: API Platform
- 검토자: Mobile, Web, Backend, Data Platform

## 맥락

도락의 같은 개념은 REST DTO, 도메인 이벤트, PostgreSQL row, OpenSearch document, TypeScript와 Python 타입으로 표현된다. 각 팀이 타입을 수동 복제하면 nullable, enum, 날짜, 금액, 예약 상태의 의미가 달라지고 공개 API와 실제 구현이 drift할 수 있다.

OpenAPI 최신 규격은 2026-09-02 기준 3.2.0이지만, 초기 저장소에서는 SDK 생성기·validator·breaking-change 도구가 함께 지원하는 검증된 규격을 명시적으로 고정할 필요가 있다.

## 결정 기준

- 기계 검증과 사람의 검토 가능성
- TypeScript·Python 도구 호환성
- 공개 API와 이벤트의 장기 호환성
- 생성 코드의 재현성
- 개인정보 field의 자동 통제 가능성
- DB·검색 구현과 외부 계약의 분리

## 결정

1. REST 계약은 OpenAPI 3.1.2를 초기 고정 버전으로 사용한다.
2. 공통 schema와 이벤트 payload는 JSON Schema Draft 2020-12를 사용한다.
3. 공개 REST의 기계 원본은 `openapi/`, 이벤트 원본은 `schemas/events/`, DB 원본은 `db/migrations/`로 분리한다.
4. REST DTO를 이벤트나 DB entity로 재사용하지 않는다.
5. OpenAPI에서 생성한 타입과 client는 transport 경계에만 사용하고 직접 수정하지 않는다.
6. 계약 lint, example validation, breaking diff, clean code generation을 CI merge gate로 둔다.
7. 초기 이벤트 registry는 repository와 JSON Schema로 운영한다. AsyncAPI는 broker·독립 소비자가 늘어날 때 재검토한다.
8. OpenAPI 3.2 전환은 전체 도구 matrix와 SDK diff를 검증한 새 ADR로 결정한다.

## 대안

### OpenAPI 3.2를 즉시 사용

최신 규격을 사용할 수 있지만 초기 generator와 validation 도구 조합을 아직 저장소에서 검증하지 않았다. 도구 검증 후 전환 가능하다.

### TypeScript 타입을 원본으로 사용

서버 개발은 편하지만 Python, 파트너 문서, HTTP 의미, 독립 validation이 TypeScript 구현에 종속된다.

### 데이터베이스 schema에서 모든 계약 생성

중복을 줄이는 것처럼 보이지만 actor별 권한, 목적별 읽기 모델, 외부 호환성을 영속화 구조와 결합한다.

### Protocol Buffers를 공통 원본으로 사용

내부 RPC와 binary 전송에는 장점이 있지만 v1의 REST/JSON 공개 계약, 브라우저, 파트너 문서에 추가 변환 계층이 필요하다.

### AsyncAPI를 처음부터 필수화

channel과 메시지 문서화에는 유리하지만 초기 모듈형 모놀리스의 소비자 수에 비해 도구 운영 비용이 앞선다.

## 긍정적 결과

- API·이벤트·DB의 원본과 mapping 방향이 명확하다.
- SDK와 fixture를 재현 가능하게 생성한다.
- 호환되지 않는 변경을 배포 전에 차단할 수 있다.
- actor별 DTO와 개인정보 분류를 공개 계약에서 검토할 수 있다.
- 이벤트 과거 버전과 replay fixture를 보존할 수 있다.

## 부정적 결과

- schema와 domain mapping 코드를 별도로 유지해야 한다.
- generator·validator 버전 관리 비용이 생긴다.
- enum 추가처럼 규격상 허용돼도 소비자 검토가 필요한 변경이 있다.
- OpenAPI 3.2 기능을 바로 사용하지 못한다.
- 문서·schema·fixture 정합성을 CI로 유지해야 한다.

## 보안·개인정보·운영 영향

- 공개·점주·운영 DTO를 분리하고 ORM row 자동 직렬화를 금지한다.
- 개인정보 field에 분류, 목적, 로그, 보존 metadata를 붙일 수 있다.
- credential은 공개 response와 일반 이벤트에 포함되면 merge를 차단한다.
- request/response 전체 body 로깅을 계약 validation 수단으로 사용하지 않는다.
- event는 at-least-once 전달을 전제로 하고 consumer를 멱등하게 만든다.

## 구현

1. `openapi/dorak-v1.yaml`과 공통 component를 만든다.
2. OpenAPI 3.1.2와 JSON Schema Draft 2020-12 validator를 고정한다.
3. branch 조회 수직 슬라이스를 첫 public contract로 구현한다.
4. event envelope와 branch event fixture를 만든다.
5. TypeScript SDK clean-generation과 breaking diff를 CI에 추가한다.
6. Python 소비자가 등장할 때 같은 event fixture로 호환성을 검증한다.

## 검증

- OpenAPI bundle과 모든 example validation
- 생성 SDK의 모바일·웹 compile
- main 대비 breaking-change CI
- event 중복·역순·과거 fixture test
- public response allowlist test
- credential·개인정보 schema lint
- 생성 후 repository clean diff

## 재검토 조건

- OpenAPI 3.2가 선택한 generator·validator·diff 도구에서 안정적으로 지원된다.
- 독립 서비스와 broker channel이 늘어 AsyncAPI catalog 가치가 커진다.
- 외부 파트너가 SDK artifact의 독립 배포를 요구한다.
- JSON 이외의 고성능 내부 RPC 경계가 실제 병목으로 확인된다.
- schema registry와 owner 관리가 repository만으로 병목이 된다.

## 되돌리기 비용

OpenAPI minor 전환은 도구 검증과 생성 SDK diff가 필요하지만 공개 wire 계약을 유지하면 중간 수준이다. 원본 계층이나 공개 형식을 바꾸는 결정은 모든 소비자와 CI를 이행해야 하므로 비용이 높다.

## 관련 문서

- [CONTRACTS_AND_SCHEMAS.md](../architecture/CONTRACTS_AND_SCHEMAS.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [ADR-010](./0010-rest-openapi.md)
