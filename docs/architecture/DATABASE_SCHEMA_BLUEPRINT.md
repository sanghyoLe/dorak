# 도락 물리 데이터베이스 스키마 청사진

> 상태: 초안 v0.1  
> 기준일: 2026-09-02  
> 대상 DB: PostgreSQL 18.x + PostGIS  
> 역할: 개념 데이터 모델을 실제 migration·제약·인덱스로 옮기는 기준  
> 연관 문서: [DATA_MODEL.md](./DATA_MODEL.md), [CONTRACTS_AND_SCHEMAS.md](./CONTRACTS_AND_SCHEMAS.md), [FOUNDATION_VERTICAL_SLICE.md](./FOUNDATION_VERTICAL_SLICE.md), [TECH_STACK.md](./TECH_STACK.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md), [DATA_INGESTION.md](./DATA_INGESTION.md)

---

## 1. 목적

[DATA_MODEL.md](./DATA_MODEL.md)는 도락의 엔터티와 의미를 정의한다. 이 문서는 그 의미를 PostgreSQL migration으로 옮길 때 필요한 물리 결정을 정한다.

- schema와 database role 경계
- 내부·외부 식별자
- column type과 nullability
- foreign key와 삭제 행동
- unique, check, exclusion constraint
- current row와 history 표현
- 공간 검색용 PostGIS 구조
- transaction과 outbox 원자성
- index와 query pattern
- 파티셔닝 시작 조건
- 개인정보 격리와 감사
- online migration과 backfill

이 문서는 완성 DDL 파일 자체가 아니다. 모든 예시 SQL은 첫 migration spike에서 실행·성능·Drizzle introspection을 검증한 뒤 실제 원본으로 승격한다.

---

## 2. 설계 원칙

### DB-P01. 데이터베이스도 도메인 불변식을 지킨다

애플리케이션 validation만 믿지 않는다. 다음은 가능한 한 DB constraint로 막는다.

- 잘못된 평점 범위와 간격
- 음수 금액·인원·좌석 수
- 같은 actor의 중복 반응
- 한 지점의 겹치는 현재 주 위치
- 하나의 review에 여러 활성 revision
- 잘못된 병합 self-reference
- 중복 idempotency key
- 동일 결제사 event의 중복 처리

여러 aggregate와 외부 상태를 함께 봐야 하는 규칙은 transaction command와 비동기 품질 검사로 보완한다.

### DB-P02. 외부 계약과 row를 분리한다

table row를 그대로 API에 직렬화하지 않는다. 내부 UUID, 암호문, 운영 상태, risk signal은 actor별 response mapper를 통과해야 한다.

### DB-P03. 현재값과 이력을 목적에 맞게 분리한다

모든 변경을 무조건 event sourcing으로 저장하지 않는다.

- 빠른 현재 조회: aggregate/current table
- 법적·제품상 필요한 이력: 명시적 history/revision table
- 시스템 간 전달: transactional outbox
- 운영 추적: 최소화한 audit log

### DB-P04. nullable은 상태를 대신하지 않는다

`NULL`은 값이 없거나 아직 알려지지 않았다는 뜻으로만 사용한다. 삭제, 폐업, 거절, 철회 같은 상태는 명시적 column으로 표현한다.

### DB-P05. JSONB는 탈출구가 아니다

검색·제약·관계·권한에 쓰이는 필드는 typed column으로 둔다. JSONB는 다음처럼 형태가 다양하거나 원본 보존이 목적인 경우에 제한한다.

- 외부 원천 raw payload
- schema-versioned outbox payload
- 공급자별 안전하게 선별된 metadata
- 과거 정책 snapshot의 부속 parameter

### DB-P06. 삭제 의미를 table별로 정의한다

범용 `deleted_at`을 모든 table에 복사하지 않는다. hard delete, tombstone, 비공개, 폐업, 계정 종료, 법적 보존을 구분한다.

### DB-P07. 인덱스는 실제 query와 함께 승인한다

예상 query, 정렬, cardinality, `EXPLAIN (ANALYZE, BUFFERS)` 증거 없이 인덱스를 무작정 늘리지 않는다. write amplification과 vacuum 비용도 함께 본다.

---

## 3. PostgreSQL 기준 버전과 extension

### 3.1 초기 기준

- PostgreSQL 18.x stable
- PostGIS는 선택한 관리형 PostgreSQL 18과 호환되는 안정 버전
- application timezone은 UTC
- database encoding은 UTF-8
- collation은 초기 생성 시 명시하고 환경별 차이를 금지

PostgreSQL 19는 2026-09-02 현재 beta이므로 초기 운영 기준으로 삼지 않는다. major upgrade는 restore rehearsal, extension 호환성, query plan regression을 거쳐 별도 승인한다.

### 3.2 extension allowlist

| extension | 목적 | 초기 |
|---|---|---|
| `postgis` | 위치·거리·행정구역 공간 연산 | 필수 |
| `pg_trgm` | 정규화 상호·메뉴 유사도와 후보 생성 | 필수 |
| `btree_gist` | UUID/텍스트 equality와 기간 overlap exclusion 결합 | 필수 |
| `citext` | 제한적 case-insensitive identity 후보 | 검토 |
| `pgcrypto` | digest 등 제한된 DB 함수 | 검토 |

암호화의 주 키 관리와 envelope encryption을 `pgcrypto` 하나로 대체하지 않는다. extension은 migration에서 명시하며 production role이 임의 설치하지 못하게 한다.

---

## 4. 논리 schema와 role 경계

### 4.1 database schema

```text
core          음식점·지점·카테고리·메뉴
content       리뷰·리스트·미디어 metadata
identity      계정과 공개 profile, 세션 참조
private       직접 식별정보·예약 연락처·증빙 참조
owner         점주 조직·claim·권한
booking       재고·hold·예약·결제 연결
trust         평점·전문성·모더레이션
platform      outbox·idempotency·작업 상태
audit         제한 감사 기록
analytics     서비스용 집계 read model만, 원시 분석 warehouse 아님
```

PostgreSQL schema는 조직도를 그대로 복제하기보다 접근 경계와 migration 소유권을 표현한다.

### 4.2 role

```text
dorak_migrator       DDL 전용, runtime 사용 금지
dorak_api            일반 API 최소 권한
dorak_identity       identity/private 제한 접근
dorak_booking        booking과 예약 연락처 제한 접근
dorak_worker         outbox claim·job 처리
dorak_rating         평점 input read + trust output write
dorak_ops            운영 기능, 직접 SQL 아닌 서비스 경유
dorak_readonly       비민감 진단 read
dorak_auditor        승인된 감사 조회
```

규칙:

- object owner와 runtime role을 분리한다.
- `PUBLIC`의 schema create 권한을 제거한다.
- runtime role에 table owner 또는 superuser를 주지 않는다.
- cross-schema 접근은 명시적 grant만 허용한다.
- 운영자 화면도 DB에 직접 접속하지 않고 API 권한·감사를 거친다.
- break-glass role은 평소 비활성, 시간 제한, 사유·승인·session logging을 요구한다.

### 4.3 Row Level Security

RLS는 보조 방어선으로 검토하되 애플리케이션 권한 모델을 대신하지 않는다.

적합 후보:

- 조직별 점주 draft·설정
- 제한된 multi-tenant 분석 read model
- 운영 도구의 민감 사건 범위

주의:

- table owner와 `BYPASSRLS` role은 정책을 우회할 수 있다.
- connection pool에서 actor context가 누출되지 않게 transaction-local 설정을 사용한다.
- background worker와 migration의 정책 적용 여부를 test한다.
- 복잡한 join 권한은 security-definer 함수로 숨기기보다 서비스 계층 조회를 우선한다.
- RLS가 켜졌다는 사실만으로 개인정보 접근이 안전하다고 판단하지 않는다.

---

## 5. 식별자 전략

### 5.1 내부 primary key

내부 entity key는 PostgreSQL `uuid`와 UUIDv7을 사용한다.

```sql
id uuid PRIMARY KEY DEFAULT uuidv7()
```

이유:

- 분산 생성이 가능하다.
- 무작위 UUIDv4보다 시간 순서가 있어 B-tree locality가 낫다.
- PostgreSQL 18이 core `uuidv7()`을 제공한다.
- sequence 값을 외부에 노출할 위험이 없다.

주의:

- UUID 정렬 순서를 완전한 생성 순서로 사용하지 않는다.
- 생성 시각의 원본은 `created_at`이다.
- clock skew와 같은 millisecond 내 순서를 고려한다.
- UUIDv7에 포함된 시간 정보 때문에 이를 외부 비밀 ID로 간주하지 않는다.

### 5.2 외부 public ID

URL과 API에 노출되는 주요 리소스는 별도 `public_id text`를 사용한다.

```text
br_...   branch
rv_...   review
rsv_...  reservation
lst_...  list
med_...  media asset
```

규칙:

- prefix 뒤에는 CSPRNG 기반 최소 128-bit entropy를 둔다.
- public ID는 app에서 생성하고 DB unique constraint로 충돌을 막는다.
- 길이·alphabet·prefix는 중앙 package에서 생성·검증한다.
- ID에서 생성 시각, 지역, shard, 사용자 ID를 해석할 수 없게 한다.
- client는 prefix를 제외한 내부 구조도 해석하지 않는다.
- table 간 잘못된 ID 사용은 API branded type과 mapper로 막는다.

예시 제약의 형태:

```sql
public_id text NOT NULL UNIQUE,
CONSTRAINT branch_public_id_format
  CHECK (public_id ~ '^br_[A-Za-z0-9_-]{22,32}$')
```

정확한 alphabet과 길이는 ID package spike에서 고정한다. 형식이 결정되기 전 실제 migration에 느슨한 regex를 넣지 않는다.

### 5.3 외부 공급자 ID

공급자 ID는 별도 reference table에 다음 조합으로 보관한다.

```text
provider
namespace
external_id_hash 또는 external_id
entity_type
entity_id
valid_period
```

공급자 ID를 internal/public primary key로 사용하지 않는다. 민감 공급자 식별자는 암호문과 lookup hash를 분리한다.

---

## 6. 공통 column 규칙

### 6.1 시각

```sql
created_at timestamptz NOT NULL DEFAULT clock_timestamp()
updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
```

`updated_at` 자동 trigger를 모든 table에 무조건 넣지 않는다. 변경 command가 명시적으로 갱신하거나 공통 trigger를 쓸 경우 bulk import·backfill 동작을 test한다.

- 절대 시각: `timestamptz`
- 현지 날짜: `date`
- 현지 벽시계: `time without time zone`
- 유효 기간: `tstzrange` 또는 `daterange`
- 지점 timezone: IANA zone 문자열, application validation

`timestamp without time zone`에 UTC를 관습적으로 넣지 않는다.

### 6.2 version

낙관적 동시성과 이벤트 순서가 필요한 aggregate에는 다음을 둔다.

```sql
version bigint NOT NULL DEFAULT 1 CHECK (version > 0)
```

update는 다음 형태다.

```sql
UPDATE core.branch
SET display_name = $1,
    version = version + 1,
    updated_at = clock_timestamp()
WHERE id = $2
  AND version = $3;
```

영향 row가 0이면 404와 version conflict를 권한 누설 없이 구분한다.

### 6.3 상태

빠르게 변하거나 서비스 간 확장되는 상태는 PostgreSQL enum보다 `text + CHECK`를 초기 기본으로 한다.

장점:

- expand/contract migration이 단순하다.
- 상태 폐기와 과거 데이터가 공존하기 쉽다.
- Drizzle과 event schema의 mapping이 명확하다.

단점:

- CHECK와 도메인 schema 정합성을 유지해야 한다.

상태 목록은 [GLOSSARY.md](../product/GLOSSARY.md)와 도메인 문서를 기준으로 계약 test를 만든다.

### 6.4 문자열

- 이름: `text` + application/DB 길이 check
- 고정 표준 code: 의미에 맞는 `text`/`varchar`, 길이 check
- URL: 원문 `text`, 허용 scheme·host 정책은 application validation
- 긴 사용자 콘텐츠: `text`, 별도 byte/character 제한
- normalized search text: 원문과 별도 column

`varchar(255)`를 이유 없이 기본값으로 쓰지 않는다.

### 6.5 숫자

- 수량·순서: `integer` 또는 `smallint`
- 장기 증가 version/counter: `bigint`
- money: `bigint amount_minor`
- 정확한 score: `numeric(p,s)`
- 좌표: PostGIS type, 원본 공급자 좌표는 별도 numeric/text metadata
- 확률·모델 feature: 목적과 범위를 명시한 `double precision` 가능

### 6.6 JSONB

JSONB column은 반드시 다음을 가진다.

- schema/version 식별자
- 최대 크기
- 허용 key 또는 producer
- 개인정보 등급
- 보존·재생성 정책
- query 여부

JSONB 안의 자주 조회하는 값을 expression index로 늘리기 전에 typed column 승격을 검토한다.

---

## 7. Foundation 스키마

### 7.1 `core.restaurant`

```sql
CREATE TABLE core.restaurant (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  brand_id uuid NULL REFERENCES core.brand(id),
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  description text NULL,
  origin_type text NOT NULL,
  status text NOT NULL,
  merged_into_restaurant_id uuid NULL REFERENCES core.restaurant(id),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT restaurant_name_not_blank CHECK (btrim(canonical_name) <> ''),
  CONSTRAINT restaurant_not_merged_into_self CHECK (merged_into_restaurant_id IS DISTINCT FROM id),
  CONSTRAINT restaurant_merge_target_required CHECK (
    (status = 'merged') = (merged_into_restaurant_id IS NOT NULL)
  )
);
```

merge chain cycle은 단일 row CHECK로 막을 수 없으므로 merge command의 recursive lookup과 주기적 integrity job으로 검사한다.

### 7.2 `core.branch`

주요 column:

| column | type | null | 설명 |
|---|---|---:|---|
| `id` | uuid | N | 내부 UUIDv7 |
| `public_id` | text | N | 외부 불투명 ID |
| `restaurant_id` | uuid | N | 음식점 정체성 |
| `branch_name` | text | Y | 본점·지점 구분명 |
| `display_name` | text | N | 현재 공개 표시명 |
| `slug` | text | N | SEO 조각, ID가 아님 |
| `primary_category_id` | uuid | Y | 대표 장르 |
| `timezone` | text | N | IANA zone |
| `operational_status` | text | N | canonical 상태 |
| `status_effective_at` | timestamptz | N | 상태 기준 |
| `opened_on` | date | Y | 알려진 개업일 |
| `closed_on` | date | Y | 알려진 폐업일 |
| `moved_to_branch_id` | uuid | Y | 새 지점 |
| `data_confidence` | numeric(5,4) | N | 0~1 |
| `version` | bigint | N | aggregate version |

핵심 CHECK:

```sql
CHECK (data_confidence >= 0 AND data_confidence <= 1)
CHECK (opened_on IS NULL OR closed_on IS NULL OR opened_on <= closed_on)
CHECK (moved_to_branch_id IS DISTINCT FROM id)
CHECK ((operational_status = 'moved') = (moved_to_branch_id IS NOT NULL))
```

`slug`는 rename될 수 있으므로 URL의 영구 식별자가 아니다. `(slug, public_id)` 또는 redirect table로 과거 slug를 보존한다.

### 7.3 `core.branch_location_history`

주소와 좌표의 유효기간은 `[)` 반개구간으로 저장한다.

```sql
CREATE TABLE core.branch_location_history (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  branch_id uuid NOT NULL REFERENCES core.branch(id),
  road_address text NULL,
  lot_address text NULL,
  address_detail text NULL,
  postal_code text NULL,
  region_code text NULL,
  point geography(Point, 4326) NULL,
  entrance_point geography(Point, 4326) NULL,
  valid_period tstzrange NOT NULL,
  source_assertion_id uuid NULL,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT branch_location_nonempty_period CHECK (NOT isempty(valid_period)),
  CONSTRAINT branch_location_has_address_or_point CHECK (
    road_address IS NOT NULL OR lot_address IS NOT NULL OR point IS NOT NULL
  )
);
```

주 위치 중복 방지:

```sql
ALTER TABLE core.branch_location_history
ADD CONSTRAINT branch_primary_location_no_overlap
EXCLUDE USING gist (
  branch_id WITH =,
  valid_period WITH &&
)
WHERE (is_primary);
```

현재 위치 query는 `valid_period @> statement_timestamp()`를 사용한다. 같은 transaction 안에서 일관된 기준 시각을 유지한다.

공간 인덱스:

```sql
CREATE INDEX branch_location_point_gist
ON core.branch_location_history
USING gist (point)
WHERE point IS NOT NULL AND is_primary;
```

반경 필터는 `ST_DWithin(point, :center, :meters)`를 사용한다. `ST_Distance(...) < :meters`만으로 먼저 필터링하지 않는다.

### 7.4 category

- `category.code`는 stable unique key다.
- `parent_id` self-reference는 self-parent를 CHECK로 막는다.
- tree cycle은 write command와 integrity job으로 검사한다.
- `branch_category` PK는 `(branch_id, category_id, role)` 후보지만 동일 category를 여러 role로 허용할지 정책을 먼저 확정한다.
- 한 지점에 active primary category 하나만 허용한다면 partial unique index를 사용한다.

```sql
CREATE UNIQUE INDEX branch_one_primary_category
ON core.branch_category (branch_id)
WHERE role = 'primary' AND valid_to IS NULL;
```

partial index predicate와 실제 query 조건이 일치해야 index를 사용할 수 있으므로 repository query를 고정한다.

### 7.5 business license

`private.business_license_secret`과 `core.business_license`를 분리한다.

```text
core.business_license
  id
  licensing_authority
  business_type_code
  permit_date
  closure_date
  license_status
  raw_source_record_id

private.business_license_secret
  business_license_id
  license_number_ciphertext
  license_number_lookup_hash
  encryption_key_version
```

- 암호화 key는 DB column에 저장하지 않는다.
- lookup hash는 tenant가 없더라도 목적별 pepper/key version을 가진다.
- 원문 번호를 로그·event·검색 document에 넣지 않는다.
- active `(licensing_authority, lookup_hash)` unique 여부는 공공 원천의 재발급·중복 사례를 조사한 뒤 결정한다.

### 7.6 source와 assertion

`ingestion.raw_source_record`는 원본 재현성을 위해 append 중심으로 운영한다.

필수 column:

```text
source_id
source_record_key
source_version
fetched_at
effective_at
payload_schema_version
payload_object_ref 또는 제한된 payload_jsonb
payload_hash
processing_status
supersedes_record_id
```

unique 후보:

```text
(source_id, source_record_key, source_version)
(source_id, payload_hash) — 원천 성격에 따라
```

큰 raw payload와 민감 원문은 DB JSONB 대신 암호화 object storage 참조로 분리한다.

---

## 8. 영업시간과 메뉴

### 8.1 영업시간

정기 규칙과 날짜 예외를 분리한다.

`business_hours_rule`:

- `branch_id`
- `day_of_week` 1~7
- `service_type`
- `opens_at`, `closes_at`
- `spans_next_day`
- `valid_period daterange`
- `source_assertion_id`

CHECK:

```text
day_of_week BETWEEN 1 AND 7
opens_at <> closes_at unless explicit 24-hour flag
spans_next_day=false이면 opens_at < closes_at
```

자정 이후 영업은 다음 날 row로 쪼개 의미를 잃지 않고 `spans_next_day`로 표현한다. UI용 오늘 영업 여부는 지점 timezone과 예외를 적용한 read model에서 계산한다.

### 8.2 메뉴 revision

점주·사용자·공공 원천의 변경안을 바로 현재 menu에 덮지 않는다.

```text
menu
  current_revision_id

menu_revision
  menu_id
  revision_number
  source_type/source_id
  publication_status
  valid_period

menu_item
  stable item identity

menu_item_revision
  item_id
  menu_revision_id
  name
  description
  amount_minor
  currency
  availability_status
```

금액 CHECK:

```sql
CHECK (amount_minor IS NULL OR amount_minor >= 0)
CHECK ((amount_minor IS NULL) = (currency IS NULL))
```

가격 미정과 무료를 구분한다. 통화는 대문자 ISO 4217 3자 code로 application allowlist와 DB shape check를 함께 쓴다.

---

## 9. 계정·identity·session

### 9.1 `identity.user_account`

직접 식별정보를 넣지 않는다.

```text
id uuid PK
account_status text
trust_state text
locale text
timezone text
version bigint
created_at
closed_at
```

계정 종료 시 row는 곧바로 삭제하지 않고 identity link 제거, content 정책 적용, 법정 보존 분리를 orchestration한다.

### 9.2 `private.user_identity`

```text
id
user_account_id
provider
provider_subject_ciphertext
provider_subject_lookup_hash
email_ciphertext
email_lookup_hash
phone_ciphertext
phone_lookup_hash
key_version
verified_at
revoked_at
```

활성 provider identity unique:

```sql
CREATE UNIQUE INDEX active_provider_identity_unique
ON private.user_identity (provider, provider_subject_lookup_hash)
WHERE revoked_at IS NULL;
```

이메일 hash 일치를 계정 자동 연결 근거로 사용하지 않는다. lookup은 복구·중복 안내 같은 승인된 목적에만 사용한다.

### 9.3 session과 refresh credential

- access token 원문을 DB에 저장하지 않는다.
- refresh token은 원문이 아니라 강한 hash만 저장한다.
- session family별 active rotation을 constraint와 transaction으로 보호한다.
- 소비된 refresh credential은 재사용 탐지를 위해 제한 기간 보존한다.
- revoke는 session과 family 범위를 구분한다.

인덱스 후보:

```text
auth_session(user_account_id, revoked_at, idle_expires_at)
refresh_credential(token_hash) UNIQUE
refresh_credential(session_id, rotation_counter) UNIQUE
```

만료 row 대량 삭제는 작은 batch와 인덱스 기반 sweep으로 수행한다.

---

## 10. 리뷰·방문·미디어

### 10.1 visit

방문과 리뷰를 일대일로 강제하지 않는다. 리뷰 없이 개인 방문 기록이 있을 수 있고, 정책상 한 방문에서 하나의 공개 리뷰만 허용할 수 있다.

```text
visit
  id
  user_account_id
  branch_id
  visited_on
  visited_at nullable
  source_type
  visibility
  verification_summary
  created_at
```

같은 사용자가 같은 날 같은 지점을 여러 번 방문할 수 있으므로 `(user, branch, visited_on)` unique를 두지 않는다. 부정 중복은 risk signal로 판단한다.

### 10.2 review와 revision

```text
content.review
  id, public_id
  user_account_id
  branch_id
  visit_id
  publication_status
  active_revision_id
  eligibility_status
  version
  created_at, published_at, withdrawn_at

content.review_revision
  id
  review_id
  revision_number
  body
  language_tag
  edit_reason
  moderation_status
  created_at
```

constraint:

```text
(review_id, revision_number) UNIQUE
active_revision_id는 같은 review의 revision이어야 함 — deferred trigger 또는 command 검증
published_at은 published 상태에서만 non-null
withdrawn_at은 withdrawn/deleted 계열에서만 non-null
```

cross-row ownership을 보장하기 위해 `(review_id, id)` composite unique를 revision에 두고 review의 `(id, active_revision_id)` composite FK를 검토한다. ORM 편의보다 DB 불변식을 우선하되 cyclic insert 순서를 test한다.

### 10.3 rating input

```sql
rating numeric(2,1) NOT NULL,
CONSTRAINT review_rating_range CHECK (rating BETWEEN 1.0 AND 5.0),
CONSTRAINT review_rating_step CHECK ((rating * 2) = trunc(rating * 2))
```

카테고리별 rating을 허용할 경우 `(review_id, rating_dimension)`을 unique로 둔다. 공개 점수 계산이 사용하는 row는 publication과 eligibility를 join하여 명시적으로 선별한다.

### 10.4 reaction

```text
PRIMARY KEY (review_id, user_account_id, reaction_type)
```

actor가 여러 reaction 중 하나만 선택해야 하면 PK를 `(review_id, user_account_id)`로 하고 `reaction_type`을 값으로 둔다. 제품 정책 확정 전 다중 반응을 허용하는 schema로 고정하지 않는다.

### 10.5 media

논리 asset과 object storage object를 분리한다.

- `content.media_asset`: 상태, 권리, 검수, 공개 식별자
- `private.media_object`: bucket/key, encryption key ref, quarantine/evidence
- `content.media_variant`: 공개 파생본 metadata
- `content.media_link`: 공개 콘텐츠 관계
- `private.verification_evidence`: 방문·claim 증빙 참조

`bucket_ref + object_key`는 unique로 보호하되 외부 API에 노출하지 않는다. object 삭제는 DB row 삭제보다 늦을 수 있으므로 deletion job state와 tombstone을 둔다.

---

## 11. 점주 조직과 권한

### 11.1 membership

조직 구성원 이력은 유효기간으로 관리한다.

```text
owner.organization_member
  organization_id
  user_account_id
  role
  status
  valid_period
  invited_by
  accepted_at
```

같은 조직·사용자·역할의 활성 기간 중복은 exclusion constraint로 차단한다. 지점 범위는 JSON 배열이 아니라 relation table로 둔다.

```text
owner.member_branch_scope
  membership_id
  branch_id
  permission_ceiling
```

### 11.2 claim과 authority

claim은 심사 사건이고 authority는 현재 권한이다.

- claim 승인 transaction에서 authority 생성과 outbox를 함께 commit한다.
- claim 철회가 과거 승인 기록을 삭제하지 않는다.
- authority valid period가 겹칠 수 있는 역할과 배타적 역할을 구분한다.
- `source_claim_id` 없는 수동 authority는 별도 승인·사유를 요구한다.
- 구독 entitlement가 claim 또는 기본 정보 수정 권한을 만들지 않는다.

### 11.3 공개 draft

점주 변경안은 `owner.branch_change_proposal`에 저장한다. 공개 `core.branch`를 직접 수정한 뒤 검수에서 되돌리는 흐름을 피한다.

```text
proposal
  target_type/id
  base_version
  patch_json
  patch_schema_version
  status
  submitted_by_membership_id
  reviewed_by
  decision_reason
```

patch JSON의 field allowlist와 schema를 애플리케이션에서 검증하고, 승인 시 현재 version과 다시 비교한다.

---

## 12. 예약·재고·결제

### 12.1 aggregate 경계

- 예약 가능 규칙은 `booking_policy` version을 참조한다.
- 예약은 예약 시점의 정책·가격 snapshot을 보존한다.
- 연락처는 `private.reservation_contact`에 격리한다.
- 결제사 토큰과 카드 원문을 저장하지 않는다.
- 예약 상태와 결제 상태를 하나의 enum으로 합치지 않는다.

### 12.2 slot과 hold

초기 capacity 기반 모델:

```text
reservation_slot
  id
  branch_id
  service_starts_at
  service_ends_at
  party_size_min/max
  capacity_total
  capacity_reserved
  version

reservation_hold
  id
  slot_id
  user_account_id/session_reference
  party_size
  status
  expires_at
  idempotency_key_id
```

CHECK:

```text
capacity_total >= 0
capacity_reserved BETWEEN 0 AND capacity_total
party_size > 0
service_starts_at < service_ends_at
expires_at > created_at at creation — cross-time validation in command
```

hold 획득은 `SELECT ... FOR UPDATE` 또는 조건부 atomic update로 oversell을 막는다. advisory lock을 기본 정합성 수단으로 삼지 않는다.

### 12.3 resource allocation

테이블·룸 자원을 실제 배정할 때는 점유 기간 overlap을 막는다.

```sql
EXCLUDE USING gist (
  resource_id WITH =,
  occupancy_period WITH &&
)
WHERE (allocation_status IN ('held', 'confirmed', 'seated'))
```

정책상 겹칠 수 있는 공유 자원 또는 capacity 자원에는 같은 exclusion을 적용하지 않는다. 자원 유형별 allocator 전략을 분리한다.

### 12.4 reservation

주요 unique:

- `public_id`
- `(user_account_id, idempotency_key_id)` 또는 중앙 idempotency scope
- 공급자 예약 참조 `(provider, external_reference)` active unique

상태 변경은 current row update, `reservation_status_history` insert, outbox insert를 하나의 transaction으로 처리한다.

### 12.5 연락처

```text
private.reservation_contact
  reservation_id PK
  name_ciphertext
  phone_ciphertext
  email_ciphertext
  key_version
  retention_until
  deleted_at
```

점주 화면에는 예약 수행에 필요한 기간과 scope에서만 복호화한다. 예약 event에는 연락처를 싣지 않는다.

### 12.6 결제 ledger

공급자 시도와 도락의 금전 상태를 분리한다.

```text
payment_intent
payment_attempt
payment_transaction
refund
provider_webhook_delivery
```

규칙:

- amount는 `amount_minor bigint`, currency와 항상 함께 존재
- 음수 이동은 임의 update가 아니라 transaction type/reversal로 표현
- provider event ID는 unique
- webhook receipt와 domain application 상태를 분리
- charge/refund 합계 불변식은 transaction과 reconciliation job으로 검증
- 공급자 성공 callback만 믿지 않고 필요한 경우 조회·대조

---

## 13. 평점·랭킹·추천 파생 테이블

### 13.1 branch score

```text
trust.branch_score
  branch_id
  score_type
  model_version_id
  input_cutoff_at
  score numeric(4,2)
  review_count
  confidence_band
  publication_status
  valid_period
  calculation_run_id
```

한 지점·score type에 active public score 하나만 존재하도록 exclusion 또는 partial unique index를 둔다.

공개 점수 CHECK:

```sql
CHECK (score IS NULL OR score BETWEEN 1.00 AND 5.00)
CHECK (review_count >= 0)
```

점수가 없는 상태와 0점을 구분한다. 모델 version과 input cutoff 없이 score를 게시하지 않는다.

### 13.2 model artifact

- 모델 설정 JSON에는 schema version과 content hash를 둔다.
- artifact object reference와 checksum을 보존한다.
- 같은 model version을 in-place 수정하지 않는다.
- `active` 전환은 approval record와 transaction으로 처리한다.
- 재계산 결과가 review 원장을 수정하지 않는다.

### 13.3 추천

추천 snapshot과 impression은 재생성·보존 목적이 다르다.

- preference snapshot: 짧은 TTL, 계정 삭제 전파
- branch feature: source version과 재생성 가능
- request: 최소 의사결정 metadata
- impression: placement·노출 자격·position

광고 placement는 유사한 column을 갖더라도 organic recommendation table과 분리한다.

---

## 14. Outbox와 idempotency

### 14.1 `platform.outbox_event`

```sql
CREATE TABLE platform.outbox_event (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  event_type text NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL CHECK (aggregate_version > 0),
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL,
  available_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  published_at timestamptz NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code text NULL,
  trace_id text NULL,
  correlation_id text NULL,
  causation_id text NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (aggregate_type, aggregate_id, aggregate_version, event_type)
);
```

동일 aggregate version에 여러 event type이 가능하다면 unique key에 event sequence를 추가한다. 실제 aggregate command 정책을 먼저 고정한다.

claim index:

```sql
CREATE INDEX outbox_ready_unpublished
ON platform.outbox_event (available_at, id)
WHERE published_at IS NULL;
```

worker는 짧은 transaction에서 `FOR UPDATE SKIP LOCKED`로 batch를 claim한다. 네트워크 publish를 긴 DB transaction 안에 묶지 않는다.

### 14.2 publish 상태

`published_at`은 broker가 영구 수락했음을 의미한다. consumer 처리를 뜻하지 않는다. attempt 오류 원문에 payload/비밀을 넣지 않는다.

### 14.3 idempotency record

```text
platform.idempotency_record
  actor_scope_hash
  operation
  key_hash
  request_digest
  status
  response_status
  response_reference 또는 제한된 response snapshot
  locked_until
  expires_at
```

unique: `(actor_scope_hash, operation, key_hash)`.

같은 key와 다른 request digest는 거부한다. 개인정보가 포함된 response body 전체를 장기 저장하지 않고 결과 resource 참조로 재구성하는 방식을 우선한다.

### 14.4 consumer deduplication

소비자는 자신의 side effect와 dedup row를 가능한 한 같은 transaction으로 commit한다.

```text
platform.consumed_event
  consumer_name
  event_id
  consumed_at
  result_digest

PRIMARY KEY (consumer_name, event_id)
```

오래된 dedup row 제거는 producer replay 가능 기간보다 길게 보존해야 한다.

---

## 15. 감사·운영 사건

### 15.1 audit log

감사 log에는 변경한 값의 원문 대신 허용된 metadata와 digest를 둔다.

```text
id
actor_type/actor_id
effective_actor_id
action
target_type/target_id
reason_code
request_id/session_id
before_digest/after_digest
sensitivity_class
occurred_at
retention_class
```

append-only는 application convention만으로 끝내지 않는다.

- runtime API role에 UPDATE/DELETE 권한 없음
- 별도 audit writer 함수 또는 role
- archive와 object lock 검토
- 정기 integrity digest 또는 외부 보관
- break-glass 접근 자체도 별도 감사

### 15.2 case

모더레이션, claim, 개인정보, 결제 사건은 하나의 범용 JSON case에 합치지 않는다. 공통 routing metadata는 `operations_case`, 도메인별 결정과 증빙은 별도 table에 둔다.

### 15.3 legal hold

`legal_hold boolean`만 여러 table에 흩뿌리지 않는다.

```text
private.legal_hold
  id
  subject_type/id
  scope
  authority_reference
  placed_by/approved_by
  placed_at
  released_at
```

삭제 job은 active hold를 조회하고 skip 사유를 감사한다. hold가 원래 접근 권한을 넓히지는 않는다.

---

## 16. Foreign key와 삭제 정책

### 16.1 기본값

기본 FK 삭제 행동은 `RESTRICT`/`NO ACTION`이다. 편의상 `ON DELETE CASCADE`를 광범위하게 쓰지 않는다.

### 16.2 CASCADE 허용 후보

- aggregate 내부에서 독립 의미가 없는 임시 child
- 만료된 upload session의 part
- 아직 공개되지 않은 draft의 일회성 field
- 테스트용 격리 데이터

### 16.3 CASCADE 금지 후보

- review, reservation, payment
- score snapshot과 model version
- audit, moderation decision, appeal
- business license/source record
- outbox와 consumed event
- owner claim과 authority history

### 16.4 계정 종료

`user_account` hard delete cascade를 사용하지 않는다. 종료 workflow가 identity 제거, 프로필 비공개, 콘텐츠 선택, 거래 제한 보관, analytics 삭제 요청을 단계별 수행한다.

### 16.5 병합

branch/restaurant merge 시 모든 FK를 즉시 target으로 update하지 않는다.

- source와 target을 merge record로 연결
- public resolution은 canonical target으로 redirect
- review·reservation history의 original target 보존
- 파생 검색·score는 정책에 따라 재구성
- 잘못된 merge를 되돌릴 mapping 보존

---

## 17. 인덱스 청사진

### 17.1 원칙

- PK와 unique constraint가 만드는 index를 중복 생성하지 않는다.
- multi-column B-tree는 equality, range, sort 순서를 query와 함께 설계한다.
- partial index는 실제 WHERE predicate가 의미상·문법상 맞는 repository query에만 사용한다.
- INCLUDE는 index-only scan 이득과 write 비용을 측정한다.
- low-cardinality status 단독 index를 피한다.
- foreign key child column은 삭제·join query를 고려해 필요한 index를 명시한다.

### 17.2 foundation 후보

```text
branch(public_id) UNIQUE
branch(restaurant_id, operational_status)
branch(normalized_name gin_trgm_ops) GIN — 후보 생성 성능 검증
branch_location_history(point) GiST partial current/public 후보
branch_category(category_id, branch_id)
business_license_link(business_license_id, valid_to)
raw_source_record(source_id, source_record_key, fetched_at DESC)
```

현재 시각을 partial index predicate에 직접 넣지 않는다. `now()`는 immutable이 아니고 시간이 지나면 index membership이 자동으로 바뀌지 않는다. `valid_to IS NULL`처럼 write 시 갱신되는 current marker를 함께 둘지 검토한다.

### 17.3 content 후보

```text
review(public_id) UNIQUE
review(branch_id, published_at DESC, id) WHERE publication_status='published'
review(user_account_id, created_at DESC, id)
review_revision(review_id, revision_number) UNIQUE
media_link(target_type, target_id, role, sort_order)
report(status, priority, created_at)
```

polymorphic `(target_type, target_id)`는 FK를 보장하지 못한다. 고위험 관계는 target별 relation table을 우선하고, 범용 link는 integrity job과 command allowlist로 보완한다.

### 17.4 booking 후보

```text
reservation(public_id) UNIQUE
reservation(branch_id, service_starts_at, status)
reservation(user_account_id, created_at DESC)
reservation_hold(slot_id, status, expires_at)
payment_attempt(payment_intent_id, created_at DESC)
provider_webhook_delivery(provider, provider_event_id) UNIQUE
```

### 17.5 index 검증

각 index PR은 다음을 첨부한다.

- representative query
- expected cardinality와 데이터 분포
- 기존/신규 `EXPLAIN (ANALYZE, BUFFERS)`
- index size 예상 또는 측정
- write TPS 영향
- rollback/drop 계획
- production에서 사용 여부를 확인할 지표

---

## 18. 파티셔닝

### 18.1 초기 정책

Foundation 단계의 핵심 entity는 파티셔닝하지 않는다. 단일 table과 적절한 index로 시작한다. 지역별 branch/review partition은 금지한다.

### 18.2 후보

시간 기반으로 append되고 보존·archive 경계가 분명한 table만 후보로 둔다.

- `audit.audit_log`
- `ingestion.raw_source_record`
- `platform.outbox_event`
- `platform.consumed_event`
- `notification.delivery_attempt`
- `analytics.search_event`
- `trust.rating_calculation_input`
- `booking.reservation_status_history`

### 18.3 도입 gate

다음 중 하나 이상을 측정하고 운영 이득이 복잡도보다 클 때 도입한다.

- vacuum/autovacuum이 SLO를 반복 침해
- retention delete가 장시간 lock·WAL을 유발
- index가 memory/cache 전략을 지속적으로 압박
- 월별 archive/drop이 명확한 비용 절감
- query가 시간 범위로 안정적으로 prune 가능

### 18.4 주의

- partition key가 unique/primary key 제약에 미치는 영향을 확인한다.
- 전역 unique가 필요하면 key에 partition key를 포함하거나 별도 registry를 사용한다.
- default partition을 무기한 쓰지 않는다.
- 새 partition 사전 생성, 권한, index, backup을 자동화한다.
- prepared statement와 parameter에서 pruning이 실제 동작하는지 측정한다.
- 너무 작은 partition을 많이 만들지 않는다.

---

## 19. 트랜잭션 경계

### 19.1 command transaction

중요 command는 다음을 하나의 DB transaction으로 처리한다.

```text
현재 row/version 확인
권한에 필요한 안정된 관계 조회
aggregate 상태 변경
명시적 history/revision 추가
outbox event 추가
최소 audit record 추가
commit
```

외부 HTTP, object upload, 문자, 결제사 호출을 열린 DB transaction 안에서 수행하지 않는다.

### 19.2 isolation

기본 `READ COMMITTED`로 시작하되 다음은 명시적 lock/conditional update/더 높은 isolation을 검토한다.

- 예약 capacity와 resource allocation
- 결제 capture/refund 상태 전이
- 동일 지점 merge
- 점주 authority의 배타적 승인
- 모델 active version 전환

`SERIALIZABLE`을 사용하면 serialization failure 재시도와 멱등성을 함께 구현한다.

### 19.3 lock 순서

다중 row command는 canonical lock 순서를 정한다.

- UUID lexical order 또는 도메인 순서
- source branch → target branch merge 순서 고정
- reservation → payment intent 등 aggregate order 고정
- deadlock을 정상 재시도 가능한 오류로 분류

### 19.4 긴 작업

대규모 import, media 처리, score 계산을 단일 transaction으로 묶지 않는다. checkpoint와 batch ID를 사용하고 부분 완료를 재시작 가능하게 한다.

---

## 20. Migration 규칙

### 20.1 파일

```text
db/migrations/
  000001_extensions.sql
  000002_schemas_roles.sql
  000003_foundation_tables.sql
  000004_foundation_constraints.sql
  000005_foundation_indexes.sql
```

- 적용된 migration을 수정하지 않는다.
- timestamp만으로 충돌하기보다 단조 sequence와 설명을 사용한다.
- DDL과 backfill을 필요하면 분리한다.
- migration checksum을 환경별로 확인한다.

### 20.2 expand-migrate-contract

column rename 예:

1. 새 nullable column 추가
2. 새 코드가 구·신 둘 다 읽도록 배포
3. dual write 또는 DB trigger를 제한 기간 사용
4. batch backfill
5. completeness·equality 검산
6. 새 column read 전환
7. 구 write 중단
8. 한 개 이상의 안전 배포 창 후 NOT NULL/제거

### 20.3 안전한 DDL

- 큰 table의 default/NOT NULL 동작을 대상 PostgreSQL에서 검증한다.
- index는 필요한 경우 `CREATE INDEX CONCURRENTLY`를 사용하고 transaction 제약을 반영한다.
- foreign key는 `NOT VALID` 추가 후 검증하는 흐름을 검토한다.
- lock timeout과 statement timeout을 migration별 설정한다.
- 예상 lock, table rewrite, WAL, replica lag을 dry-run한다.
- 실패한 concurrent index의 invalid artifact를 탐지·정리한다.

### 20.4 backfill

- primary key range 또는 안정 cursor로 작은 batch
- pause/resume 가능한 checkpoint
- rate limit과 replica lag 중단 조건
- source/target count만이 아니라 hash·불변식 검산
- 재실행 가능한 idempotent update
- 진행률, 오류, 예상 완료 시각 관측
- application dual-read 제거 전에 100% 완료 증거

### 20.5 rollback

모든 DDL을 down migration으로 되돌리는 것을 강제하지 않는다. 데이터 손실 가능성이 있으면 forward fix와 feature rollback을 우선한다. destructive contract phase 전에는 복원점과 검산 query가 있어야 한다.

---

## 21. Drizzle 사용 경계

- 일반 table, column, 관계, 단순 index는 Drizzle schema에 표현한다.
- PostGIS, exclusion constraint, partial index, 복잡한 CHECK는 명시적 SQL migration을 허용한다.
- Drizzle schema와 적용된 migration을 둘 다 검증하되 DB가 최종 실행 원본이다.
- ORM cascade 설정이 DB FK 행동과 다르지 않게 test한다.
- relation helper가 실제 FK를 만들었다고 가정하지 않는다.
- raw SQL query에는 typed adapter와 parameter binding을 사용한다.
- generated migration을 검토 없이 적용하지 않는다.
- production schema drift를 introspection으로 탐지한다.

DB entity type을 OpenAPI DTO로 export하지 않는다. mapping 경계는 [CONTRACTS_AND_SCHEMAS.md](./CONTRACTS_AND_SCHEMAS.md)를 따른다.

---

## 22. 데이터 품질 constraint matrix

| 불변식 | DB | application | 비동기 검사 |
|---|---:|---:|---:|
| 리뷰 점수 범위·0.5 간격 | ✓ | ✓ | ✓ |
| 공개 리뷰 actor 권한 |  | ✓ | ✓ |
| 주 위치 기간 비중복 | ✓ | ✓ | ✓ |
| branch merge cycle 없음 | 일부 | ✓ | ✓ |
| 한 identity가 한 활성 계정에 연결 | ✓ | ✓ | ✓ |
| 이메일 일치 자동 연결 금지 |  | ✓ | 감사 |
| 예약 capacity 초과 없음 | ✓/조건부 update | ✓ | 대조 |
| 공급자 event 중복 없음 | ✓ | ✓ | ✓ |
| score가 승인 model version 사용 | FK | ✓ | ✓ |
| 광고가 organic score input에 없음 | schema 분리 | ✓ | lineage audit |
| 공개 DTO에 private field 없음 |  | mapper | 계약 test |
| media object와 DB tombstone 정합 |  | workflow | sweeper |
| outbox aggregate 순서 gap 없음 | unique 일부 | ✓ | monitor |

DB에서 못 막는 규칙은 누가 언제 어떻게 검사하는지 반드시 남긴다.

---

## 23. 백업·복구와 데이터 수명

### 23.1 백업 범주

- primary database PITR
- migration artifact와 schema digest
- 암호화 key version metadata
- object storage와 DB reference 대조
- 검색 index는 원장에서 재생성 가능, 별도 RTO 전략
- 분석 warehouse는 수집 원본과 목적별 복구 정책

### 23.2 복원 검증

백업 성공 알림만으로 완료가 아니다.

- 격리 환경 복원
- extension과 role·grant 확인
- 핵심 count와 checksum
- branch → search rebuild 검증
- encryption key 접근 검증
- 예약·결제 reconciliation
- outbox 재발송 side effect 차단
- 목표 RPO/RTO 측정

### 23.3 retention job

보존 만료 삭제는 다음 순서를 따른다.

1. 정책과 legal hold 확인
2. dependency와 파생 복제 식별
3. 작은 batch로 삭제/익명화
4. object·cache·검색·분석 삭제 전파
5. 완료 증거와 실패 재시도
6. 집계 재식별 위험 재검토

---

## 24. 성능·용량 검증

### 24.1 초기 데이터 fixture

개발의 수백 row로 query를 승인하지 않는다. synthetic dataset에 다음 분포를 포함한다.

- 전국 지점 수 규모
- 수도권 고밀도 좌표
- 프랜차이즈 동일·유사 상호
- 폐업·이전·중복 후보
- 리뷰 없는 지점 다수와 인기 지점 long tail
- 한 지점의 많은 리뷰·사진
- 시간대별 예약 집중
- 큰 원천 import batch

### 24.2 대표 query

- 좌표 반경 + category + 상태 검색 후보
- 지점 공개 상세 읽기
- 지점의 최신 공개 리뷰 cursor 목록
- 사용자의 최근 저장·리뷰
- 운영 중복 후보 queue
- 점주 조직의 지점 권한 resolve
- 예약 slot capacity update
- 미발행 outbox batch claim
- 보존 만료 evidence sweep

### 24.3 기준

query별 latency만 보지 않는다.

- rows examined/returned
- shared buffer hit/read
- temp spill
- lock wait
- WAL bytes
- CPU와 I/O
- plan 안정성
- concurrent writer 영향
- connection pool 점유 시간

---

## 25. 구현 단계

### Phase 0: DB harness

1. PostgreSQL 18 + PostGIS local container
2. migration runner와 checksum
3. extension allowlist
4. role/grant smoke test
5. Drizzle schema와 SQL migration 공존 규칙
6. schema dump·drift CI

완료 조건:

- 빈 DB와 production-like snapshot 모두에 migration이 적용된다.
- runtime role이 DDL·private schema에 과도한 권한을 갖지 않는다.
- downgrade가 아니라 forward-fix rehearsal을 실행할 수 있다.

### Phase 1: Foundation

1. source/raw record
2. restaurant/branch/location
3. license 격리
4. category
5. assertion/change proposal
6. outbox/audit
7. 공간·정규화 검색 index

완료 조건:

- 같은 원천을 두 번 ingest해도 canonical row가 중복되지 않는다.
- 한 지점의 현재 주 위치가 두 개 생기지 않는다.
- 반경 query가 GiST를 사용한다.
- 변경과 outbox가 원자적으로 commit된다.

### Phase 2: Identity·Trust

1. 계정·identity·session
2. visit·evidence
3. review·revision·rating
4. media metadata
5. score snapshot
6. moderation case

완료 조건:

- private role 경계가 integration test에서 강제된다.
- 리뷰 공개와 점수 적격성이 독립적으로 표현된다.
- 과거 revision과 score model version을 재현한다.

### Phase 3: Owner·Booking

1. organization·membership·authority
2. change proposal
3. policy·slot·hold
4. reservation·contact 격리
5. payment·refund·webhook dedup
6. reconciliation

완료 조건:

- 동시 hold가 capacity를 초과하지 않는다.
- 같은 idempotency key가 예약을 중복 생성하지 않는다.
- 점주 권한 해제가 새 요청에 즉시 반영되고 과거 감사는 유지된다.

---

## 26. migration PR 체크리스트

### 의미

- [ ] 개념 모델과 column 의미가 일치하는가?
- [ ] nullable의 의미가 정의됐는가?
- [ ] 상태, 미정, 삭제를 NULL 하나로 표현하지 않는가?
- [ ] current와 history가 필요한 이유가 명확한가?

### 정합성

- [ ] PK, FK, unique, check, exclusion이 충분한가?
- [ ] cascade target이 명확하고 회복 가능한가?
- [ ] cross-row invariant의 application/비동기 보완이 있는가?
- [ ] duplicate·retry·concurrency test가 있는가?

### 개인정보

- [ ] schema/role 경계가 맞는가?
- [ ] 암호문, lookup hash, key version이 분리됐는가?
- [ ] 로그·outbox·검색으로 복제되지 않는가?
- [ ] 보존·legal hold·삭제 전파가 정의됐는가?

### 성능

- [ ] 실제 query와 index가 함께 검토됐는가?
- [ ] table rewrite·lock·WAL 영향이 측정됐는가?
- [ ] backfill이 pause/resume·재실행 가능한가?
- [ ] plan과 partial predicate가 production query에 맞는가?

### 배포

- [ ] 이전·새 앱 버전의 호환성이 검증됐는가?
- [ ] rollout, 검산, 중단, forward-fix가 있는가?
- [ ] replica lag과 connection pool 중단 조건이 있는가?
- [ ] schema dump와 생성 타입 drift가 없는가?

---

## 27. 미해결 결정

| 항목 | 초기 방향 | 결정 gate |
|---|---|---|
| public ID alphabet·길이 | prefix + 128-bit CSPRNG | ID package spike |
| PostgreSQL minor | 18.x 최신 보안 patch | 첫 환경 생성 |
| PostGIS minor | 관리형 호환 안정판 | 공급자 선택 |
| collation/ICU 설정 | 환경 고정·한글 fixture 검증 | DB bootstrap |
| current period 표현 | range + 필요 시 `valid_to IS NULL` marker | 첫 location query |
| RLS 범위 | 보조 통제, owner 후보 | owner vertical slice |
| raw payload DB/object 경계 | 크기·민감도 기반 | ingestion benchmark |
| review active revision FK | composite FK 또는 deferred trigger | review migration spike |
| 예약 allocator | capacity conditional update 우선 | 부하·상품 규칙 검증 |
| partition threshold | 지표 기반, 초기 미도입 | 운영 데이터 측정 |
| schema migration tool | Drizzle + 명시 SQL 재현성 비교 | monorepo scaffold |

---

## 28. 공식 기준 자료

- [PostgreSQL 18 UUID type](https://www.postgresql.org/docs/18/datatype-uuid.html)
- [PostgreSQL UUID functions](https://www.postgresql.org/docs/current/functions-uuid.html)
- [PostgreSQL data definition](https://www.postgresql.org/docs/current/ddl.html)
- [PostgreSQL range types and exclusion constraints](https://www.postgresql.org/docs/18/rangetypes.html)
- [PostgreSQL partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [PostGIS spatial indexes](https://postgis.net/documentation/faq/spatial-indexes/)
- [PostGIS ST_DWithin](https://postgis.net/docs/ST_DWithin.html)

`current` 링크는 설계 근거 확인용이다. 실제 migration과 운영 이미지는 검증한 PostgreSQL/PostGIS minor와 digest를 명시적으로 고정한다.
