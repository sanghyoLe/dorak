# 도락 음식점 데이터 수집·정규화·엔터티 해소 설계

> 실행 우선순위 안내: 현재는 선택한 1~2개 생활권과 우선 장르만 적재하며 PostgreSQL 안에서 검색 반영까지 처리한다. 전국 일괄 적재와 OpenSearch 색인은 [비용 우선 운영안](./COST_FIRST_ARCHITECTURE.md)의 확장 조건 이후 항목이다.

> 상태: 초안 v0.1  
> 범위: 공공·점주·사용자·파트너 데이터 수집, 원본 보존, 정규화, 중복 판정, 필드 출처, 품질 운영  
> 첫 구현: [FOUNDATION_VERTICAL_SLICE.md](./FOUNDATION_VERTICAL_SLICE.md)의 `FND-01`  
> 원칙: 외부 장소 ID나 최신 수집값을 진실로 사용하지 않고, 도락 내부 엔터티와 필드별 assertion을 관리한다.  
> 연관 문서: [DATA_MODEL.md](./DATA_MODEL.md), [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md), [OPERATIONS.md](../operations/OPERATIONS.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)

---

## 0. 현재 MVP 연결 방법

현재 구현은 서울시의 [일반음식점 인허가 정보](https://data.seoul.go.kr/dataList/OA-16094/A/1/datasetView.do)를 첫 번째 원장 출처로 사용한다. 이 데이터셋은 매일 갱신되며, 사업장명·영업상태·주소·업태·인허가 번호·전화번호·홈페이지·X/Y 좌표를 제공한다. X/Y는 EPSG:5174 중부원점 좌표이므로 가져오기 과정에서 PostGIS로 WGS84 위경도로 변환한다.

외부 장소 검색 결과를 무단으로 복제하지 않고, 내려받은 CSV를 운영자가 확인한 뒤 내부 `catalog.branches`에 upsert한다. 각 지점에는 `source_key`, `source_record_id`, `source_updated_at`, `last_verified_at`를 남겨 같은 인허가 레코드의 갱신이 기존 URL과 리뷰를 깨지 않게 한다. 폐업·주소 변경은 자동으로 새 식당을 만들지 않고 원본 상태를 다시 확인하는 운영 작업으로 남긴다.

대표 메뉴·가격·영업시간·사진은 이 CSV의 제공 필드가 아니다. 따라서 CSV에서 메뉴를 추정하거나 외부 지도/포털의 메뉴를 무단 복사하지 않는다. 메뉴가 확인되지 않은 지점은 공개 화면에서 비어 있는 메뉴 영역을 만들지 않고 `등록된 정보 없음`으로 표시한다. 이후 점주 등록, 사용자 제보, 운영자 확인으로 들어온 메뉴만 별도 출처와 확인 상태를 붙여 공개한다.

### 로컬 가져오기

서울열린데이터광장에서 전체 CSV를 내려받아 저장소 밖의 임시 경로에 둔다. 파일에는 개인정보나 사용자 리뷰를 추가하지 않는다.

```bash
DATABASE_URL=postgres://dorak:dorak_local_only@localhost:5432/dorak \
  pnpm data:import:seoul /absolute/path/seoul-general-restaurants.csv --limit=1000
```

`--limit`를 생략하면 CSV의 영업 중인 행을 모두 반영한다. 스크립트는 UTF-8과 EUC-KR CSV를 읽고, `관리번호/MGTNO`를 안정적인 외부 키로 사용한다. 주소와 좌표가 없는 행은 건너뛰며, 공개 화면에는 공공 인허가 데이터라는 출처와 기준일을 표시한다. 첫 실행은 `--limit=100`으로 변환·검색·지도 상태를 확인한 뒤 전체 적재한다.

기본값은 500건씩 커밋하며 `--batch-size=1..1000`으로 조정할 수 있다. 배치마다 독립적으로 upsert하므로 중단 후 같은 명령을 재실행해도 지점 ID와 리뷰 연결이 유지된다. 로컬 원장 DB는 `ingestion.raw_documents`에 원본 행을 보관한다.

Neon Free처럼 저장 공간이 제한된 클라우드에서는 검수한 원본 CSV를 별도 보관한 뒤 `--skip-raw`로 canonical branch만 적재한다. 이 모드는 출처 키·원천 레코드 ID·원천 갱신일은 유지하지만, 행별 JSON 사본을 DB에 중복 저장하지 않는다.

```bash
DATABASE_URL=postgresql://... pnpm data:import:seoul \
  /absolute/path/seoul-general-restaurants.csv \
  --batch-size=1000 --skip-raw
```

서울열린데이터광장 인증키가 있다면 같은 서비스의 JSON Open API를 직접 가져올 수도 있다. API는 한 번에 최대 1,000건씩 요청하므로 처음에는 제한을 둔다.

```bash
SEOUL_OPEN_DATA_KEY=발급받은키 DATABASE_URL=postgres://... \
  pnpm data:import:seoul --api --limit=1000
```

### 데이터 검증

적재 후에는 DB 원장 품질과 공개 API의 실제 응답을 각각 확인한다. DB 검증은 PostGIS·pg_trgm 확장, 서울 출처 등록, 활성 지점 필수 필드·좌표·출처 무결성, 중복 원천 키, 검색 텍스트, 운영 후보 큐의 관계 무결성을 검사한다.

```bash
DATABASE_URL=postgresql://... pnpm data:verify:seoul -- --sample-size=100
```

배포 환경에서는 공개 API가 PostgreSQL을 사용하고 있는지 확인한 뒤, 첫 100개 지점의 목록·상세·이름+동네 검색 응답을 대조한다. Vercel Deployment Protection을 사용하는 경우 보호 우회값은 셸 환경변수로만 주입한다. 운영 큐까지 확인할 때만 운영자 자격 증명을 추가한다.

```bash
DORAK_VERIFY_BASE_URL=https://배포도메인 \
  DORAK_VERIFY_EXPECTED_MODE=postgres \
  DORAK_VERIFY_PROTECTION_BYPASS=... \
  DORAK_VERIFY_OPS_REQUIRED=true \
  DORAK_VERIFY_OPS_USERNAME=... \
  DORAK_VERIFY_OPS_PASSWORD=... \
  pnpm data:verify:http -- --sample-size=100
```

검증기는 읽기 요청만 수행하며, 실패 시 종료 코드 1을 반환한다. `--json`을 붙이면 CI나 배포 기록에 저장할 수 있는 집계 JSON을 출력한다.

### 지도 연결

상세 페이지의 지도는 카카오 지도 JavaScript SDK를 사용한다. `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`는 공개 가능한 JavaScript 키이며, 카카오 개발자 콘솔에 로컬·배포 도메인을 등록해야 한다. 키나 좌표가 없을 때도 주소와 카카오맵 검색 링크를 보여주므로 지도가 빈 화면이 되지 않는다. 지도 사업자의 장소 목록을 도락 원장으로 저장하지 않고, 지도는 위치 표현과 이동 링크에만 사용한다.

---

## 1. 목적

도락의 음식점 원장은 지도 공급자의 장소 목록 복사본이 아니다. 여러 시점과 출처에서 들어오는 불완전하고 충돌하는 관측을 실제 음식점·지점 엔터티에 연결하고, 현재 공개할 사실을 증거와 이력으로 결정하는 시스템이다.

다음 문제를 해결한다.

- 같은 지점이 공공 데이터, 지도, 점주, 사용자 데이터에 각각 다른 이름으로 존재한다.
- 동일 전화·주소가 브랜드 본사, 공유 주방, 몰 지점에서 재사용될 수 있다.
- 폐업한 사업자 자리에 새 음식점이 들어와도 좌표와 전화가 같을 수 있다.
- 점주가 최신 영업시간을 알고 있지만 법적 상호는 공공 출처가 더 정확할 수 있다.
- 공급자가 ID나 약관·스키마를 바꿔도 내부 지점 ID와 사용자 콘텐츠가 유지되어야 한다.
- 자동 병합 오류가 리뷰·점수·예약·점주 권한을 다른 음식점으로 옮기지 않게 해야 한다.

---

## 2. 핵심 원칙

### 2.1 원본은 관측, 도락 엔터티는 해석이다

원천 레코드를 수정해서 정규화 결과로 만들지 않는다. 원본, 파싱 결과, 정규화 값, 매칭 결정, 공개 값을 계층으로 분리한다.

### 2.2 외부 ID를 내부 ID로 사용하지 않는다

카카오·네이버·공공 데이터의 장소 또는 인허가 ID는 `external_identifier`로 매핑한다. 공급자 병합·분리·삭제가 도락 `branchId`를 바꾸지 못하게 한다.

### 2.3 지점 정체성과 사업 허가를 동일시하지 않는다

한 지점이 허가 변경 후에도 같은 브랜드·공간·운영 정체성을 유지할 수 있고, 같은 허가나 주소 아래 여러 소비자 대상 콘셉트가 있을 수 있다.

### 2.4 최신값 우선이 아니라 근거 우선이다

최근 사용자 한 명의 폐업 제보가 오래된 공공 상태보다 중요할 수 있지만 즉시 확정할 수는 없다. 필드, 출처, 시점, 독립 확인, 위험에 따라 판단한다.

### 2.5 자동화의 비대칭 위험을 반영한다

중복을 놓치면 검색 결과가 나뉘지만 잘못 병합하면 리뷰·평점·예약·소유권이 오염된다. 불확실한 경우 별도 지점으로 두고 운영 검토를 우선한다.

### 2.6 모든 공개 값은 출처로 거슬러 올라갈 수 있어야 한다

공개 지점의 상호, 주소, 좌표, 영업 상태, 영업시간, 메뉴는 assertion과 원천 또는 점주·운영자 행위로 연결된다.

### 2.7 이용권과 보존 의무도 데이터다

수집 가능 여부, 표시 의무, 캐시·재배포 제한, 삭제 조건, 귀속 문구를 `data_source` 계약 메타데이터로 관리한다.

---

## 3. 데이터 계층

```text
Source
  ↓ fetch/webhook/upload/manual observation
Raw Record
  ↓ parse + schema validation
Staged Record
  ↓ normalization + enrichment
Normalized Candidate
  ↓ blocking + match scoring
Entity Resolution Decision
  ↓ field assertion evaluation
Canonical restaurant/branch view
  ↓ outbox
Search / API / analytics read models
```

각 계층은 이전 계층을 덮어쓰지 않는다.

---

## 4. 출처 유형

### 4.1 공공 데이터

후보:

- 식품 관련 영업 인허가·행정 정보
- 지번·도로명 주소와 행정구역
- 건물·좌표·우편번호
- 지자체 공개 데이터
- 공휴일과 행정 경계

장점:

- 전국 기반 coverage
- 법적 상태·주소의 근거
- 반복 수집 가능성

한계:

- 소비자 상호와 법적 상호 차이
- 반영 지연
- 좌표·전화·영업시간 부재 또는 품질 편차
- 지자체별 스키마 차이
- 허가 단위와 실제 음식점 단위 불일치

### 4.2 지도·장소 공급자

후보 데이터:

- 소비자 상호
- 좌표와 주소
- 카테고리
- 전화·웹 링크
- 일부 영업시간

계약과 약관이 허용하는 범위에서만 수집·캐시·표시한다. 검색 API 결과를 영구 원장으로 재배포할 수 있다고 가정하지 않는다.

### 4.3 점주

- 공식 상호·소개
- 영업시간·휴무
- 메뉴·가격·사진
- 편의시설
- 예약 정책
- 사업·위임 증빙

점주는 최신 운영 정보에 강하지만 자기 홍보와 검색 조작 가능성이 있다. 사실 정보와 editorial·광고를 구분한다.

### 4.4 사용자

- 신규 지점 제보
- 폐업·이전·임시 휴무
- 영업시간 수정
- 메뉴·가격 관측
- 사진
- 좌표·입구 보정

사용자 제보는 공개 리뷰와 별도 assertion으로 처리한다. 다수 제보가 같은 계정 군집에서 왔는지 독립성을 확인한다.

### 4.5 운영자·현장 검증

- 전화 확인
- 공식 웹사이트 확인
- 현장 표본
- 문서 검토
- 분쟁 결정

운영자 판단도 절대 사실이 아니라 행위자, 근거, 시각, 정책 버전을 가진 assertion이다.

### 4.6 파트너

- 예약 공급자
- POS
- 프랜차이즈 본사
- 메뉴·결제 파트너

파트너별 데이터 권한, 지점 범위, 갱신 계약, 삭제·정정 경로를 분리한다.

---

## 5. 출처 등록부

### 5.1 `data_source`

```text
id
name
source_type
provider
dataset_or_endpoint
owner_team
contract_owner
license_status
allowed_uses
display_attribution
storage_policy
redistribution_policy
retention_policy
geographic_scope
update_expectation
schema_version
quality_profile
credential_ref
status
reviewed_at
next_review_at
```

### 5.2 상태

```text
researching
approved_for_test
approved_for_production
restricted
paused
deprecated
terminated
```

`approved_for_test` 데이터를 공개 프로덕션에 자동 승격하지 않는다.

### 5.3 계약 체크리스트

- 수집·저장·캐시 허용
- 파생 데이터 생성 허용
- 공개 표시와 재배포 허용
- 사용자 콘텐츠와 결합 허용
- 귀속 문구·로고 요구
- 갱신·삭제 의무
- 하위 라이선스 제한
- 개인·위치정보 포함 여부
- 국외 이전·재위탁
- 종료 후 삭제·내보내기
- rate limit과 상업 이용

### 5.4 출처 kill switch

약관 문제, 품질 오염, 자격증명 침해가 생기면 출처별 수집과 공개 반영을 중지할 수 있어야 한다. 이미 파생된 공개 값의 처리 계획을 계약 유형별로 둔다.

---

## 6. 수집 방식

### 6.1 전체 스냅샷

정기 전체 파일 또는 페이지 수집이다.

장점:

- 누락·삭제 탐지
- 재현 가능한 기준 시점

주의:

- 전체 재수집이 모든 값을 최신으로 덮어쓰면 안 된다.
- 소스에서 사라졌다는 것과 폐업을 구분한다.
- 스냅샷 ID와 관측 시각을 기록한다.

### 6.2 증분 API

`updated_since`, 커서, 페이지를 이용한다.

- 커서와 마지막 성공 watermark를 별도 저장한다.
- 페이지 일부 실패 시 체크포인트에서 재개한다.
- 공급자 시각 오차를 고려해 겹치는 lookback 구간을 사용하고 중복 제거한다.
- 공급자가 과거 레코드를 수정할 수 있으므로 정기 전체 검산을 한다.

### 6.3 웹훅

- 서명 검증
- 이벤트 ID 중복 제거
- 원본 본문 보존
- 역순 이벤트 처리
- 이후 공급자 조회로 사실 확인 가능
- dead-letter와 재생

웹훅 수신 성공을 정규화·공개 반영 성공과 동일시하지 않는다.

### 6.4 점주·사용자 입력

API 폼 입력도 원천 레코드다.

- 입력자와 권한 문맥
- 기기·세션 위험 신호의 제한 참조
- 필드별 값
- 관측 또는 효력 시각
- 증빙
- 공개 동의·권리 확인
- 기존 엔터티 후보

### 6.5 파일 업로드

- 업로드 세션
- 악성 파일 검사
- 인코딩·구분자 탐지
- 스키마 매핑 미리보기
- dry-run
- 행별 결과
- 임계치 초과 시 중지
- 업로드 원본의 제한 보존

---

## 7. 원본 저장

### 7.1 `source_snapshot`

```text
id
data_source_id
started_at / completed_at
source_as_of
fetch_mode
request parameters hash
object manifest
record_count
content checksum
schema fingerprint
status
error summary
```

### 7.2 `raw_source_record`

```text
id
data_source_id
snapshot_id
external_record_key
external_version
observed_at
received_at
payload_ref or payload_json
payload_hash
schema_version
processing_status
supersedes_record_id
retention_until
```

### 7.3 불변성

원본은 수정하지 않고 새 버전을 추가한다. 파싱 오류 수정도 변환 코드 버전을 올려 재처리한다.

### 7.4 민감 데이터

공공 또는 파트너 레코드에 개인 전화·대표자명 등이 섞일 수 있다. 원본 저장 전에 데이터 분류하고 접근·암호화·보존을 분리한다. 공개 데이터라고 무기한 복제 가능한 개인정보라고 가정하지 않는다.

### 7.5 큰 객체

파일·이미지·대형 JSON은 객체 저장소에 두고 DB에는 해시·크기·참조를 저장한다. 버킷은 공개 미디어와 분리한다.

---

## 8. 수집 작업 상태

```text
scheduled
 -> fetching
 -> fetched
 -> validating
 -> staged
 -> normalizing
 -> resolving
 -> assertions_created
 -> completed

any -> retryable_failed
any -> quarantined
any -> terminal_failed
scheduled/fetching -> cancelled
```

각 단계는 입력·출력 개수, 오류 샘플, 코드 버전, 시작·종료 시각을 기록한다.

### 8.1 멱등성

동일 source snapshot과 raw record를 재처리해도 동일한 정규화 후보와 assertion으로 수렴한다. 자동 증가 ID 생성 자체를 처리 성공의 기준으로 삼지 않는다.

### 8.2 backpressure

대량 재수집이 사용자·예약 DB를 압박하지 않게 큐, 배치 크기, 연결 풀, 색인 속도를 제한한다. 긴급 점주 변경은 배치 backfill보다 높은 우선순위를 가질 수 있다.

---

## 9. 스키마 탐지와 검증

### 9.1 원천 스키마 계약

```text
field name
type
required/optional
format
known enum
example
privacy class
normalization rule
```

### 9.2 drift 탐지

- 필드 추가·삭제
- 타입 변경
- enum 새 값
- null률 급변
- 문자열 길이 급변
- 날짜 형식 변화
- 좌표 순서 반전
- 페이지 레코드 수 급변
- 외부 키 중복 증가

### 9.3 drift 대응

알 수 없는 필드를 무시할 수 있지만 필수 필드 삭제나 타입 변경은 해당 출처 반영을 격리한다. 이전 파서로 잘못 해석해 공개 값을 오염시키지 않는다.

### 9.4 quarantine

```text
raw_record_id
failure_stage
error_code
safe diagnostic
parser_version
first_seen / last_seen
retry_count
resolution status
```

오류 payload 원문을 일반 로그에 복사하지 않는다.

---

## 10. 문자열 정규화

### 10.1 원본과 정규화 값

```text
raw: "  도락 라-멘　성수점 "
display candidate: "도락 라멘 성수점"
match key: "도락라멘성수점"
tokens: [도락, 라멘, 성수점]
```

사용자 표시를 match key로 대체하지 않는다.

### 10.2 상호 정규화

- Unicode normalization
- 전각·반각 통일
- 공백·구두점 정규화
- 괄호와 지점 표기 분리
- 법인 표기 분리
- 흔한 업태 접두·접미의 별도 토큰
- 숫자·로마 숫자 정규화
- 한글·영문·일문 표기 보존

### 10.3 과도한 정규화 금지

다음은 다른 지점일 수 있다.

- 본점 / 2호점
- 신관 / 본관
- 백화점 층별 매장
- 같은 브랜드의 카페와 레스토랑
- 공유 주방의 여러 가상 브랜드

지점 표기를 제거한 match key 하나로 자동 병합하지 않는다.

### 10.4 별칭

별칭 출처:

- 점주 공식
- 브랜드 규칙
- 검색 로그에서 운영 승인
- 다국어 표기
- 흔한 약칭

별칭이 다른 실재 음식점 상호를 가로채지 않는지 검토한다.

---

## 11. 주소 정규화

### 11.1 구조

```text
country
postal_code
administrative_area levels
road_name
building_main/sub_number
lot_main/sub_number
building_name
floor
unit
freeform_detail
normalized_full_address
address_reference_id
```

### 11.2 도로명·지번

둘 중 하나를 버리지 않는다. 공공 주소 참조로 같은 건물에 연결하고 원천 표기를 유지한다.

### 11.3 층·호수

대형 몰과 푸드코트에서는 층·구역이 지점 구분에 중요하다. 숫자만 추출하지 말고 `B1`, `지하1층`, `별관 3F`를 구조화·원문 보존한다.

### 11.4 주소 해소 상태

```text
exact
building
road_segment
administrative_area
unresolved
conflicting
```

건물 수준 좌표를 정확한 입구 좌표처럼 표시하지 않는다.

---

## 12. 좌표와 지오코딩

### 12.1 좌표 관측

```text
latitude / longitude
coordinate_reference_system
source
precision type
accuracy meters
observed_at
method
```

### 12.2 정밀도 유형

```text
entrance
storefront
building_centroid
parcel_centroid
road_interpolation
administrative_centroid
manual_unknown
```

### 12.3 후보 비교

- 주소 해소 결과와 거리
- 건물 경계 포함 여부
- 다른 독립 공급자 일치
- 사용자 입구 보정
- 비정상 좌표: 바다, 행정구역 밖, 0/0
- 위도·경도 순서 반전 가능성

### 12.4 지도 공급자 경계

지오코딩 결과의 저장·표시가 약관상 허용되는지 공급자별로 확인한다. 공급자 간 좌표를 무단 결합해 재배포하지 않는다.

### 12.5 좌표 변경

큰 거리 이동은 단순 업데이트가 아니라 `moved`, 잘못된 매칭, 주소 정정 후보로 보낸다. 활성 리뷰와 예약을 새 좌표로 조용히 이동하지 않는다.

---

## 13. 전화·URL 정규화

### 13.1 전화

- 국가 코드가 있는 표준 표현
- 내선 분리
- 표시용 국내 형식 별도
- 원문 보존
- 예약 대표번호·본사번호·개인번호 분류
- 공개 가능 여부

전화번호는 강한 매칭 신호지만 유일키가 아니다. 몰 대표번호, 콜센터, 번호 재사용이 있다.

### 13.2 URL

- scheme·host 정규화
- 추적 파라미터 제거
- 공식 사이트, 예약, 소셜, 배달 링크 유형
- redirect와 도메인 소유 확인
- 악성 URL 검사

점주가 제출한 링크가 공식인지 검증하고 검색 순위용 키워드 페이지를 공식 홈페이지로 승인하지 않는다.

---

## 14. 카테고리 정규화

### 14.1 내부 taxonomy

외부 공급자 카테고리를 공개 내부 taxonomy로 그대로 쓰지 않는다.

```text
category
category hierarchy
source category mapping
mapping version
branch-category assertion
primary/secondary
confidence
```

### 14.2 다중 분류

한 지점은 `라멘`, `일식`, `면요리`를 가질 수 있다. 사용자 탐색의 대표 장르와 법적 업태를 분리한다.

### 14.3 매핑 변경

taxonomy 버전이 바뀌면 과거 assertion을 삭제하지 않고 새 파생 매핑을 생성한다. 검색·평점 장르 비교의 버전과 맞춘다.

### 14.4 점주·사용자 태그

자유 태그가 내부 카테고리로 즉시 승격되지 않는다. 메뉴, 리뷰, 점주 정보, 운영 검토를 결합해 제안한다.

---

## 15. 영업시간 정규화

### 15.1 표현

```text
day-of-week or date
service type
opens_local_time
closes_local_time
crosses_midnight
last_order
break interval
valid period
timezone
source and observed_at
```

### 15.2 자연어

`매달 둘째 화요일 휴무`, `재료 소진 시 마감` 같은 표현은 구조화 가능한 규칙과 자유 설명을 분리한다. 구조화 실패를 잘못된 고정 시간으로 만들지 않는다.

### 15.3 충돌

- 점주 특정일 예외 > 정기 시간
- 최근 현장 확인 > 오래된 일반 정보
- 공공 허가의 영업 가능 시간 ≠ 실제 소비자 영업시간
- 외부 배달 시간 ≠ 매장 식사 시간

### 15.4 최신성

영업시간에는 확인 시각과 신뢰도를 둔다. 오래된 값은 사라지게 하지 않고 사용자에게 확인 필요 상태를 표시하거나 점주·사용자 재확인을 요청한다.

---

## 16. 엔터티 해소 대상

### 16.1 `brand`

상표·운영 브랜드 묶음. 동일한 이름만으로 브랜드를 만들지 않는다.

### 16.2 `restaurant`

음식점 콘셉트·정체성. 독립점도 branch와 분리할지 정책에 따라 유지하지만 소비자 행동은 branch에 연결한다.

### 16.3 `branch`

사용자가 실제 방문하는 장소·영업 단위. 리뷰, 저장, 예약, 점수의 대상이다.

### 16.4 `business_license`

법적 영업 허가·신고 관측. 지점과 1:1이라고 가정하지 않는다.

### 16.5 `location`

주소·건물·좌표 참조. 동일 위치에 시간에 따라 여러 지점이 존재할 수 있다.

---

## 17. 후보 생성 `blocking`

전국 모든 레코드 쌍을 비교하지 않는다. 다음 키로 후보군을 만든다.

- 같은 정규화 전화
- 같은 공공 허가 ID
- 같은 건물 + 유사 상호
- 일정 반경 + 유사 상호/카테고리
- 같은 공식 도메인 + 지역
- 브랜드 별칭 + 지점 토큰
- 같은 주소 참조 + 층/호수
- 공급자가 명시한 이전·대체 관계

여러 blocking 전략의 합집합을 사용해 한 키의 누락에 의존하지 않는다.

### 17.1 대규모 건물

백화점·몰·공항·역사는 반경과 주소만으로 후보가 너무 많아진다. 건물 ID, 층, 점포 번호, 브랜드 토큰을 강화한다.

### 17.2 농어촌·주소 품질 낮은 지역

넓은 반경, 전화, 상호, 행정구역을 조합하되 자동 병합 임계치를 더 보수적으로 둔다.

---

## 18. 매칭 특징

### 18.1 긍정 신호

- 동일한 안정적 외부 ID 매핑
- 정규화 상호의 강한 유사도
- 지점 토큰 일치
- 동일 전화
- 동일 건물·층·호수
- 매우 가까운 좌표
- 동일 공식 URL
- 카테고리·메뉴 일치
- 시간적으로 연속된 관측

### 18.2 부정 신호

- 다른 층·호수
- 동시에 영업하는 다른 상호
- 서로 다른 사업 정체성·브랜드
- 카테고리의 큰 충돌
- 거리 임계치 초과
- 다른 전화와 다른 공식 사이트
- 공공 허가 기간이 겹치는 별도 사업자
- 리뷰·사진에서 명백히 다른 공간

### 18.3 약한 신호

- 같은 행정동
- 공통적인 상호 단어 `맛집`, `카페`
- 몰 대표 전화
- 건물 centroid 좌표
- 동일 업종

약한 신호를 합쳐 자동 병합하지 않도록 상한을 둔다.

---

## 19. 매칭 점수와 결정

설명 가능한 초기 모델:

```text
match_score =
  name_similarity
  + branch_token_match
  + address_match
  + geo_proximity
  + phone_match
  + official_url_match
  + license_link
  + category_consistency
  + temporal_continuity
  - coexisting_entity_penalty
  - floor_unit_conflict
  - identity_conflict
```

결정 구간:

```text
high confidence + no hard conflict -> auto_link candidate or safe assertion
medium confidence -> human review
low confidence -> create/keep separate
hard conflict -> do not merge, investigate relationship
```

정확한 임계치는 지역·출처별 라벨 데이터로 보정한다.

### 19.1 비대칭 손실

```text
false merge cost > missed duplicate cost
```

특히 공개 리뷰, 점주 claim, 활성 예약이 있는 지점의 자동 병합을 금지하거나 임계치를 매우 높인다.

### 19.2 모델 버전

```text
resolution_model_version
feature snapshot
candidate pair
score
decision
decision actor
explanation codes
```

향후 ML 모델을 사용해도 결정 재현과 운영자 설명 코드를 유지한다.

---

## 20. 정체성 변화

### 20.1 동일 지점 업데이트

- 표기 교정
- 전화 변경
- 메뉴 개편
- 내부 인테리어 변경
- 같은 상권 내 경미한 위치 보정

### 20.2 이전 `moved`

같은 음식점 정체성이 다른 주소로 이동한다. 이전 지점의 과거 리뷰가 새 위치 경험을 그대로 대표하는지 정책이 필요하다.

기본 모델:

- 이전 위치 branch는 `moved`
- 새 위치 branch 생성
- `moved_to` 관계
- restaurant 정체성 연결 가능
- 새 위치 점수는 과거 리뷰를 자동 합산하지 않는 방향 우선

### 20.3 재개업

같은 주소·상호라도 운영자·메뉴·공간이 크게 바뀔 수 있다.

판단 입력:

- 폐업 기간
- 사업자·허가 변화
- 브랜드·메뉴 연속성
- 점주 진술
- 공식 공지
- 사진·리뷰 관측

정체성 단절이면 새 branch를 만든다.

### 20.4 리브랜딩

같은 사업·메뉴가 이름만 바뀐 경우 name history로 관리할 수 있다. 완전히 다른 콘셉트면 새 restaurant/branch 관계를 검토한다.

### 20.5 공유 주방·가상 브랜드

같은 주소·전화·주방이라도 소비자에게 별도 브랜드로 판매될 수 있다. 배달 전용과 방문 가능한 지점을 구분하고 지도 방문 대상으로 잘못 노출하지 않는다.

---

## 21. assertion 모델

### 21.1 구조

```text
id
subject_type and subject_id
field_path
proposed_value
normalized_value
source_type and source_id
raw_record_id
observed_at
effective_from / effective_to
confidence
status
decision_rule_version
decided_by
decision_reason
supersedes_assertion_id
```

### 21.2 상태

```text
pending
accepted
rejected
superseded
expired
withdrawn
```

### 21.3 필드별 결정

지점 레코드 전체를 하나의 출처가 소유하지 않는다.

예:

```text
legal_name <- public license
display_name <- owner + storefront observation
today_special_hours <- verified owner
coordinate <- high-precision field verification
category <- derived from menu + source mapping + review
```

### 21.4 파생 assertion

여러 입력으로 계산한 값은 `source_type=derived`와 입력 assertion 목록, 규칙 버전을 갖는다. 원본처럼 보이게 하지 않는다.

### 21.5 시간 효력

미래 휴무나 예정 개업은 `effective_from`까지 현재 값이 아니다. 예약 검색과 공개 상세는 조회 시점과 영업일에 맞는 assertion을 선택한다.

---

## 22. 필드 선택 정책

개념적인 선택 함수:

```text
eligible assertions
 -> filter by effective time and status
 -> validate source usage rights
 -> apply field-specific source reliability
 -> apply freshness decay
 -> combine independent corroboration
 -> detect unresolved conflict
 -> choose value or expose unknown/conflict
```

### 22.1 신뢰도 요소

```text
source baseline
field-specific accuracy history
observation freshness
verification strength
independent corroboration
actor authority
anomaly risk
```

### 22.2 인기 투표 금지

같은 공급자 데이터를 복제한 여러 사이트가 같은 값을 준다고 독립 확인 세 건으로 세지 않는다. 데이터 계보를 가능한 범위에서 추적한다.

### 22.3 모르는 값

충돌이 해결되지 않았으면 값 하나를 임의 선택하는 대신 `unknown` 또는 `confirmation_needed`를 표시할 수 있다. 사용자 경험에서 ‘정보 없음’과 ‘휴무’를 구분한다.

---

## 23. 운영자 검수

### 23.1 큐

```text
new branch candidate
possible duplicate
hard identity conflict
closure/reopen
move/rebrand
coordinate conflict
owner/public source conflict
high-impact bulk change
source schema anomaly
```

### 23.2 검수 화면

- 지도와 거리
- 시간순 원천 관측
- 필드별 비교
- 정규화 전 원문
- 이름·주소·전화 유사도
- 사업 허가 기간
- 리뷰·사진·예약·점주 권한 영향 개수
- 모델 설명 코드
- 과거 결정과 되돌림

### 23.3 결정

```text
link to existing branch
create new branch
link license only
mark possible relation
merge branches
mark moved/rebranded
request more evidence
reject source record
```

### 23.4 품질 표본

자동 결정과 사람 결정 모두 표본 검수한다. 검토자가 모델 점수를 보기 전에 독립 판단하는 blind sample도 사용해 자동화 편향을 측정한다.

---

## 24. 병합

### 24.1 병합 전 조건

- 두 branch가 실제로 같은 소비자 대상 영업 단위인지
- 시간상 동시에 존재하지 않았는지
- 활성 예약이 있는지
- 서로 다른 점주 claim이 있는지
- 리뷰·사진이 같은 장소인지
- 외부 ID가 충돌하는지
- 병합 후 점수 변화가 어느 정도인지

### 24.2 병합 계획

```text
survivor branch
source branches
field winners and conflicts
relationship moves
redirects
score/search recomputation
owner authority resolution
reservation handling
audit and snapshot
rollback/compensation plan
```

### 24.3 실행

대량 관계를 한 트랜잭션에 무리하게 옮기지 않는다. 병합 계획 ID와 체크포인트를 사용하되 소비자에게 중간 혼합 상태가 보이지 않도록 canonical redirect 또는 읽기 계층을 설계한다.

### 24.4 병합 후 검증

- orphan 관계 없음
- 리뷰·방문·저장 수 보존
- 활성 예약 대상 검증
- 점주 권한 검증
- 검색 redirect와 상세
- 점수 재계산
- 외부 ID 유일성

---

## 25. 분리와 복구

잘못된 병합은 단순 undo가 아니다.

### 25.1 입력

- 병합 전 스냅샷
- 병합 이후 생성·수정된 관계
- 사용자·점주 제보
- 각 콘텐츠의 branch 증거
- 활성 예약

### 25.2 분리 계획

각 리뷰·사진·저장·claim·예약에 대해:

```text
return to original
stay with survivor
move to restored/new branch
requires review
cannot determine
```

### 25.3 사용자 영향

리뷰 귀속이 바뀌면 작성자가 볼 수 있게 기록하고 이의 경로를 제공한다. 예약 귀속은 임의 자동 이동하지 않고 운영자가 실제 지점과 확인한다.

---

## 26. 삭제·누락·폐업 신호

### 26.1 소스에서 사라짐

다음 중 하나일 수 있다.

- 실제 폐업
- API 페이지 누락
- 데이터셋 정책 변경
- 공급자 자체 병합
- 일시적 장애
- 수집 버그

한 번의 누락으로 폐업 처리하지 않는다.

### 26.2 폐업 신호

- 공공 폐업 상태
- 인증 점주 확인
- 공식 공지
- 전화 불통
- 최근 다수 독립 사용자 제보
- 장기간 예약·영업 신호 없음
- 새 사업자의 같은 위치 관측

### 26.3 상태 결정

```text
open
temporarily_closed
closed
moved
unknown
```

폐업 신뢰도가 낮으면 `unknown` 또는 확인 필요로 두고 소비자 행동을 안내한다.

### 26.4 역사 보존

폐업 branch를 삭제하지 않는다. 검색 기본 결과에서는 제한하되 직접 링크, 리뷰 기록, 이전 관계를 정책대로 유지한다.

---

## 27. 변경 이벤트와 읽기 모델

### 27.1 도메인 이벤트

```text
source.snapshot_completed
source.schema_drift_detected
raw_record.received
entity_candidate.created
entity_resolution.decided
assertion.created
assertion.accepted
branch.created
branch.updated
branch.status_changed
branch.merge_planned
branch.merged
branch.split
```

### 27.2 outbox

canonical branch 변경과 outbox 이벤트를 같은 DB 트랜잭션에서 기록한다.

소비자:

- 검색 indexer
- 공개 branch read model
- 데이터 품질 분석
- 점주 변경 이력
- 예약 영향 검사
- cache invalidation

### 27.3 버전

이벤트에는 aggregate version과 changed field paths를 포함한다. 검색 색인기가 오래된 이벤트로 최신 문서를 되돌리지 않게 한다.

### 27.4 재생성

원장 DB와 승인 assertion으로 검색·상세 읽기 모델을 전체 재생성할 수 있어야 한다. 파생 저장소만 가진 정보가 없어야 한다.

---

## 28. 검색 색인 연결

### 28.1 색인 자격

- 공개 가능한 branch
- 최소 상호와 위치
- 심각한 identity conflict 없음
- source license가 공개 색인 허용
- 정책상 숨김 아님

### 28.2 필드 신뢰

검색 문서에는 구조화 값과 함께 필요한 경우 confidence·verified timestamp를 넣는다. 낮은 신뢰 태그를 강한 필터 사실로 사용하지 않는다.

### 28.3 이름과 별칭

- 현재 공개 상호
- 과거 상호, 제한 기간
- 브랜드명
- 지점명
- 승인 별칭
- 다국어 표기
- 초성/정규화 파생 필드

폐업·이전 상호로 검색하면 새 지점 관계를 설명할 수 있다.

### 28.4 예약 가능성

원장 수집 데이터가 아니라 예약 도메인의 파생 필드다. 외부 공급자의 `예약 가능` 표시는 출처와 최신성 없이 자체 즉시 예약으로 변환하지 않는다.

---

## 29. 데이터 품질 지표

### 29.1 수집

- 예정 대비 성공 snapshot
- source freshness lag
- raw record 수 급변
- API rate limit·오류
- schema drift
- quarantine 비율

### 29.2 정규화

- 주소 exact/building/unresolved 비율
- 좌표 precision 분포
- 전화·URL 유효성
- 카테고리 unmapped 비율
- 영업시간 parse 성공률

### 29.3 엔터티 해소

- 자동 연결·사람 검토·신규 생성 비율
- 검수 표본 false merge
- missed duplicate 추정
- 후보 큐 연령
- 출처·지역별 매칭 정확도
- 병합 후 되돌림

### 29.4 공개 원장

- 핵심 필드 완성도
- 필드별 최신성
- unresolved conflict
- 중복 branch 비율
- 폐업 반영 시간
- 사용자 수정 제보 처리 시간
- 지점당 출처 다양성

### 29.5 층화

전국 평균만 보지 않고 지역, 카테고리, 독립점/체인, 몰/거리, 출처로 나눈다. 데이터가 쉬운 서울 인기 지역만 정확한 상태를 숨기지 않는다.

---

## 30. 이상 탐지와 경보

```text
source record count drops > threshold
new enum/schema field
coordinates shift to one centroid
same phone mapped to abnormal number of branches
mass closure/reopen assertions
owner updates spike across unrelated branches
match auto-link rate changes abruptly
public field coverage drops
searchable branches drop
outbox/index lag
```

대량 폐업 같은 위험 변경은 자동 공개 반영 전에 canary 지역 또는 dry-run 차이를 확인한다.

---

## 31. 개인정보·보안

### 31.1 데이터 분류

- 공개 사업 정보
- 계약 제한 공급자 데이터
- 개인 연락처·대표자 정보
- 점주 인증 증빙
- 사용자 위치·사진 메타데이터
- 내부 매칭·부정행위 신호

공개 원장의 전화와 사업 서류 속 개인 전화는 같은 취급이 아니다.

### 31.2 자격증명

- source별 비밀 관리
- 최소 scope
- 개발·운영 분리
- 정기 회전
- 사용량 이상 탐지
- 요청·응답 로그에서 제거

### 31.3 공급자 원문 로그

오류 분석을 위해 전체 응답을 일반 로그에 남기지 않는다. raw 저장소의 제한 참조와 안전한 필드만 로그에 둔다.

### 31.4 삭제 전파

공급자 계약 종료, 개인정보 요청, 잘못 수집된 데이터 삭제 시 다음을 추적한다.

```text
raw object
staged records
assertions
canonical values
search index
cache
analytics
backups/restore tombstone
```

---

## 32. 테스트 전략

### 32.1 고정 fixture

다음 어려운 사례를 포함한다.

- 같은 이름의 인접 식당
- 몰 내 같은 브랜드 복수 지점
- 전화 공유
- 이전·재개업
- 프랜차이즈 본사 번호
- 지번·도로명 불일치
- 지하·층·호수
- 자정 넘는 영업시간
- 한글·영문·일문 혼용
- 공유 주방·가상 브랜드
- 폐업 뒤 새 업종

### 32.2 속성 테스트

- 정규화를 반복해도 결과 동일
- 원문 손실 없음
- 좌표 범위 유효
- accepted assertion 효력 구간의 불가능한 중첩 방지
- 외부 ID mapping 범위 유일성
- 같은 snapshot 재처리 시 중복 없음

### 32.3 golden set

사람이 검수한 branch pair와 필드 값을 지역·출처별로 유지한다. 모델 변경 전후 precision/recall과 위험 false merge를 비교한다.

### 32.4 회귀 테스트

매칭 규칙 변경이 이미 사람이 확정한 분리·병합 사례를 뒤집는지 shadow로 확인한다.

### 32.5 복원력

- API 페이지 중간 실패
- 커서 만료
- 동일 webhook 중복·역순
- raw 객체 저장 실패
- queue 지연
- schema drift
- 색인 장애
- 대량 재처리 중 프로덕션 변경

---

## 33. backfill과 마이그레이션

### 33.1 계획

```text
code/model version
source and date range
estimated records
expected writes/events
dry-run sample
rate limits
checkpoint
kill switch
validation queries
rollback/compensation
owner and window
```

### 33.2 shadow output

새 정규화·매칭 결과를 기존 canonical에 바로 쓰지 않고 shadow 테이블에서 차이를 비교한다.

```text
new branches
links changed
merges proposed
field winners changed
searchable status changed
high-impact entities
```

### 33.3 배포

- 소수 출처/지역 canary
- 영향 임계치 자동 중지
- 샘플 검수
- 단계 확대
- 완료 후 불변식 검증

### 33.4 과거 재현

코드, 규칙, 모델, source snapshot 버전을 고정해 특정 공개 값이 왜 선택됐는지 재현할 수 있어야 한다.

---

## 34. 초기 구현 순서

### D0. 출처 연구

1. 후보 source 등록부
2. 이용 조건·필드·갱신 조사
3. 샘플 레코드
4. 개인정보·계약 분류
5. 테스트 승인

### D1. raw 기반

1. source snapshot
2. raw object/record
3. checksum과 멱등키
4. parser version
5. quarantine
6. 작업 관측성

### D2. 정규화

1. 상호
2. 주소·행정구역
3. 좌표
4. 전화·URL
5. 카테고리
6. 영업 상태와 시간

### D3. 엔터티 해소

1. blocking
2. 설명 가능한 match features
3. golden set
4. 보수적 자동 연결
5. 운영자 검수
6. branch·license 관계

### D4. assertion과 공개 원장

1. 필드 assertion
2. 선택 정책
3. 출처·변경 이력
4. branch read model
5. 검색 indexer
6. 사용자 수정 제보

### D5. 확장

1. 점주 공식 정보
2. 다중 지역·출처
3. 이전·재개업·분리
4. 현장 표본
5. 모델 기반 후보 추천
6. 파트너·예약·POS

---

## 35. 첫 수직 슬라이스

첫 구현은 한 지역의 약 1,000개 원천 레코드로 다음 흐름을 끝까지 만든다.

```text
source 등록
 -> snapshot 수집
 -> raw 저장
 -> 상호/주소 정규화
 -> branch 후보와 license 연결
 -> 운영자 중복 검수
 -> accepted assertions
 -> canonical branch
 -> OpenSearch 색인
 -> 웹 검색/상세
 -> 수정 제보
 -> assertion 재결정
 -> 검색 갱신
```

CSV를 한 번 정리해 DB에 넣는 방식은 수직 슬라이스 완료로 보지 않는다. 같은 source를 다시 수집하고 변경을 안전하게 반영할 수 있어야 한다.

---

## 36. 출시 체크리스트

- [ ] 모든 source의 허용 용도·보존·귀속이 등록되어 있다.
- [ ] raw, staged, canonical이 분리되어 있다.
- [ ] source schema drift가 공개 오염 전에 탐지된다.
- [ ] 외부 장소 ID가 내부 branch ID가 아니다.
- [ ] 지점과 사업 허가가 다대다 가능하다.
- [ ] false merge를 우선 억제하는 임계치가 검증된다.
- [ ] 리뷰·claim·예약이 있는 branch 자동 병합이 제한된다.
- [ ] 모든 공개 핵심 필드가 assertion으로 추적된다.
- [ ] 병합 영향 미리보기와 잘못된 병합 분리 계획이 있다.
- [ ] 폐업은 source 한 번 누락으로 확정되지 않는다.
- [ ] 검색 읽기 모델을 원장에서 재생성할 수 있다.
- [ ] 개인정보·계약 제한 원문이 일반 로그에 없다.
- [ ] 지역·출처별 품질 표본과 golden set이 있다.
- [ ] backfill이 dry-run, canary, kill switch를 갖는다.

---

## 37. 미결정 사항

- 초기 공공 데이터 source와 지역별 coverage
- 지도·지오코딩 주 공급자와 저장 권한
- address reference 데이터의 구체 공급자
- 독립점에서 restaurant와 branch를 모두 생성할지
- 자동 링크·병합의 지역별 임계치
- 과거 상호를 검색 별칭으로 유지할 기간
- 폐업·임시 휴업 판정의 최소 독립 신호
- 현장 검증 방식과 표본 크기
- 영업시간 자연어 파서의 초기 범위
- 점주 즉시 반영 필드
- 가상 브랜드의 지도 노출 정책
- ML entity resolution 도입을 정당화할 라벨 규모

---

## 38. 공식 후보 출처

실제 사용 전 각 데이터셋의 현재 이용 조건, 제공 필드, 갱신 주기, 재배포 허용 범위를 개별 검토한다.

- [식품안전나라 데이터활용서비스](https://www.foodsafetykorea.go.kr/api/main.do)
- [공공데이터포털](https://www.data.go.kr/)
- [도로명주소 개발자센터](https://business.juso.go.kr/addrlink/main.do)
- [국가공간정보포털](https://www.nsdi.go.kr/)
- [카카오 Local API](https://developers.kakao.com/docs/latest/ko/local/common)
- [네이버 지도 API](https://www.ncloud.com/product/applicationService/maps)

목록에 있다는 사실은 도락의 영구 저장·상업적 재배포 권한이 확인되었다는 뜻이 아니다.

---

## 39. 연관 문서

- [DATA_MODEL.md](./DATA_MODEL.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [TECH_STACK.md](./TECH_STACK.md)
- [ROADMAP.md](../product/ROADMAP.md)

## 40. 현재 서울 데이터 적재 현황

MVP의 기본 식당 마스터는 서울시 일반음식점 인허가 CSV를 사용한다. 원본 537,067건에서 영업 중인 일반음식점 120,285건만 canonical branch로 반영한다. 로컬 원장 DB는 원본 레코드를 `ingestion.raw_documents`에 보관하고, 비용 우선 클라우드 DB는 `--skip-raw`로 원본 CSV와 정규화 결과를 분리 보관한다.

2026-09-04 Preview Neon 적재 검증 결과는 다음과 같다.

- canonical branch: 120,285곳
- 지도 좌표: 120,285곳
- 전화번호: 41,880곳
- 메뉴: 12,484곳
- 영업시간: 16,026곳
- 휴무일: 6,980곳
- 전체 DB 사용량: 약 246MB (탐색·장르 인덱스 포함)
- migration·리뷰·PostGIS·UUIDv7·제약조건 smoke 통과

메뉴·운영 정보는 서울관광재단의 정적 파일데이터를 식당명과 구 단위로 보수적으로 매칭한다.

- 메뉴: [서울관광재단_다국어메뉴정보](https://www.data.go.kr/data/15097003/fileData.do), 2023-01 기준
- 운영: [서울관광재단_식당운영정보](https://www.data.go.kr/data/15098046/fileData.do), 2023-01 기준
- 운영시간·휴무일·메뉴 가격은 최신성을 보장하지 않으므로 `external_info_updated_at`을 표시 기준일로 사용한다.
- 이름·구 기준으로 유일하게 일치하는 경우에만 외부 정보를 반영하며, 애매한 매칭은 버린다.
- Redtable API는 인증 등록 오류가 해결될 때까지 필수 경로가 아닌 선택적 enrichment로 둔다.
