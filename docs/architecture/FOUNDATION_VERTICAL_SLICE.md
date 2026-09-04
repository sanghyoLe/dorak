# 도락 Foundation 수직 슬라이스 구현 명세

> 실행 우선순위 안내: 이 문서의 데이터 무결성과 검수 흐름은 유지한다. 2026-09-03부터 OpenSearch document/indexer 항목은 PostgreSQL FTS·`pg_trgm` 검색 read model로 구현하고, 별도 worker는 저빈도 명령 또는 GitHub Actions로 대체한다. 기준은 [비용 우선 운영안](./COST_FIRST_ARCHITECTURE.md)이다.

> 상태: 실행 초안 v0.1  
> 기준일: 2026-09-02  
> 슬라이스 코드: `FND-01`  
> 목표: 허가된 원천 레코드 1건을 수집해 운영 검수 후 공개 지점 상세·검색에 반영  
> 연관 문서: [ROADMAP.md](../product/ROADMAP.md), [DATA_INGESTION.md](./DATA_INGESTION.md), [DATABASE_SCHEMA_BLUEPRINT.md](./DATABASE_SCHEMA_BLUEPRINT.md), [CONTRACTS_AND_SCHEMAS.md](./CONTRACTS_AND_SCHEMAS.md), [API_DESIGN.md](./API_DESIGN.md), [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md), [OPERATIONS.md](../operations/OPERATIONS.md)

---

## 1. 목적

도락의 첫 통합 결과는 예쁜 홈 화면이 아니다. 다음 한 문장을 실제 시스템에서 증명하는 것이다.

> 이용 조건이 확인된 음식점 원천 한 건이 원본 그대로 보존되고, 정규화·중복 후보 판정·사람 검수를 거쳐 하나의 도락 지점으로 공개되며, API와 검색 결과가 같은 지점 ID와 version을 보여준다.

이 슬라이스는 데이터, API, 운영, 검색, 보안, 관측성의 최소 세로 흐름을 동시에 만든다. 각 계층의 완성도를 따로 높이기 전에 경계와 실패 복구가 실제로 연결되는지 검증한다.

---

## 2. 성공 결과

내부 demo에서 다음을 순서대로 수행할 수 있어야 한다.

1. 승인된 synthetic 또는 허가된 실제 source snapshot을 등록한다.
2. 같은 파일을 두 번 제출해도 raw record와 candidate가 중복 생성되지 않는다.
3. 원문 상호·주소·업종·상태가 변형 없이 추적된다.
4. normalized observation과 기존 branch 후보를 확인한다.
5. 운영자가 신규 지점 생성, 기존 지점 연결, 보류, 거절 중 하나를 결정한다.
6. 신규 지점 승인 transaction이 branch, assertion, change history, audit, outbox를 함께 기록한다.
7. 같은 PostgreSQL 안의 공개 검색 projection이 canonical branch version을 반영한다.
8. `GET /v1/branches/{branchId}`와 검색이 동일 `branchId`, `sourceVersion`을 사용한다.
9. 같은 job 또는 event를 재처리해도 중복 document나 version 역전이 생기지 않는다.
10. 지점 공개를 철회하면 공개 API와 검색에서 정책에 맞게 사라지고 직접 운영 조회에는 이력이 남는다.

---

## 3. 범위

### 3.1 포함

- monorepo와 로컬 의존 서비스 최소 골격
- PostgreSQL 18 + PostGIS migration harness
- 허가된 CSV/JSON source adapter 하나
- source snapshot, raw record, normalization
- restaurant·branch·location·category 최소 schema
- 신규 지점 candidate 생성과 운영 검수
- field assertion과 provenance
- transactional outbox
- 공개 branch detail API
- 최소 branch search API와 PostgreSQL FTS·`pg_trgm` 검색 projection
- 운영 queue API와 단순 내부 화면
- 감사, 지표, 실패 재처리
- 계약·통합·E2E test

### 3.2 제외

- 소비자 계정·로그인
- 리뷰·평점·랭킹
- 저장·팔로우·추천
- 점주 claim
- 메뉴·사진의 완전한 편집 기능
- 예약·결제·알림
- 전국 공개 수집
- 상용 지도 SDK 최종 선택
- ML 기반 entity resolution
- 실제 production 트래픽과 앱스토어 배포

제외 범위의 가짜 성공 데이터를 public contract에 넣지 않는다. 예를 들어 점수 미구현이면 `score: 0`이 아니라 field를 생략하거나 명시된 availability 상태로 표현한다.

---

## 4. 외부 전제와 차단 조건

### 4.1 실제 원천 사용 전

- 이용약관·라이선스·재배포 범위 확인
- source owner와 내부 승인자 기록
- 허용 수집 방식, 주기, rate limit 확인
- 개인정보·민감 field allowlist 확정
- 원본·파생 데이터 보존 및 삭제 조건 확정
- source kill switch와 연락 경로 등록

확정 전에는 synthetic fixture 또는 별도로 승인된 소량 샘플만 사용한다.

### 4.2 production-like 환경 전

- 개발·staging 계정/비밀 분리
- 운영자 인증 임시 방식의 만료일과 owner
- 실제 전화·대표자·인허가 번호 로그 차단
- 외부 문자·결제·웹훅 미연결 확인
- object storage와 database backup 정책

### 4.3 Go 차단

다음 중 하나라도 있으면 공개 사용자에게 노출하지 않는다.

- 데이터 재배포 권리가 불명확함
- 내부 UUID·인허가 원문·운영 메모가 public API에 노출됨
- 원천 재실행이 branch를 중복 생성함
- 운영 승인 없이 자동 publication 가능
- publication 철회가 검색에 전파되지 않음
- audit 또는 source lineage가 끊김
- 검색 document가 source of truth보다 오래된 version으로 역전됨

---

## 5. 사용자와 역할

### 5.1 Data operator

- source run 상태 확인
- quarantine 원인 확인
- normalization 결과와 원문 비교
- 신규·중복 candidate 처리
- publication 결정
- 안전한 재처리 실행

### 5.2 Data engineer

- adapter와 schema mapping 관리
- drift·실패 분석
- backfill·replay 수행
- 품질 지표와 source health 운영

### 5.3 API/Search engineer

- public read model과 계약 유지
- outbox consumer와 index version 보호
- API·검색 정합성 대조

### 5.4 Reviewer/Auditor

- 운영 결정과 근거 표본 감사
- 잘못된 자동화·편향·누락 탐지
- 데이터 이용 조건과 field lineage 확인

초기 내부 화면에서도 역할을 한 개 `admin`으로 합치지 않는다. 개발 편의를 위한 bootstrap identity는 production에서 사용할 수 없도록 환경 gate를 둔다.

---

## 6. End-to-end 흐름

```text
승인된 source fixture/file
          ↓
source snapshot 등록 + checksum
          ↓
raw record append/dedup
          ↓
schema validation ── 실패 → quarantine
          ↓
normalization observation
          ↓
blocking 후보 생성 + rule score
          ↓
resolution candidate queue
          ↓
운영자 결정
  ├─ create new branch
  ├─ link existing branch
  ├─ hold for evidence
  └─ reject/non-restaurant
          ↓
canonical write + assertions + audit + outbox
          ↓
public branch read model
          ↓
PostgreSQL search projection
          ↓
public detail API + search API
```

각 화살표는 재시도 가능해야 하며 이전 단계 원본을 덮어쓰지 않는다.

---

## 7. 상태 모델

### 7.1 ingestion run

```text
created
  → fetching
  → received
  → validating
  → processing
  → completed

각 실행 단계 → failed_retryable
             → failed_terminal
             → cancelled
```

`completed`는 모든 record가 공개됐다는 뜻이 아니다. run summary에 accepted, quarantined, candidate, unchanged 수를 분리한다.

### 7.2 raw record

```text
received
  → valid
  → normalized
  → resolution_pending
  → resolved

received/valid → quarantined
resolved → superseded
```

### 7.3 resolution candidate

```text
pending
  → in_review
  → awaiting_evidence
  → decided_create
  → decided_link
  → rejected
  → superseded
```

자동 판정이 있더라도 FND-01에서는 신규 공개 생성은 사람 승인을 요구한다.

### 7.4 branch publication

영업 상태와 publication 상태를 분리한다.

```text
publication_status:
draft → pending_review → published → limited → withdrawn

operational_status:
pre_open | open | temporarily_closed | closed | moved | unknown
```

폐업 지점은 `published + closed`로 역사 페이지를 유지할 수 있다. `withdrawn`은 데이터 권리·중복·정책상 공개하지 않는 상태다.

---

## 8. 첫 source contract

### 8.1 adapter 입력

실제 source의 column명을 domain field로 직접 사용하지 않는다. adapter가 versioned observation으로 변환한다.

```json
{
  "sourceRecordKey": "source-owned-key",
  "sourceUpdatedAt": "2026-08-31T00:00:00Z",
  "observed": {
    "name": "도락식당",
    "roadAddress": "서울특별시 ...",
    "lotAddress": null,
    "phone": null,
    "licenseStatus": "SOURCE_ACTIVE_CODE",
    "businessTypeCode": "SOURCE_TYPE_CODE",
    "latitude": 37.0,
    "longitude": 127.0
  }
}
```

fixture 값은 문서용 가상 값이다.

### 8.2 snapshot manifest

```json
{
  "sourceCode": "approved_source_v1",
  "adapterVersion": "1.0.0",
  "schemaVersion": 1,
  "objectChecksum": "sha256:...",
  "recordCountDeclared": 100,
  "effectiveAt": "2026-08-31T00:00:00Z",
  "licensePolicyVersion": "policy-id",
  "requestedBy": "internal-actor-reference"
}
```

### 8.3 idempotency identity

snapshot identity:

```text
(source_id, object_checksum, adapter_version)
```

record identity:

```text
(source_id, source_record_key, source_version_or_payload_hash)
```

source가 mutable row만 제공하면 수집 시 payload hash와 observed time을 보존한다. `updated_at`을 신뢰할 수 없는 source는 동일 payload 재수집과 실제 변경을 hash로 구분한다.

### 8.4 schema drift

다음은 run을 자동 차단한다.

- required source key 누락
- column header/JSON path의 예상치 못한 변경
- 좌표 범위 오류 급증
- status code unknown 비율 임계치 초과
- record 수가 이전 대비 비정상 급감·급증
- 문자 encoding decode 실패

unknown optional column은 원본에 보존할 수 있지만 domain mapping에 자동 채택하지 않는다.

---

## 9. Normalization v1

### 9.1 출력

```text
normalized_observation
  raw_source_record_id
  normalizer_version
  normalized_name
  name_tokens
  normalized_road_address
  normalized_lot_address
  building_key
  normalized_phone_hash/null
  point
  normalized_license_status
  mapped_category_codes
  warnings
  created_at
```

### 9.2 이름

v1에서 허용:

- Unicode normalization
- 앞뒤·연속 공백 정리
- 표준 구두점 정리
- 법인·지점 표기의 구조적 분리 후보
- 비교용 소문자/숫자 normalization

금지:

- 원문 표시 이름 덮어쓰기
- 맛집, 본점 같은 토큰을 무조건 제거
- 한자·영문·한글 이름을 근거 없이 동일시
- 업종 단어만 남은 이름을 자동 합침

### 9.3 주소

- 도로명과 지번을 둘 다 보존한다.
- 건물, 층, 호수 정보를 분리한다.
- 행정구역 code는 기준 데이터 version을 기록한다.
- geocoder 결과는 source assertion이지 진실의 자동 교체가 아니다.
- 좌표 정밀도 유형을 함께 둔다.

### 9.4 전화

전화 원문 수집 권리가 확인된 경우에만 처리한다.

- 비교용 normalized value는 제한 영역에서 hash
- 공개 전화번호는 별도 field selection과 권리 검토
- 전화 일치만으로 동일 branch 확정 금지
- 공유 번호, 호텔 대표 번호, 푸드코트 예외

### 9.5 determinism

같은 `raw record + normalizer version + reference data version`은 같은 normalized digest를 만들어야 한다. 현재 시각, 외부 API의 비고정 응답을 순수 normalization 안에서 호출하지 않는다.

---

## 10. Entity resolution v1

### 10.1 candidate blocking

다음 block을 독립적으로 생성하고 합집합한다.

- 같은 license lookup hash
- 같은 normalized phone hash
- 같은 building/address key
- 반경 N미터 + 이름 token
- 강한 normalized name + 같은 행정구역
- source가 제공하는 stable relation

N과 threshold는 설정 version에 둔다. 코드 상수로 숨기지 않는다.

### 10.2 feature

긍정:

- license exact
- phone exact
- address/building exact
- entrance point 근접
- 이름 token 강한 일치
- category 호환
- source continuity

부정:

- 동시 영업하는 다른 층/호수
- 명확히 다른 license
- 멀리 떨어진 위치
- 서로 다른 프랜차이즈 branch suffix
- 폐업 후 다른 콘셉트 재개업

### 10.3 FND-01 decision

v1은 설명 가능한 rule score만 사용한다.

```text
auto_link: 매우 강한 exact 근거 + 충돌 신호 없음, 내부 shadow부터
manual_review: 대부분의 후보
auto_create: FND-01 공개 흐름에서는 사용하지 않음
quarantine: schema/identity 해석 불가
```

auto link도 초기에는 shadow decision과 사람 결과를 비교한 뒤 활성화한다.

### 10.4 decision record

```text
candidate_id
decision
selected_branch_id/null
rule_version
feature_snapshot
reason_codes
operator_id
base_branch_version/null
decided_at
```

자유서술 메모만으로 결정을 저장하지 않는다. 표준 reason code와 필요한 최소 메모를 함께 사용한다.

---

## 11. 운영 검수 화면

### 11.1 queue

필수 column:

- source와 수집 시각
- 원문 상호·주소
- candidate 유형
- 가장 강한 match 근거
- 충돌 경고
- 대기 시간
- 우선순위
- 할당 상태

모델 score만 크게 보여 anchor bias를 만들지 않는다. 원문과 후보 비교가 먼저 읽히고 자동 점수는 설명 가능한 보조 정보로 둔다.

### 11.2 detail

```text
왼쪽: source 원문과 normalization
가운데: 지도/주소와 기존 후보 목록
오른쪽: 선택 후보의 현재 값·출처·이력
하단: create/link/hold/reject와 reason
```

### 11.3 actions

```text
POST /v1/ops/resolution-candidates/{candidateId}:claim
POST /v1/ops/resolution-candidates/{candidateId}:release
POST /v1/ops/resolution-candidates/{candidateId}:create-branch
POST /v1/ops/resolution-candidates/{candidateId}:link-branch
POST /v1/ops/resolution-candidates/{candidateId}:hold
POST /v1/ops/resolution-candidates/{candidateId}:reject
```

모든 결정 action:

- operator auth와 role
- `If-Match` 또는 candidate version
- idempotency key
- reason code
- audit record
- stable Problem Details 오류

### 11.4 conflict

다른 운영자가 먼저 결정했다면 409 또는 412와 최신 상태를 반환한다. 늦은 화면의 입력으로 결정 row를 덮어쓰지 않는다.

---

## 12. Canonical write

### 12.1 신규 지점 transaction

```text
candidate/version lock
raw·normalized observation 상태 확인
public ID 생성
restaurant 생성 또는 승인된 기존 restaurant 선택
branch draft 생성
branch location history 생성
category link 생성
field assertions 채택
candidate decided_create
branch publication pending_review 또는 published
entity change record
audit record
outbox events
commit
```

FND-01에서 candidate 승인과 publication을 같은 사람이 할 수 있는지는 환경별 정책이다. production beta 전에는 maker-checker 필요성 표본을 검증한다.

### 12.2 기존 지점 link

- source observation을 기존 branch assertion으로 연결
- branch field selection policy 재평가
- 현재값이 바뀐 경우에만 aggregate version 증가
- 같은 값의 새 source 근거는 assertion version은 바뀌어도 불필요한 public update event를 피할 수 있음
- candidate와 raw record는 resolved로 전환

### 12.3 event

초기 canonical wire event:

```text
branch.created
branch.updated
branch.publication_changed
```

payload 최소값:

```json
{
  "branchId": "br_public_example",
  "changedFields": ["displayName", "location", "primaryCategory"],
  "publicationStatus": "published",
  "sourceVersion": 1
}
```

실제 schema는 `schemas/events/branch/**/v1.schema.json`에 둔다. 내부 UUID와 source 원문을 싣지 않는다.

---

## 13. Public read model

### 13.1 `PublicBranchDetail` 최소값

```json
{
  "id": "br_public_example",
  "displayName": "도락식당",
  "branchName": null,
  "operationalStatus": "open",
  "location": {
    "roadAddress": "서울특별시 ...",
    "lotAddress": null,
    "latitude": 37.0,
    "longitude": 127.0,
    "regionCode": "..."
  },
  "primaryCategory": {
    "code": "restaurant.general",
    "name": "음식점"
  },
  "sourceVersion": 1,
  "lastVerifiedAt": "2026-09-02T00:00:00Z",
  "links": {
    "self": "/v1/branches/br_public_example"
  }
}
```

아직 없는 값은 가짜 placeholder로 채우지 않는다.

- 점수 없음: `0.0` 금지
- 리뷰 없음: 구현 전 `reviews` 빈 배열을 상세에 억지로 포함하지 않음
- 영업시간 미확인: closed로 표시 금지
- 좌표 미확인: `(0,0)` 금지
- 메뉴 가격 미정: 0원 금지

### 13.2 endpoint

```text
GET /v1/branches/{branchId}
```

response:

- `200`: public/limited 정책에 따른 표현
- `304`: ETag 일치
- `404`: 존재하지 않거나 공개 권한상 숨김
- `410`: 영구 제거를 명시할 제품 정책이 생기기 전 사용하지 않음

header:

```text
ETag: "branch-<sourceVersion>-<representationVersion>"
Cache-Control: public, max-age=<short>, stale-while-revalidate=<bounded>
```

정확한 TTL은 철회 전파 SLO와 CDN purge 검증 후 확정한다.

### 13.3 read model 갱신

초기에는 PostgreSQL query/read view로 응답할 수 있다. 성능을 위해 별도 table을 만들더라도 branch source version을 기록하고 event로 재구성 가능해야 한다.

---

## 14. Search document v1

### 14.1 index eligibility

```text
publication_status = published
AND operational_status in allowed historical/current set
AND public location/name minimum complete
AND rights/policy block 없음
```

closed 지점 기본 검색 포함 여부는 query filter 정책으로 처리한다. index 삭제만으로 역사 페이지를 잃지 않는다.

### 14.2 document

```json
{
  "documentSchemaVersion": 1,
  "branchId": "br_public_example",
  "sourceVersion": 1,
  "displayName": "도락식당",
  "normalizedNames": ["도락식당"],
  "categoryCodes": ["restaurant.general"],
  "regionCodes": ["..."],
  "location": { "lat": 37.0, "lon": 127.0 },
  "operationalStatus": "open",
  "indexedAt": "2026-09-02T00:00:01Z"
}
```

### 14.3 PostgreSQL 검색 projection 갱신

1. 입력 job 또는 event schema validate
2. `(consumer, eventId)` 또는 job key dedup
3. canonical branch public source 조회
4. 요청 source version과 현재 version 비교
5. 공개 eligibility 판정
6. PostgreSQL search document upsert 또는 delete/tombstone
7. 처리 결과와 실패를 DB에 기록
8. 마지막 정상 반영 시각 갱신

현재 search document의 `sourceVersion`보다 작은 입력은 적용하지 않는다.

### 14.4 최소 검색 API

```text
GET /v1/branches?query=<text>&latitude=<lat>&longitude=<lon>&radiusMeters=<n>&limit=<n>&cursor=<opaque>
```

FND-01은 상호 exact/prefix 또는 단순 text, 지리 filter, category filter만 제공할 수 있다. 정교한 한글 형태소·초성·랭킹은 [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)의 별도 spike로 확장한다.

response item은 `PublicBranchSummary`이며 PostgreSQL 내부 row나 search document를 그대로 반환하지 않는다.

---

## 15. API 계약 산출물

```text
openapi/dorak-v1.yaml
  GET /v1/branches
  GET /v1/branches/{branchId}

openapi/dorak-ops-v1.yaml
  GET /v1/ops/ingestion-runs
  GET /v1/ops/resolution-candidates
  GET /v1/ops/resolution-candidates/{candidateId}
  POST ...:claim
  POST ...:create-branch
  POST ...:link-branch
  POST ...:hold
  POST ...:reject

schemas/events/branch/
  branch-created/v1.schema.json
  branch-updated/v1.schema.json
  branch-publication-changed/v1.schema.json
```

필수 공통 component:

- public ID
- RFC 3339 instant
- WGS84 geo point
- region/category summary
- Problem Details
- cursor page
- idempotency key header
- ETag/If-Match

---

## 16. Database 산출물

### 16.1 P0 table

```text
ingestion.data_source
ingestion.source_snapshot
ingestion.ingestion_run
ingestion.raw_source_record
ingestion.normalized_observation
ingestion.resolution_candidate
ingestion.resolution_candidate_match

core.restaurant
core.branch
core.branch_location_history
core.category
core.branch_category
core.data_assertion
core.entity_change

platform.idempotency_record
platform.outbox_event
platform.consumed_event
audit.audit_log
```

### 16.2 P1 table

```text
core.brand
core.business_license
private.business_license_secret
core.business_license_link
core.branch_name_history
core.branch_relation
ingestion.quarantine_record
ingestion.quality_sample
```

실제 source에 license field가 없다면 license table 구현을 억지로 FND-01 demo에 넣지 않는다. schema 순서와 source capability를 구분한다.

---

## 17. Monorepo 산출물

```text
apps/
  api/
  ops/
  web/                 최소 public branch detail

packages/
  api-contracts/
  event-contracts/
  domain-types/
  ids/
  server-catalog/
  server-ingestion/
  server-search/
  server-platform/
  observability/
  test-fixtures/

db/
  migrations/
  seeds/
  checks/

openapi/
schemas/
infra/local/
```

초기 ingestion과 검색 projection 갱신은 별도 deployable을 만들지 않는다. `apps/web`의 server entrypoint 또는 `tooling`의 저빈도 CLI가 `packages/server-ingestion`, `packages/server-search`를 composition한다. 경계는 package export, import 방향, DB ownership test로 보호한다.

---

## 18. Feature flag와 환경

### 18.1 flag

```text
ingestion.source.<code>.enabled
ingestion.auto_link.enabled
branch.publication.enabled
search.indexing.enabled
public.branch_detail.enabled
public.branch_search.enabled
```

flag는 정합성 불변식을 우회하지 않는다. 예를 들어 indexing을 끄면 outbox가 보존되고 재개 후 catch-up할 수 있어야 한다.

### 18.2 환경

| 환경       | source                 | 공개        | 외부 side effect |
| ---------- | ---------------------- | ----------- | ---------------- |
| local      | synthetic fixture      | local only  | 없음             |
| CI         | deterministic fixture  | test server | 없음             |
| dev        | 승인 샘플              | 사내        | 없음             |
| staging    | 제한된 production-like | allowlist   | 차단/샌드박스    |
| production | 계약 승인 source       | 단계 flag   | 승인된 것만      |

production snapshot을 local 개발에 복사하지 않는다.

---

## 19. 관측성

### 19.1 trace

한 record 흐름을 다음 ID로 연결한다.

```text
ingestionRunId
snapshotId
rawRecordId
candidateId
branchId
eventId
indexingAttemptId
requestId/traceId
```

원문 상호·주소·전화 전체를 trace attribute에 넣지 않는다.

### 19.2 metric

- run duration과 status
- records received/valid/quarantined/unchanged
- normalization warning rate
- candidates created/resolved/age
- operator decision rate와 reversal rate
- new branch/link/reject 분포
- outbox unpublished age
- index consumer lag·failure·stale skip
- public detail 404/5xx/latency
- API vs search version mismatch
- source별 duplicate rate

### 19.3 alert

초기 alert 후보:

- run terminal failure
- record count 급변
- quarantine 비율 급증
- oldest pending candidate SLA 초과
- outbox age 초과
- index lag 초과
- publication withdrawal 전파 SLO 실패
- private field contract scan 실패

threshold는 정상 baseline을 측정한 뒤 확정한다. 모든 warning을 pager로 보내지 않는다.

---

## 20. 실패와 복구

### 20.1 adapter 실패

- snapshot checksum과 원본은 유지
- retryable/terminal code 분리
- 이미 성공한 record를 다시 만들지 않음
- adapter version 변경은 새 processing run

### 20.2 normalization 버그

- 원본 수정 금지
- 새 normalizer version으로 재처리
- 바뀐 candidate와 이미 내려진 결정 영향 보고서
- 자동 canonical rewrite 금지

### 20.3 잘못된 운영 승인

- decision reversal record
- branch publication 제한 또는 merge/split plan
- public read model과 search correction event
- audit와 사용자 영향 평가
- 원래 source·decision 삭제 금지

### 20.4 검색 projection 갱신 중단

- public detail DB path는 계속 가능
- 검색 freshness 경고와 필요 시 검색 flag 비활성
- 미처리 job/outbox 기록 보존
- catch-up은 version compare와 dedup 적용
- 전체 rebuild와 incremental replay 결과 대조

### 20.5 PostgreSQL 검색 projection 손상

1. 쓰기와 검색 범위를 안전하게 제한한다.
2. canonical table에서 eligible branch를 다시 읽는다.
3. source version을 포함해 새 search table 또는 column을 재생성한다.
4. 작업 중 발생한 변경분을 version 비교로 반영한다.
5. count·sample·checksum을 검증한다.
6. transaction 안에서 새 projection으로 전환한다.
7. 문제가 없으면 손상된 projection을 제거한다.

---

## 21. 보안·개인정보

### 21.1 allowlist

FND-01 public branch에는 다음만 허용한다.

- 공개 상호·지점명
- 공개 영업 상태
- 공개 주소·지도 좌표
- 공개 category
- 검증 시각·공개 provenance 수준
- public ID

다음은 금지한다.

- 내부 UUID
- license 원문/hash
- 대표자명
- 운영 메모와 operator identity
- 원천 raw payload/object key
- match feature·risk score
- 비공개 전화·이메일
- audit digest와 trace 내부 정보

### 21.2 운영 화면

- role별 source field masking
- 결정 action 사유 필수
- 민감 원문 reveal은 별도 권한·감사
- CSV export 초기 비활성
- 화면·API cache private/no-store
- screenshot·복사 방지 기술을 보안의 주 수단으로 삼지 않음

### 21.3 fixture

- synthetic default
- 실제 샘플은 별도 암호화·접근 제한
- source ID와 상호를 임의로 일부 바꾸는 것으로 비식별 완료라 판단하지 않음
- CI artifact와 실패 로그에 raw row 출력 금지

---

## 22. 테스트 전략

### 22.1 unit

- name/address/status normalization
- deterministic digest
- ID prefix·entropy shape
- source status mapping
- candidate feature calculation
- publication eligibility
- search document mapping

### 22.2 property

- normalization idempotence
- Unicode·공백·구두점 경계
- 좌표 범위
- 동일 snapshot replay 수렴
- public mapper가 private key를 출력하지 않음

### 22.3 database

- location period overlap 거부
- branch self-move/merge 거부
- public ID unique
- outbox aggregate sequence unique
- candidate concurrent decision 한 건만 성공
- runtime role private schema 접근 거부
- transaction rollback 시 branch와 outbox 모두 없음

### 22.4 contract

- OpenAPI example validation
- public branch minimal/full/closed/limited fixture
- unknown optional response field
- stable Problem Details code
- event v1 minimal/full fixture
- breaking diff gate

### 22.5 integration

- fixture → raw → normalized → candidate
- create decision → branch/assertion/audit/outbox
- outbox/job → search projector → PostgreSQL search
- same event twice
- older version after newer version
- source replay
- search projection rebuild
- publication withdrawal purge

### 22.6 E2E

```gherkin
Given 승인된 source fixture가 있고
When ingestion run을 실행하고 candidate를 신규 지점으로 승인하면
Then public branch detail이 공개 ID로 조회되고
And 검색 결과가 같은 branch ID와 source version을 반환하며
And 원문·운영 메모·내부 UUID는 공개 응답에 없다
```

### 22.7 failure injection

- DB commit 직전 process 종료
- commit 후 publish 전 종료
- PostgreSQL 검색 query timeout
- 같은 candidate 동시 승인
- schema drift file
- malformed Unicode/좌표
- outbox poison payload
- search projection 전환 실패

---

## 23. 품질 평가

### 23.1 golden set

최소 사례:

- 독립 음식점 신규 생성
- 같은 branch의 동일 source 재수집
- 같은 지점의 상호 표기 변형
- 동일 건물의 다른 층 음식점
- 프랜차이즈 동일 이름 여러 지점
- 폐업 지점
- 이전 지점
- 푸드코트/공유 주소
- 전화번호 없는 지점
- 좌표 없는 지점
- source 간 상태 충돌
- non-restaurant record

### 23.2 지표 정의

```text
candidate precision
candidate recall
auto-link precision — shadow
new branch false split rate
false merge rate
field provenance coverage
operator agreement
reversal rate
time to decision
```

false merge 비용이 false split보다 크므로 threshold와 수동 검수 비율에 비대칭을 반영한다.

### 23.3 공개 전 표본

- source·지역·업종별 층화
- 자동 점수 blind review 표본
- 신규과 link 결정 모두 포함
- 어려운 case 제외 금지
- reviewer disagreement와 adjudication 기록

---

## 24. 작업 분해

### Epic FND-A: Repository foundation

| ID      | 작업                               | 선행 | 완료 증거               |
| ------- | ---------------------------------- | ---- | ----------------------- |
| FND-001 | pnpm/Turborepo workspace           | 없음 | clean install·build     |
| FND-002 | API/ops/web 최소 앱                | 001  | health smoke            |
| FND-003 | local PostgreSQL/PostGIS/`pg_trgm` | 001  | CI-compatible bootstrap |
| FND-004 | env·secret validation              | 002  | 누락 시 fail-fast       |
| FND-005 | logging/tracing skeleton           | 002  | trace 연결              |

### Epic FND-B: Contracts and DB

| ID      | 작업                          | 선행 | 완료 증거            |
| ------- | ----------------------------- | ---- | -------------------- |
| FND-010 | OpenAPI root·common schema    | 001  | validate/bundle      |
| FND-011 | event envelope·branch events  | 010  | fixture validation   |
| FND-012 | migration harness·roles       | 003  | empty DB apply       |
| FND-013 | foundation tables·constraints | 012  | DB invariant tests   |
| FND-014 | public ID package             | 001  | entropy/format tests |
| FND-015 | contract generation CI        | 010  | clean generation     |

### Epic FND-C: Ingestion

| ID      | 작업                       | 선행 | 완료 증거            |
| ------- | -------------------------- | ---- | -------------------- |
| FND-020 | source registry·snapshot   | 013  | checksum dedup       |
| FND-021 | synthetic adapter          | 020  | deterministic parse  |
| FND-022 | raw record persistence     | 021  | replay no duplicate  |
| FND-023 | schema drift/quarantine    | 022  | bad fixture isolated |
| FND-024 | normalization v1           | 022  | golden tests         |
| FND-025 | candidate blocking/scoring | 024  | evaluation report    |

### Epic FND-D: Operations

| ID      | 작업                 | 선행    | 완료 증거                |
| ------- | -------------------- | ------- | ------------------------ |
| FND-030 | candidate queue API  | 025     | cursor/role tests        |
| FND-031 | candidate detail API | 030     | provenance display DTO   |
| FND-032 | decision commands    | 013,031 | concurrency/idempotency  |
| FND-033 | ops queue UI         | 030,031 | keyboard-accessible flow |
| FND-034 | decision UI·conflict | 032,033 | E2E create/link          |
| FND-035 | audit viewer minimum | 032     | actor/reason trace       |

### Epic FND-E: Public and search

| ID      | 작업                           | 선행    | 완료 증거                |
| ------- | ------------------------------ | ------- | ------------------------ |
| FND-040 | branch detail mapper/API       | 013,010 | contract test            |
| FND-041 | outbox publisher               | 011,013 | crash recovery           |
| FND-042 | search document mapper         | 040     | golden fixture           |
| FND-043 | search projector dedup/version | 041,042 | duplicate/old event test |
| FND-044 | branch search API              | 043     | same ID/version          |
| FND-045 | public detail web              | 040     | minimal accessible page  |

### Epic FND-F: Quality and release

| ID      | 작업                       | 선행    | 완료 증거           |
| ------- | -------------------------- | ------- | ------------------- |
| FND-050 | pipeline metrics/dashboard | C,D,E   | run-to-search trace |
| FND-051 | API-search reconciler      | 043,044 | mismatch report     |
| FND-052 | golden entity set          | 025     | labeled baseline    |
| FND-053 | failure injection suite    | D,E     | recovery evidence   |
| FND-054 | backup/restore + rebuild   | 013,043 | timed rehearsal     |
| FND-055 | demo/go-no-go packet       | 전체    | 승인 기록           |

---

## 25. 의존성

```text
repo/local infra
    ├─ contracts ─────────────┐
    └─ migrations/roles ──────┤
                              ↓
source registry → raw → normalize → candidate
                                      ↓
                              ops decision command
                                      ↓
                    canonical + audit + outbox
                           ├──────────┴─────────┐
                           ↓                    ↓
                  branch detail API      PostgreSQL search API
                           └──────────┬─────────┘
                                      ↓
                              reconciliation/E2E
```

운영 UI 완성을 기다리지 않고 API fixture로 command 흐름을 먼저 검증할 수 있다. 반대로 canonical DB 없이 mock UI만 만드는 것을 슬라이스 완료로 인정하지 않는다.

---

## 26. 권장 구현 순서

### Week block 1: harness

- repository, local infra, migration
- OpenAPI/event root
- source synthetic fixture
- branch/location 최소 table

### Week block 2: data path

- raw persistence와 normalization
- candidate rules와 golden set
- operator queue API
- canonical transaction과 outbox

### Week block 3: public path

- public branch detail
- search projector와 PostgreSQL search
- 최소 ops UI
- reconciliation과 observability

### Week block 4: hardening

- concurrency, replay, failure injection
- backup/restore/rebuild
- privacy allowlist audit
- demo와 gate review

`Week block`은 인원수와 연구·법률 의존성에 따라 달라지는 작업 묶음이지 외부 일정 약속이 아니다.

---

## 27. Demo script

### Demo A: 신규 지점

1. synthetic snapshot 제출
2. run과 record count 확인
3. candidate queue에서 원문/정규화 비교
4. 신규 branch 승인
5. audit/outbox 확인
6. public detail 조회
7. search 조회
8. source → assertion → public field lineage 확인

### Demo B: 멱등 재처리

1. 같은 snapshot 재제출
2. 새로운 canonical branch가 생기지 않음
3. run summary가 unchanged/deduplicated를 표시
4. public source version 불필요 증가 없음

### Demo C: 충돌

1. 두 operator session에서 같은 candidate 열기
2. 첫 session 승인
3. 두 번째 session은 version conflict와 최신 결정 확인
4. duplicate branch 없음

### Demo D: consumer 장애

1. search projector flag 비활성
2. branch 승인
3. public DB detail 성공, outbox lag 증가
4. search projector 재활성
5. event catch-up 후 search 노출
6. 같은 event 재전달에도 document 하나

### Demo E: 철회

1. 데이터 권리 또는 잘못된 merge 사유로 publication 철회
2. search에서 제거
3. public detail 정책 반영
4. ops source/history/audit 유지
5. 전파 지연 metric 확인

---

## 28. Definition of Done

### 기능

- [ ] 승인 source 한 종류가 snapshot부터 raw record까지 들어온다.
- [ ] normalization과 candidate 결과가 재현 가능하다.
- [ ] operator가 create/link/hold/reject를 수행한다.
- [ ] 승인 branch가 public detail과 search에 동일 ID로 보인다.
- [ ] 철회가 모든 public read path에 전파된다.

### 정합성

- [ ] snapshot·record·decision·event replay가 중복 canonical row를 만들지 않는다.
- [ ] candidate 동시 결정에서 하나만 성공한다.
- [ ] branch·audit·outbox가 같은 transaction 결과를 가진다.
- [ ] 오래된 event가 search version을 역전하지 않는다.
- [ ] source lineage가 모든 공개 핵심 field에 존재한다.

### 보안·개인정보

- [ ] public API에 내부 UUID·원천 원문·운영 메모가 없다.
- [ ] runtime role이 private/audit를 임의 변경하지 못한다.
- [ ] 실제 source 사용 권리와 보존 조건이 승인됐다.
- [ ] raw request/response body가 일반 로그에 없다.
- [ ] bootstrap operator auth가 production에서 차단된다.

### 품질·운영

- [ ] golden set 결과와 오판 표본이 기록됐다.
- [ ] run, candidate, outbox, index lag dashboard가 있다.
- [ ] quarantine·reprocess·withdrawal runbook이 검증됐다.
- [ ] DB restore와 search rebuild rehearsal이 성공했다.
- [ ] owner, alert, rollback, feature flag가 등록됐다.

### 개발 경험

- [ ] 새 개발자가 문서대로 local demo를 재현한다.
- [ ] migration·contract·test가 단일 CI에서 통과한다.
- [ ] generated artifact를 수정하지 않아도 clean build된다.
- [ ] fixture에 실제 개인정보·비밀이 없다.

---

## 29. 종료 후 다음 슬라이스

FND-01 완료 후 병렬 후보:

1. `FND-02`: 지점 수정 제보와 assertion conflict
2. `FND-03`: 폐업·이전·병합·분리 운영
3. `DSC-01`: 한글 검색·자동완성·지도 검색
4. `IDN-01`: 소비자 계정·공개 프로필
5. `TRS-01`: 방문·리뷰·media upload

다음 슬라이스로 넘어가도 FND-01의 source lineage, outbox, 공개 DTO 분리 규칙을 우회하지 않는다.

---

## 30. 미해결 결정

| 항목                      | FND-01 기본                          | 결정 gate                  |
| ------------------------- | ------------------------------------ | -------------------------- |
| 첫 실제 source            | 법률·이용조건 승인 전 synthetic      | source register 승인       |
| pilot 지역                | 설정값, 문서에서 고정 안 함          | 연구·운영·데이터 품질 판단 |
| operator auth             | 사내 제한 방식 + 만료                | staging 전                 |
| maker-checker             | 신규 공개 표본부터 검토              | 운영 위험 평가             |
| auto-link                 | shadow only                          | golden precision 충족      |
| public provenance 표현    | 마지막 검증 시각 + 제한 source label | UX·라이선스 검토           |
| search analyzer           | 최소 text 후 Nori spike              | DSC-01                     |
| branch detail cache TTL   | 짧게 시작                            | 철회 전파 rehearsal        |
| ingestion deployable 분리 | 동일 worker module 가능              | 부하·배포 경계 측정        |
| 실제 지도 표시            | 좌표 확인용 ops provider 임시        | 공급자 계약 결정           |

---

## 31. 승인 기록 템플릿

```text
슬라이스: FND-01
검토 일시:
source/data owner:
backend owner:
search owner:
operations owner:
security/privacy owner:

계약 검증:
DB migration 검증:
golden set 결과:
failure rehearsal:
restore/rebuild 결과:
공개 데이터 권리:
미해결 위험:

결정: GO | CONDITIONAL GO | NO-GO
조건/만료일:
승인자:
후속 issue:
```
