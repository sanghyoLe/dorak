# 도락 계약·스키마 관리 설계

> 실행 우선순위 안내: HTTP·이벤트 계약 원칙은 유지한다. 현재 HTTP adapter는 Next.js Route Handler이며 NestJS 연동과 OpenSearch document 계약은 전환·확장 참고안이다. 기준은 [ADR-017](../adr/0017-cost-first-personal-project.md)이다.

> 상태: 초안 v0.1  
> 기준일: 2026-09-02  
> 대상: 공개 API, 점주·운영 API, 도메인 이벤트, 작업 메시지, 웹훅, 생성 SDK  
> 규격 고정: OpenAPI 3.1.2, JSON Schema Draft 2020-12  
> 연관 문서: [API_DESIGN.md](./API_DESIGN.md), [DATA_MODEL.md](./DATA_MODEL.md), [DATABASE_SCHEMA_BLUEPRINT.md](./DATABASE_SCHEMA_BLUEPRINT.md), [FOUNDATION_VERTICAL_SLICE.md](./FOUNDATION_VERTICAL_SLICE.md), [MONOREPO_ARCHITECTURE.md](./MONOREPO_ARCHITECTURE.md), [TECH_STACK.md](./TECH_STACK.md), [TEST_STRATEGY.md](./TEST_STRATEGY.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)

---

## 1. 목적

도락에는 같은 개념이 여러 표현으로 존재한다.

- PostgreSQL의 쓰기 모델
- 검색과 상세 화면을 위한 읽기 모델
- 모바일·웹에 전달하는 REST 응답
- 도메인 변경을 전달하는 이벤트
- 외부 공급자와 교환하는 웹훅
- TypeScript와 Python 코드가 사용하는 타입

이 표현들이 독립적으로 만들어지면 `branchId`의 타입, 예약 상태, 금액 단위, 날짜 의미처럼 작아 보이는 차이가 런타임 장애와 데이터 오염으로 이어진다. 이 문서는 각 계약의 원본, 생성 방향, 호환성 규칙, 변경 승인 절차를 정한다.

목표는 다음과 같다.

1. 사람이 읽는 설계와 기계가 검증하는 스키마를 연결한다.
2. 공개 계약이 데이터베이스나 공급자 구현에 종속되지 않게 한다.
3. 호환되지 않는 변경을 배포 전에 탐지한다.
4. 이벤트 재처리와 장기 보관 시 과거 payload를 해석할 수 있게 한다.
5. 개인정보가 계약을 통해 무심코 복제·로그·색인되지 않게 한다.
6. 생성 코드는 반복 작업을 줄이되 도메인 규칙의 원본이 되지 않게 한다.

---

## 2. 범위와 비범위

### 2.1 포함

- 소비자, 점주, 운영자, 파트너 REST 계약
- 내부 도메인 이벤트와 integration event
- 비동기 작업 명령과 결과
- 외부 수신·발신 웹훅
- 공통 primitive와 식별자
- 오류, 페이지네이션, 멱등성, 동시성 계약
- 스키마 버전과 호환성 판정
- TypeScript·Python 타입 생성 경계
- 계약 테스트, fixture, CI gate
- 데이터 분류와 관측성 metadata

### 2.2 포함하지 않음

- 실제 테이블 DDL과 인덱스 전체
- 화면 내부의 임시 UI 상태
- 추천·평점 모델의 수학적 정의
- 특정 공급자 SDK의 내부 타입
- 모든 이벤트를 중앙 broker에 공개하는 조직 구조
- 초기 단계의 gRPC 또는 Protocol Buffers 도입

DDL은 [DATA_MODEL.md](./DATA_MODEL.md)와 향후 migration이 원본이다. 수학적 정책은 [RATING_SYSTEM.md](../features/RATING_SYSTEM.md), 검색 문서는 [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md), 예약 상태 머신은 [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)가 의미의 원본이다.

---

## 3. 핵심 결정

### 3.1 OpenAPI 3.1.2를 초기 고정 버전으로 사용한다

OpenAPI의 최신 공개 규격은 2026-09-02 기준 3.2.0이다. 그러나 도락 v1은 생성기, lint, breaking-change 탐지, NestJS 연동이 실제 저장소에서 모두 통과한 조합을 우선해 3.1.2로 고정한다.

이 선택은 3.2를 거부한다는 뜻이 아니다. 다음을 모두 검증한 뒤 별도 ADR로 올린다.

- TypeScript 모바일·웹 SDK 생성 결과가 동일하거나 더 안전하다.
- 서버 request/response validation이 사용하는 기능을 정확히 지원한다.
- lint와 breaking-change 비교가 CI에서 안정적으로 동작한다.
- 예시와 nullable 표현이 의미를 잃지 않는다.
- 파트너 문서 렌더링과 mock server가 정상 동작한다.

초기 OpenAPI 파일은 문서 첫 줄에 다음 값을 가진다.

```yaml
openapi: 3.1.2
jsonSchemaDialect: https://json-schema.org/draft/2020-12/schema
```

### 3.2 JSON Schema Draft 2020-12를 공통 데이터 규격으로 사용한다

OpenAPI component와 독립 이벤트 schema가 가능한 한 같은 JSON Schema 의미를 공유한다. 다만 도구가 지원하지 않는 keyword를 억지로 사용하지 않는다. 지원 범위는 CI에서 실제 validator로 검증한다.

### 3.3 REST 계약과 이벤트 계약을 분리한다

REST 응답 DTO를 이벤트 payload로 재사용하지 않는다.

- REST는 특정 소비자 행동과 접근 권한에 맞춘 현재 표현이다.
- 이벤트는 이미 일어난 도메인 사실의 최소 표현이다.
- 검색 문서는 파생된 읽기 모델이다.
- DB row는 영속화 전략이다.

동일한 `Branch`라는 이름을 공유하더라도 생명주기와 호환성 책임이 다르다.

### 3.4 AsyncAPI는 초기 필수 도구가 아니다

초기 모듈형 모놀리스에서는 transactional outbox와 JSON Schema registry로 이벤트 계약을 관리한다. broker channel과 다수 독립 소비자가 생기면 AsyncAPI 3.0 도입을 검토한다. 도입 전에도 envelope, payload schema, 소유자, delivery 의미는 반드시 문서화한다.

### 3.5 생성 타입은 transport 경계에만 사용한다

OpenAPI에서 생성한 DTO와 client는 네트워크 경계의 타입이다. 다음을 대신하지 않는다.

- Drizzle schema
- 도메인 entity와 value object
- 권한 정책
- 상태 전이 함수
- 평점·추천 모델 입력
- 화면의 view model

생성 타입을 도메인 모델처럼 쓰면 API 변경이 내부 전체에 전파되고 금지된 상태를 타입만으로 막을 수 없다.

---

## 4. 단일 기준과 생성 방향

### 4.1 원본 계층

```text
제품·도메인 정책 문서
        ↓ 의미 승인
OpenAPI / JSON Schema / migration
        ↓ 검증·생성
서버 adapter · SDK · fixture · mock
        ↓ mapping
도메인 모델 · 읽기 모델 · UI view model
```

기계 원본이 하나라는 말은 모든 표현을 하나의 거대한 schema로 합친다는 뜻이 아니다. 계약 종류마다 원본은 하나이고, 변환 방향이 명확해야 한다.

| 대상           | 기계 원본                                    | 생성/구현 산출물                          |
| -------------- | -------------------------------------------- | ----------------------------------------- |
| 외부 REST      | `openapi/dorak-v1.yaml`                      | TS client, transport DTO, 문서, mock      |
| 운영 전용 REST | `openapi/dorak-ops-v1.yaml` 또는 분리된 root | 운영 client, 문서                         |
| 도메인 이벤트  | `schemas/events/**`                          | TS/Python payload type, fixture validator |
| 웹훅 수신      | `schemas/webhooks/inbound/**`                | 검증 adapter, fixture                     |
| 웹훅 발신      | OpenAPI/JSON Schema                          | 파트너 문서, signing test                 |
| DB 구조        | `db/migrations/**`                           | 실제 database schema                      |
| 검색 document  | `schemas/search/**`                          | index mapping validator                   |

### 4.2 문서와 schema 충돌 시

1. 운영 중인 공개 계약에서는 배포된 schema와 실제 wire behavior가 우선이다.
2. 의도와 실제가 다르면 자동으로 한쪽을 덮지 않는다.
3. incident 또는 contract-drift issue를 만들고 영향 소비자를 식별한다.
4. 호환 가능한 방향으로 구현 또는 문서를 복구한다.
5. 의미 변경이 필요하면 버전 절차를 따른다.

설계 단계에서는 제품 정책 문서가 의미를 정하고 schema가 이를 실행 가능하게 표현한다. 표현할 수 없는 정책은 validation 이후 애플리케이션 규칙으로 명시한다.

---

## 5. 권장 저장소 구조

```text
openapi/
  dorak-v1.yaml
  dorak-ops-v1.yaml
  components/
    common.yaml
    errors.yaml
    pagination.yaml
    branches.yaml
    reviews.yaml
    reservations.yaml
  examples/
    branches/
    reviews/
    reservations/

schemas/
  common/
    money.schema.json
    geo-point.schema.json
    local-date.schema.json
  events/
    branch/
      branch-created/v1.schema.json
      branch-updated/v1.schema.json
    review/
      review-published/v1.schema.json
    reservation/
      reservation-confirmed/v1.schema.json
  jobs/
  webhooks/
    inbound/
    outbound/
  search/

packages/
  api-contracts/
    generated/
    src/
  event-contracts/
    generated/
    fixtures/
  domain-types/
    src/
```

초기에는 OpenAPI를 여러 root 파일로 지나치게 나누지 않는다. 빌드 시 하나의 완전한 artifact로 bundle하고, 외부 참조가 깨졌는지 CI에서 확인한다.

### 5.1 생성 디렉터리 규칙

- `generated/` 아래 파일은 직접 수정하지 않는다.
- 파일 상단에 generator와 원본 digest를 기록한다.
- 생성 명령은 lockfile과 함께 재현 가능해야 한다.
- 생성 후 git diff가 생기면 CI를 실패시킨다.
- 생성 결과만 수정하는 hotfix를 금지한다.
- 불필요한 generator runtime dependency를 앱 bundle에 넣지 않는다.

---

## 6. 계약 종류

### 6.1 Public API

모바일 앱과 공개 웹이 사용하는 계약이다. 장기 호환성과 개인정보 최소화를 가장 엄격하게 적용한다.

### 6.2 Owner API

점주 조직과 지점 권한을 전제로 한다. 같은 지점이라도 공개 데이터와 미게시 변경안, 예약 연락처, 분석 값이 섞이지 않도록 DTO를 분리한다.

### 6.3 Ops API

운영자 역할, 사유 코드, 사건·감사 식별자가 필요하다. 공개 API와 같은 DTO를 확장 상속하여 내부 필드를 붙이지 않는다. 별도 schema와 더 짧은 보존·캐시 규칙을 사용한다.

### 6.4 Partner API

계약별 허용 field, rate limit, credential scope를 명시한다. 내부 API의 편의를 위해 파트너에 필드를 노출하지 않는다.

### 6.5 Domain event

하나의 aggregate 내부에서 의미 있는 사실이 발생했음을 기록한다. 예: `review.published`, `reservation.confirmed`.

### 6.6 Integration event

다른 모듈 또는 미래의 독립 서비스가 안전하게 소비할 수 있도록 도메인 사실을 최소화·안정화한 표현이다. 내부 entity snapshot 전체를 싣지 않는다.

### 6.7 Job command

이미 일어난 사실이 아니라 실행할 작업이다. 예: `media.generate_variants`, `search.reindex_branch`. 재시도 횟수, deadline, deduplication key를 별도로 갖는다.

### 6.8 Webhook

외부에서 들어오는 payload는 신뢰하지 않는 입력이다. 원본을 제한된 저장소에 보존하고 서명 검증, replay 방지, schema 검증, 도메인 명령 mapping을 순서대로 수행한다.

---

## 7. 공통 primitive

### 7.1 식별자

모든 외부 ID는 불투명 문자열이다.

```yaml
BranchId:
  type: string
  minLength: 1
  maxLength: 64
  example: br_01JABCDE12345
```

규칙:

- 클라이언트는 prefix, 길이, 정렬 순서에서 의미를 추론하지 않는다.
- 정수 auto-increment 값을 외부에 직접 노출하지 않는다.
- 서로 다른 entity ID를 교환하지 않도록 생성 언어에서 branded type을 고려한다.
- ID를 로그에 기록할 수 있는지는 데이터 분류에 따라 별도 결정한다.
- public slug는 ID가 아니며 변경될 수 있다.

### 7.2 instant와 현지 시간

서로 다른 의미를 한 문자열로 표현하지 않는다.

| 개념      | 표현                 | 예                     |
| --------- | -------------------- | ---------------------- |
| 절대 시각 | RFC 3339 UTC instant | `2026-09-02T03:20:15Z` |
| 현지 날짜 | `YYYY-MM-DD`         | `2026-09-02`           |
| 현지 시각 | `HH:mm`              | `18:30`                |
| 시간대    | IANA zone            | `Asia/Seoul`           |
| 기간      | 시작·종료 instant    | 두 개의 명시적 field   |

예약 슬롯에는 날짜, 현지 시각, 시간대, 계산된 instant가 필요할 수 있다. DST가 있는 국가로 확장할 때 단순 offset만 저장하지 않는다.

`createdAt`, `updatedAt`, `publishedAt`은 instant이다. `serviceDate`, `birthDate`는 local date다. 애매한 `date`, `time`, `timestamp` 이름을 피한다.

### 7.3 금액

```json
{
  "amountMinor": 25000,
  "currency": "KRW"
}
```

- 부동소수점 금액을 사용하지 않는다.
- `amountMinor`는 통화의 minor unit 기준 정수다.
- 할인 전/후, 세금 포함 여부, 환불 가능 금액은 별도 field다.
- 가격 미정과 0원은 다르다.
- 통화 없이 숫자만 보내지 않는다.

### 7.4 좌표

```json
{
  "latitude": 37.5665,
  "longitude": 126.978
}
```

- WGS 84 경위도를 기본 wire 표현으로 사용한다.
- latitude 범위는 -90~~90, longitude는 -180~~180이다.
- 배열만 사용할 경우 순서 오류가 잦으므로 외부 API는 이름 있는 object를 우선한다.
- 좌표 정밀도는 데이터 출처와 공개 정책에 맞게 제한한다.
- 사용자 실시간 위치는 음식점 공개 좌표와 다른 개인정보 등급이다.

### 7.5 언어와 locale

- BCP 47 language tag를 사용한다.
- 콘텐츠 원문 언어와 UI locale을 구분한다.
- `ko`, `en`, `ja`, `zh-Hans`, `zh-Hant`처럼 의미 있는 최소 tag를 쓴다.
- 서버가 지원하지 않는 tag를 받으면 협상 규칙에 따라 fallback한다.
- 번역문에는 원문 ID, 번역 상태, 출처가 필요하다.

### 7.6 전화번호와 이메일

- 전화번호는 가능한 경우 정규화된 국제 형식과 표시용 문자열을 분리한다.
- 이메일은 전달·로그 전에 목적과 마스킹 규칙을 확인한다.
- 예약 연락처를 사용자 공개 프로필이나 점주 직원 계정과 같은 DTO에 넣지 않는다.

### 7.7 비율과 점수

- 공개 평점은 1.00~5.00의 decimal 의미를 가진다.
- 리뷰 입력은 1.0~5.0, 0.5 간격이다.
- 내부 confidence, 확률, percentile은 공개 평점과 다른 이름·범위를 쓴다.
- JSON number의 표시 자리수만으로 정밀도를 보장하지 않는다.
- 공개 응답에는 계산 버전과 기준 시각을 함께 제공할 수 있다.

### 7.8 boolean

`false`, `unknown`, `notApplicable`이 구분되어야 하면 boolean을 쓰지 않는다. 상태 enum 또는 nullable field를 사용한다.

---

## 8. 이름과 표현 규칙

### 8.1 JSON field

- `camelCase`
- 단위가 있으면 이름에 명시: `distanceMeters`, `durationSeconds`
- 시간은 의미 있는 suffix 사용: `createdAt`, `serviceDate`
- boolean은 `is`, `has`, `can`을 일관되게 사용
- collection은 복수형
- 축약어는 읽기 쉬운 형태: `imageUrl`, `ipAddress`

### 8.2 resource path

- 복수 명사: `/v1/branches`
- 계층은 실제 소유 관계일 때만 사용
- 필터는 query parameter
- 상태 전이는 필요한 경우 colon action
- URL에 개인정보나 비밀을 넣지 않음

### 8.3 schema 이름

transport 방향과 actor를 드러낸다.

```text
PublicBranchSummary
PublicBranchDetail
OwnerBranchDraft
CreateReviewRequest
ReviewResponse
OpsReviewCaseDetail
```

`Branch`, `User`, `Data`, `Result`처럼 문맥이 없는 거대 schema를 피한다.

### 8.4 operationId

SDK method가 안정되도록 동사와 대상을 명확히 한다.

```text
listBranches
getBranch
createReview
cancelReservation
approveBranchClaim
```

operationId 변경도 SDK 소비자에게는 breaking change로 다룬다.

---

## 9. OpenAPI 작성 규칙

### 9.1 request와 response를 분리한다

생성 요청, 수정 요청, 공개 응답을 같은 schema로 재사용하지 않는다. 서버가 관리하는 `id`, `createdAt`, moderation 상태를 쓰기 요청에 허용하지 않는다.

### 9.2 optional과 nullable을 구분한다

- optional: field가 존재하지 않을 수 있음
- nullable: field가 존재하면서 `null`일 수 있음
- PATCH에서 누락은 변경 없음, `null`은 명시적 제거일 수 있음

각 PATCH field의 `null` 의미를 설명하지 못하면 nullable로 만들지 않는다.

### 9.3 object 닫기

내부 검증용 schema는 알 수 없는 property를 기본 거부하는 쪽을 검토한다. 공개 response 소비자는 추가 field를 무시할 수 있어야 한다. 서버 strictness와 클라이언트 forward compatibility를 혼동하지 않는다.

### 9.4 예시

- 모든 주요 성공 응답과 오류에 유효한 example을 둔다.
- example은 schema validator를 통과해야 한다.
- 실제 전화번호, 이메일, 토큰, 사업자번호를 넣지 않는다.
- Unicode, 긴 상호명, 메뉴 가격 없음, 다국어 등 경계 사례를 포함한다.
- example이 정책을 오해하게 만들지 검토한다.

### 9.5 description

field 이름을 반복하지 않고 의미, 단위, 권한, 안정성을 설명한다. 구현 상세나 일시적 table 이름을 적지 않는다.

### 9.6 readOnly와 writeOnly

문서 표시에는 사용할 수 있지만 이것만으로 보안 경계를 강제하지 않는다. 서버는 actor별 allowlist DTO를 사용한다.

### 9.7 discriminator와 union

명확한 tag가 있는 제한된 polymorphism에만 사용한다. 서로 다른 actor 응답을 거대한 union으로 묶지 않는다. 생성기별 결과를 반드시 검증한다.

---

## 10. HTTP 공통 계약

### 10.1 성공 envelope

단일 resource는 불필요한 공통 `data` envelope를 강제하지 않는다. 목록은 item과 pagination 정보를 일관되게 제공한다.

```json
{
  "items": [],
  "nextCursor": null
}
```

### 10.2 오류

RFC 9457 Problem Details를 기반으로 도락의 안정된 `code`와 추적 ID를 추가한다.

```json
{
  "type": "https://errors.dorak.app/reservation-slot-unavailable",
  "title": "예약 가능한 좌석이 없습니다",
  "status": 409,
  "code": "RESERVATION_SLOT_UNAVAILABLE",
  "traceId": "tr_01JABCDE12345",
  "detail": "선택한 시간의 재고가 변경되었습니다"
}
```

규칙:

- 클라이언트 분기는 번역된 `title`이나 `detail`이 아니라 `code`를 사용한다.
- 존재를 숨겨야 하는 권한 오류는 404를 사용할 수 있다.
- 내부 예외명, SQL, stack trace, 공급자 원문을 노출하지 않는다.
- field validation 오류는 제한된 path와 code 목록으로 제공한다.
- 재시도 가능 여부는 상태 코드, `Retry-After`, 문서로 명확히 한다.

### 10.3 페이지네이션

- 변경이 잦은 목록은 opaque cursor를 기본으로 한다.
- cursor 내용은 계약이 아니며 클라이언트가 해석하지 않는다.
- 정렬 key와 tie-breaker를 안정적으로 정한다.
- 허용 `limit` 범위와 기본값을 schema에 둔다.
- 전체 개수가 비싸거나 오해를 만들면 제공하지 않는다.
- cursor에는 개인정보를 평문으로 담지 않는다.

### 10.4 멱등성

예약 생성, 결제 시도, 리뷰 게시처럼 재시도 가능한 중요한 `POST`는 `Idempotency-Key`를 지원한다.

- key scope: actor + operation + endpoint
- 같은 key와 다른 request digest는 409
- 진행 중 재시도는 동일 작업 상태 또는 명시적 충돌
- 성공 결과는 정책 기간 동안 재현
- 보존 기간은 endpoint 문서에 명시
- key 자체에 개인정보를 넣지 않음

### 10.5 낙관적 동시성

점주 정보 수정, 운영자 결정처럼 lost update 위험이 있는 작업은 `ETag`/`If-Match` 또는 `resourceVersion`을 사용한다. 둘을 섞을 때 우선순위를 명확히 한다.

### 10.6 캐시

- 공개 branch 상세은 `ETag`와 명시적 `Cache-Control`을 사용할 수 있다.
- 사용자별 저장 여부, 권한, 예약 연락처 응답은 public cache 금지다.
- `Vary` 차원을 최소화한다.
- 삭제·블라인드·권리 침해 조치는 CDN purge와 연결한다.

---

## 11. 열거형과 상태

### 11.1 canonical 상태 원본

상태의 의미와 전이 원본은 해당 도메인 문서다. schema는 허용 wire 값을 복제하므로 CI 또는 계약 검토에서 정합성을 확인한다.

예약 공개 상태:

```text
requested
confirmed
change_proposed
cancellation_pending
cancelled
rejected
expired
seated
completed
no_show
```

점주 claim 공개 상태:

```text
draft
pending
approved
rejected
revoked
disputed
withdrawn
```

### 11.2 enum 추가도 잠재적 breaking이다

schema 관점에서 값 추가는 확장일 수 있지만 exhaustive switch를 쓰는 생성 클라이언트에는 breaking일 수 있다.

- 모바일은 알 수 없는 값을 fallback UI로 처리한다.
- 비즈니스상 안전한 fallback이 없으면 새 API 버전 또는 capability 협상을 사용한다.
- enum 이름을 재사용하면서 의미를 바꾸지 않는다.
- 삭제된 상태도 과거 이벤트 해석 때문에 registry에 남길 수 있다.

### 11.3 내부 상태 노출 금지

사기 탐지 score, moderation 내부 단계, 공급자 오류 상태를 공개 enum에 섞지 않는다. 공개 상태로 mapping하고 필요한 경우 사용자 행동을 별도 field로 제공한다.

---

## 12. 이벤트 계약

### 12.1 공통 envelope

```json
{
  "eventId": "evt_01JABCDE12345",
  "eventType": "reservation.confirmed",
  "schemaVersion": 1,
  "aggregateType": "reservation",
  "aggregateId": "rsv_01JABCDE12345",
  "aggregateVersion": 4,
  "occurredAt": "2026-09-02T03:20:15Z",
  "publishedAt": "2026-09-02T03:20:16Z",
  "producer": "reservations",
  "traceId": "tr_01JABCDE12345",
  "correlationId": "cor_01JABCDE12345",
  "causationId": "cmd_01JABCDE12345",
  "data": {}
}
```

### 12.2 field 의미

| field              | 의미                                       |
| ------------------ | ------------------------------------------ |
| `eventId`          | delivery가 반복되어도 동일한 이벤트 식별자 |
| `eventType`        | 과거형 도메인 사실                         |
| `schemaVersion`    | payload의 major schema 버전                |
| `aggregateVersion` | aggregate 내 순서·중복 판단 보조           |
| `occurredAt`       | 트랜잭션에서 사실이 발생한 시각            |
| `publishedAt`      | outbox에서 전달된 시각                     |
| `traceId`          | 관측 추적 식별자                           |
| `correlationId`    | 하나의 사용자·업무 흐름 묶음               |
| `causationId`      | 직접 원인이 된 command/event               |

### 12.3 이름

이벤트는 이미 일어난 사실을 과거형으로 표현한다. 안정된 wire name은 `domain.lower_snake_case_fact` 형식이며 코드의 `BranchPublicationChanged` 같은 클래스명과 분리한다.

```text
branch.created
branch.publication_changed
review.published
review.withdrawn
reservation.requested
reservation.confirmed
reservation.cancelled
media.asset_approved
```

`update`, `process`, `sync`처럼 의미가 모호한 이름은 job command에만 제한적으로 사용한다.

### 12.4 payload 최소화

이벤트에 aggregate 전체 snapshot을 넣지 않는다. 소비자가 판단하는 데 필요한 안정된 사실과 식별자를 포함한다.

예를 들어 검색 색인 소비자는 branch 전체를 이벤트에 요구하기보다 `branchId`, 바뀐 영역, 새 version을 받고 source of truth에서 읽기 모델을 재구성할 수 있다. 다만 과도한 callback read가 병목이면 개인정보를 제외한 integration snapshot을 별도 설계한다.

### 12.5 전달 의미

초기 outbox 전달은 at-least-once를 전제로 한다.

- 소비자는 `eventId`로 멱등 처리한다.
- 중복 delivery는 정상이다.
- aggregate 간 전역 순서를 가정하지 않는다.
- 같은 aggregate는 `aggregateVersion` 역전과 gap을 탐지한다.
- 처리 결과와 deduplication 기록의 원자성을 고려한다.
- poison event는 무한 재시도하지 않고 격리한다.

### 12.6 event와 command 구분

| 항목   | Event                | Command/Job                |
| ------ | -------------------- | -------------------------- |
| 의미   | 발생한 사실          | 실행 요청                  |
| 이름   | 과거형               | 명령형                     |
| 실패   | 사실을 취소하지 않음 | 재시도·실패 가능           |
| 소비자 | 0개 이상             | 명확한 handler             |
| 변경   | immutable            | 상태·attempt metadata 가능 |

### 12.7 삭제와 정정

과거 이벤트를 물리적으로 고쳐서 의미를 바꾸지 않는다. 정정 또는 삭제 사실을 새 이벤트로 발행한다.

- `review.withdrawn`
- `media.asset_deleted`
- `branch.merged`
- `user.personal_data_erasure_requested`

개인정보 삭제 이벤트는 원문 개인정보를 포함하지 않고 내부 subject reference와 수행 범위를 사용한다. 법적 보존 의무가 있는 데이터는 별도 정책으로 처리한다.

### 12.8 replay

- schema version별 fixture를 영구 보관한다.
- 재생은 외부 알림, 결제, 문자 같은 side effect를 기본 비활성화한다.
- replay origin과 run ID를 기록한다.
- production replay는 범위, 예상량, 중단 조건, 검증 query 승인이 필요하다.

---

## 13. 이벤트 버전 호환성

### 13.1 같은 major에서 허용 가능

- 의미가 독립적인 optional field 추가
- 기존 field 설명 명료화
- validator를 넓히는 제약 변경
- 소비자가 무시할 수 있는 metadata 추가

### 13.2 같은 major에서 금지

- required field 추가
- field 제거 또는 rename
- 타입 변경
- 단위 변경
- nullable 의미 변경
- enum 값 제거 또는 의미 변경
- 같은 이름으로 발생 시점의 의미 변경
- 식별자가 가리키는 entity 변경

### 13.3 major 변경

새 major는 별도 schema 경로와 `schemaVersion`을 사용한다. producer는 migration 기간에 필요한 경우 dual publish하고, 소비자별 전환 상태를 추적한다.

```text
schemas/events/review/review-published/v1.schema.json
schemas/events/review/review-published/v2.schema.json
```

dual publish는 동일 사실을 두 번 처리하는 위험이 있으므로 두 버전에 논리적 event identity를 연결하고 소비자 migration 계획을 명시한다.

---

## 14. REST 호환성 판정

### 14.1 일반적으로 호환 가능

- response optional field 추가
- 새 endpoint 추가
- optional query parameter 추가
- 문서·example 보완
- 기존 범위 안에서 constraint 완화

### 14.2 잠재적 breaking

- enum 값 추가
- 배열 정렬 기준 변경
- pagination cursor 무효화
- rate limit 대폭 축소
- 기존 cache 의미 변경
- 이전에 항상 있던 optional field를 실제로 누락하기 시작
- 오류 code 추가로 클라이언트 흐름이 달라짐

### 14.3 명백한 breaking

- field 삭제·rename·타입 변경
- required request field 추가
- response field를 nullable로 변경
- 상태 코드의 의미 변경
- ID 의미·단위 변경
- 인증 scope 강화로 기존 사용 차단
- 공개 데이터였던 field의 비공개 전환

보안·법률상 즉시 제거가 필요하면 호환성보다 보호를 우선할 수 있다. 이 경우 incident 절차, 소비자 공지, 기능 저하 UX, 후속 버전 계획을 함께 실행한다.

---

## 15. 데이터베이스와 API mapping

### 15.1 자동 직렬화 금지

ORM row를 그대로 JSON으로 반환하지 않는다. adapter가 명시적으로 mapping한다.

```text
DB row
  → repository model
  → domain/read model
  → actor-specific response DTO
```

이 경계에서 다음을 통제한다.

- 내부 surrogate key 제거
- encrypted field 복호화 범위
- 공개/점주/운영 field allowlist
- deleted/merged 상태 표현
- timezone과 money 변환
- 공급자 상태의 canonical mapping

### 15.2 transaction schema와 read schema

검색 결과나 지점 상세은 여러 table과 파생 값을 조합할 수 있다. API schema가 database normalization을 따라갈 필요는 없다. 반대로 화면 요구 때문에 원장 table을 비정규화하지 않는다.

### 15.3 migration 순서

호환 가능한 DB/API 변경은 expand-migrate-contract 순서를 따른다.

1. 새 nullable column 또는 table 추가
2. 구·신 구조를 읽을 수 있는 코드 배포
3. 필요한 dual write 또는 backfill
4. 검증과 지표 안정화
5. API/event 소비자 전환
6. 구 field 쓰기 중단
7. 충분한 보존 기간 후 제거

DB migration과 API major 변경을 같은 배포 한 번에 묶지 않는다.

---

## 16. 검색 document 계약

OpenSearch document는 PostgreSQL 원장의 파생 모델이며 외부 API 원본이 아니다.

- index schema version을 기록한다.
- document에 source entity version과 indexedAt을 둔다.
- 공개 불가·삭제된 field를 색인하지 않는다.
- 사용자 PII를 검색 편의를 위해 넣지 않는다.
- analyzer 변경은 새 index 생성과 alias 전환으로 처리한다.
- search response는 document를 그대로 반환하지 않고 public DTO로 mapping한다.
- 재색인과 실시간 event 적용이 경합할 때 최신 source version을 보존한다.

예시 metadata:

```json
{
  "documentSchemaVersion": 1,
  "branchId": "br_01JABCDE12345",
  "sourceVersion": 18,
  "indexedAt": "2026-09-02T03:20:16Z"
}
```

---

## 17. 웹훅 계약

### 17.1 수신 순서

1. body 크기와 content type 제한
2. 원시 body 기준 서명 검증
3. timestamp 허용 오차와 replay 검사
4. delivery ID 중복 검사
5. JSON/schema 검증
6. 공급자 ID를 내부 reference로 mapping
7. 도메인 명령 실행
8. 수신·처리 결과 감사 기록

서명 검증 전에 JSON을 다시 직렬화하면 서명이 달라질 수 있으므로 raw bytes를 보존한다.

### 17.2 공급자 payload 격리

- 공급자 schema를 내부 도메인 이벤트로 재사용하지 않는다.
- 알 수 없는 field는 보관 정책에 따라 허용할 수 있지만 로그에 전체 body를 남기지 않는다.
- 공급자 status를 canonical 상태로 mapping한다.
- 공급자가 의미를 바꾸면 adapter 버전을 올린다.
- 민감 원문은 암호화·접근 제한·짧은 보존을 적용한다.

### 17.3 발신 웹훅

- signing algorithm과 header를 버전 관리한다.
- delivery ID, event ID, timestamp를 보낸다.
- exponential backoff와 최대 기간을 문서화한다.
- endpoint별 secret rotation을 지원한다.
- partner가 검증할 수 있는 example과 test event를 제공한다.
- SSRF 방지, URL 검증, egress 제한을 적용한다.

---

## 18. 개인정보·보안 metadata

schema field에 도락 전용 확장을 붙여 자동 검사에 활용할 수 있다.

```yaml
email:
  type: string
  format: email
  x-dorak-data-classification: personal
  x-dorak-purpose: reservation-contact
  x-dorak-log-policy: redact
  x-dorak-retention-policy: reservation-contact-v1
```

초기 분류 값:

```text
public
internal
personal
sensitive-personal
credential
payment-adjacent
```

규칙:

- 확장이 실제 enforcement를 대신하지 않는다.
- `credential`은 response와 일반 event에 존재하면 CI 실패 대상으로 한다.
- `personal` 이상은 목적과 로그 정책을 요구한다.
- 공개 OpenAPI artifact에서 내부 보안 설명이 공격 정보를 과도하게 노출하지 않게 한다.
- analytics event는 API schema를 복사하지 않고 허용 field 목록을 별도로 가진다.
- 운영 API의 개인정보 field는 최소 역할과 사유 기록을 요구한다.

### 18.1 로그 안전성

- request/response body 전체 로깅을 기본 금지한다.
- allowlist된 ID, status, latency, code만 구조화 로그에 남긴다.
- URL query에 개인정보를 받지 않는다.
- validation error는 값이 아니라 field path와 rule을 기록한다.
- 웹훅 원문과 인증 header는 일반 observability pipeline으로 보내지 않는다.

---

## 19. 코드 생성 경계

### 19.1 TypeScript

생성 대상:

- API request/response transport type
- typed client method
- event payload type
- fixture validator adapter

수동 대상:

- domain entity
- state machine
- money/date value object
- error mapping
- React query key와 화면 view model

생성 client는 모바일과 웹에 동일 패키지로 제공하되 runtime 환경별 fetch adapter, 인증, retry는 얇은 수동 wrapper로 둔다.

### 19.2 Python

평점 워커는 필요한 event/input schema만 생성한다. TypeScript의 내부 타입을 번역해 복사하지 않는다.

- JSON Schema에서 Python validation model 생성 또는 검증 adapter 사용
- decimal과 datetime 변환 test 필수
- 알 수 없는 enum과 추가 field 처리 정책 명시
- training feature와 production event input을 구분
- generated model을 모델 계산 로직에 직접 퍼뜨리지 않고 adapter에서 내부 type으로 변환

### 19.3 생성기 교체

생성기 교체는 내부 구현 변경처럼 보여도 public method 이름, optional/null type, enum 처리에 영향을 준다.

1. golden SDK diff 생성
2. 모바일·웹·서버 compile
3. 대표 fixture serialization 비교
4. bundle size와 runtime dependency 비교
5. migration note 작성
6. 생성 artifact 원본 digest 갱신

---

## 20. Validation 경계

동일 schema를 여러 번 검증하는 비용과 서로 다른 validator가 다른 결과를 내는 위험을 균형 있게 다룬다.

### 20.1 외부 요청

- gateway 또는 API adapter에서 구조·크기 검증
- 애플리케이션 계층에서 권한·상태·도메인 규칙 검증
- DB constraint에서 최종 불변식 보호

schema validation 통과는 예약 가능, 리뷰 게시 가능, 점주 권한 보유를 뜻하지 않는다.

### 20.2 내부 이벤트

- producer test에서 schema 검증
- outbox publish 전에 envelope 검증
- consumer ingress에서 최소한 version·필수 field 검증
- 신뢰 경계가 강한 내부 hot path는 성능 측정 뒤 일부 최적화 가능
- dead letter에는 validation 실패 이유와 schema identity를 기록

### 20.3 response

개발·테스트에서는 주요 response validation을 강제한다. production 전수 validation은 성능과 데이터 노출 위험을 측정하고 sampling 또는 canary로 운영할 수 있다.

---

## 21. 계약 변경 절차

### 21.1 제안

변경 PR은 다음을 포함한다.

- 사용자 또는 운영 목적
- 영향 endpoint/event/schema
- 호환성 판정
- 개인정보·권한 영향
- example과 fixture
- producer/consumer owner
- 배포·롤백 순서
- 제거 예정일이 있는 deprecation 계획

### 21.2 검토자

| 변경           | 필수 검토                            |
| -------------- | ------------------------------------ |
| 공개 API       | API owner + 모바일/웹 소비자         |
| 점주 API       | API owner + Owner Platform           |
| 운영 API       | API owner + Operations + Security    |
| 개인정보 field | Privacy/Security owner               |
| 예약·결제      | Reservations + Finance/Legal 필요 시 |
| event          | producer + 모든 등록 consumer        |
| 검색 document  | Search + source domain owner         |

### 21.3 배포

1. 호환 가능한 producer/schema 배포
2. consumer 지원 버전 확인
3. 관측 지표와 canary 확인
4. 새 field 또는 동작 feature flag 활성화
5. deprecation 공지·usage 측정
6. 제거 조건 충족 후 별도 변경

### 21.4 긴급 변경

보안·법률 사고로 field를 즉시 차단해야 하면 정상 deprecation을 생략할 수 있다. 대신 incident ID, 차단 시각, 영향 소비자, 임시 응답, 복구 또는 새 버전 계획을 남긴다.

---

## 22. CI gate

### 22.1 모든 계약 PR

- YAML/JSON 구문 검사
- OpenAPI 3.1.2 validation
- JSON Schema Draft 2020-12 validation
- `$ref` 해석과 bundle 성공
- naming·description lint
- 모든 example의 schema validation
- operationId 중복 검사
- 공개 schema의 금지 field·분류 검사
- 이전 main artifact와 breaking diff
- 생성 코드 재생성 후 clean diff
- TypeScript/Python compile 또는 import smoke test
- 상대 링크 검사

### 22.2 event PR

- envelope 규칙 검사
- eventType과 디렉터리 이름 일치
- schemaVersion과 경로 일치
- 과거 fixture가 계속 유효한지 확인
- 등록 consumer contract test
- PII 분류와 log policy 검사
- 중복·역순·재전달 test

### 22.3 DB와 함께 바뀌는 PR

- 이전 app + 새 DB 호환
- 새 app + 이전/확장 DB 호환
- migration rollback 또는 forward-fix 계획
- backfill dry run
- API fixture regression
- 검색 재색인 영향

### 22.4 merge 차단

다음은 warning이 아니라 merge failure다.

- 설명 없는 breaking change
- 실제 비밀 또는 개인 fixture
- 생성 artifact drift
- resolve되지 않는 `$ref`
- required field가 example에 없음
- credential field의 공개 response 노출
- event version을 올리지 않은 breaking payload 변경
- owner 없는 public endpoint/event

---

## 23. 계약 테스트

### 23.1 producer test

서버 handler가 OpenAPI에 맞는 status, header, body를 반환하는지 검증한다. 문서에 없는 field 유출도 탐지한다.

### 23.2 consumer test

모바일·웹의 핵심 사용 흐름을 fixture에 대해 실행한다.

- 알 수 없는 response field
- 알 수 없는 enum fallback
- optional field 누락
- nullable field
- 409/412/429 오류
- cursor 종료
- 오래된 앱 버전

### 23.3 event test

- 동일 event 두 번 전달
- 뒤늦은 이전 version 전달
- aggregate version gap
- optional field가 없는 과거 fixture
- 모르는 optional field
- 지원하지 않는 major
- handler 실패 후 재전달

### 23.4 golden fixture

fixture는 임의 샘플이 아니라 보존할 호환성 자산이다.

```text
fixtures/
  public-api/
    v1/
  events/
    reservation.confirmed/
      v1-minimal.json
      v1-full.json
  webhooks/
    provider-name/
```

fixture 수정으로 테스트를 쉽게 통과시키지 않는다. 의미 변경이면 새 fixture를 추가하고 기존 fixture가 왜 더 이상 유효하지 않은지 버전 결정으로 남긴다.

---

## 24. 운영과 관측

### 24.1 지표

- endpoint별 schema validation failure 비율
- response drift 탐지 수
- 알 수 없는 enum fallback 수
- client app version별 오류율
- event schema version별 publish/consume 수
- unsupported event version 수
- dead-letter와 replay 수
- webhook signature/schema failure 수
- deprecation 대상 field/endpoint 사용량
- code generation drift 실패 수

### 24.2 계약 registry

초기에는 repository가 registry다. 각 schema에 다음 metadata가 있어야 한다.

- owner
- 상태: draft, active, deprecated, retired
- 최초 배포일
- 최근 변경일
- 지원 producer/consumer
- 데이터 분류
- 보존 또는 replay 요구
- 대체 schema

서비스와 팀이 늘어나면 registry UI나 catalog 도입을 검토하되 저장소 원본과 충돌하지 않게 한다.

### 24.3 drift 대응

1. 실제 요청/응답 또는 event sample을 안전하게 redaction
2. schema와 비교해 차이 분류
3. producer bug, schema 누락, 불법 소비자 중 원인 결정
4. public 영향과 개인정보 노출 확인
5. 호환 가능한 복구 배포
6. fixture와 회귀 test 추가

---

## 25. 초기 수직 슬라이스 계약 순서

### 25.1 Foundation

1. `PublicBranchSummary`
2. `PublicBranchDetail`
3. 지점 검색 request/response
4. 운영 지점 후보·병합·수정 DTO
5. `branch.created`, `branch.updated`, `branch.publication_changed`
6. 검색 document v1

완료 조건:

- DB 지점 한 건이 운영 검수 후 공개 상세과 검색 인덱스에 동일 ID로 나타난다.
- 비공개 source와 내부 검수 field가 공개 응답에 없다.
- 지점 변경 이벤트 재전달이 색인 중복을 만들지 않는다.

### 25.2 Identity

1. 세션·refresh transport
2. 공개 프로필과 계정 설정 DTO 분리
3. 인증 오류 code
4. 보안 이벤트 최소 계약

완료 조건:

- 예약 연락처와 로그인 identity가 공개 프로필에 섞이지 않는다.
- credential이 OpenAPI example, event, log에 존재하지 않는다.

### 25.3 Trust

1. 리뷰 작성·수정·게시 request/response
2. media 업로드 세션
3. 방문 증빙 상태의 공개/내부 DTO
4. `review.published`, `review.withdrawn`
5. 평점 게시 snapshot response

완료 조건:

- 리뷰 공개 여부와 평점 반영 적격성을 별도 field/contract로 표현한다.
- 비공개 방문 증빙이 공개 media 계약에 포함되지 않는다.

### 25.4 Transaction

1. 예약 가능 시간 조회
2. 예약 생성 멱등 계약
3. 상태 전이 명령
4. 소비자·점주 예약 DTO 분리
5. 공급자 webhook adapter schema
6. 예약 event family

완료 조건:

- timeout 후 같은 idempotency key 재시도가 예약을 두 개 만들지 않는다.
- 상태 전이가 canonical state machine과 일치한다.
- 예약 연락처가 event와 일반 로그에 불필요하게 복제되지 않는다.

---

## 26. 첫 구현 backlog

### P0: 저장소 뼈대

- `openapi/dorak-v1.yaml` 생성
- common ID, time, money, geo schema
- Problem Details와 validation error 정의
- contract lint/validate/bundle 명령
- generated code 디렉터리와 직접 수정 금지 검사
- 최소 TypeScript SDK 생성 spike

### P0: 지점 조회

- branch summary/detail schema
- `/v1/branches/{branchId}`
- `/v1/branches` 검색 계약
- 공개 field allowlist
- 정상·폐업·임시휴업 example
- ETag와 cache contract

### P1: 이벤트

- event envelope schema
- `branch.created`와 `branch.updated` v1
- outbox serializer
- consumer idempotency test harness
- schema version별 fixture

### P1: 검증 자동화

- main 대비 breaking-change 검사
- example validator
- secret/PII fixture 검사
- SDK clean-generation 검사
- docs link 검사

### P2: 다중 언어·파트너

- localized text schema
- partner scope와 rate-limit 응답
- outbound webhook signing 계약
- AsyncAPI 도입 필요성 재평가

---

## 27. 금지 패턴

- DB table 하나를 그대로 공개 CRUD로 노출
- request와 response에 같은 mutable schema 사용
- `any`, 자유 형식 object로 계약 검증 회피
- 날짜·금액·좌표 단위를 description 없이 number/string으로 표현
- 생성 코드를 직접 수정
- event payload에 사용자·지점 aggregate 전체 snapshot 삽입
- 이벤트 이름 의미를 유지한 채 payload 뜻 변경
- retry 가능한 consumer가 side effect를 멱등 처리하지 않음
- 실제 운영 payload를 redaction 없이 fixture로 저장
- 공개 API와 운영 API를 상속으로 합침
- 공급자 webhook 상태를 canonical 예약 상태로 직접 사용
- SDK compile만 통과하면 호환된다고 판단
- 문서에 없는 field를 편의상 응답

---

## 28. 계약 검토 체크리스트

### 의미

- [ ] 이 계약이 표현하는 사용자·운영 행동이 명확한가?
- [ ] domain source 문서와 용어가 같은가?
- [ ] 이름이 구현이 아니라 제품 의미를 드러내는가?
- [ ] 공개 상태와 내부 상태가 분리됐는가?
- [ ] unknown·missing·null의 차이가 정의됐는가?

### 호환성

- [ ] 기존 소비자가 추가 field와 enum을 안전하게 처리하는가?
- [ ] 정렬·페이지네이션·캐시 의미가 바뀌지 않는가?
- [ ] operationId와 오류 code가 안정적인가?
- [ ] event major version이 적절한가?
- [ ] deprecation usage를 측정할 수 있는가?

### 데이터

- [ ] 금액, 시간, 위치 단위가 명시됐는가?
- [ ] DB row 또는 공급자 payload가 직접 노출되지 않는가?
- [ ] source version과 파생 모델 version을 추적할 수 있는가?
- [ ] 삭제·병합·정정이 표현되는가?

### 보안·개인정보

- [ ] actor별 field allowlist인가?
- [ ] 개인정보 목적·로그·보존 metadata가 있는가?
- [ ] URL, error, example에 민감 값이 없는가?
- [ ] 권한 실패가 resource 존재를 누설하지 않는가?
- [ ] webhook 서명과 replay 방지가 정의됐는가?

### 운영

- [ ] owner와 consumer가 등록됐는가?
- [ ] 지표, alert, rollback이 있는가?
- [ ] 중복·역순·오래된 client를 테스트했는가?
- [ ] fixture와 생성 artifact가 재현 가능한가?
- [ ] schema drift를 배포 전 탐지하는가?

---

## 29. 미해결 결정

| 항목                   | 초기 방향                       | 결정 시점                    |
| ---------------------- | ------------------------------- | ---------------------------- |
| OpenAPI generator      | TypeScript 후보 비교 후 pin     | 저장소 scaffold              |
| runtime validator      | JSON Schema 2020-12 지원 검증   | 첫 endpoint                  |
| OpenAPI 단일/다중 root | public과 ops 분리 가능성 검증   | ops slice 전                 |
| AsyncAPI               | 초기 미도입                     | 독립 broker/consumer 증가 시 |
| schema registry 제품   | Git repository                  | 다팀 운영 병목 발생 시       |
| event payload 방식     | 최소 사실 + 필요 시 source read | branch indexing 부하 검증 후 |
| SDK 배포               | monorepo workspace package      | 외부 partner SDK 요구 시     |
| public API 3.2 전환    | 도구 matrix 검증 후 ADR         | 첫 public beta 전 재검토     |

미해결 항목이 있다는 이유로 primitive와 호환성 규칙까지 미루지 않는다.

---

## 30. 완료 정의

계약 기반이 준비됐다고 판단하려면 다음을 모두 만족해야 한다.

- OpenAPI 3.1.2 root를 단일 명령으로 validate·bundle할 수 있다.
- 모든 주요 example이 schema를 통과한다.
- TypeScript SDK를 깨끗한 환경에서 재생성할 수 있다.
- public branch 조회의 서버 응답이 계약 테스트를 통과한다.
- event envelope와 branch event v1 fixture가 있다.
- 같은 event 재전달로 검색 문서가 중복·역전되지 않는다.
- 개인정보 분류가 없는 민감 field를 CI가 탐지한다.
- main 대비 breaking change가 자동 차단된다.
- 실제 배포 artifact에서 OpenAPI와 source commit을 추적할 수 있다.
- 문서, schema, 코드 owner가 정해져 있다.

---

## 31. 공식 기준 자료

- [OpenAPI Specification 3.1.2](https://spec.openapis.org/oas/v3.1.2.html)
- [OpenAPI Specification 최신판](https://spec.openapis.org/oas/latest.html)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
- [AsyncAPI Specification 3.0.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [RFC 3339: Date and Time on the Internet](https://www.rfc-editor.org/rfc/rfc3339)
- [RFC 5646: Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646)

규격 링크는 구현 시점에도 다시 확인한다. `latest`를 빌드 원본으로 사용하지 않고 검증된 minor 버전을 명시적으로 고정한다.
