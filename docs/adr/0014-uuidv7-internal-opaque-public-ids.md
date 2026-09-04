# ADR-014: UUIDv7 내부 키와 불투명 공개 ID 분리

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Data Platform
- 검토자: API Platform, Security, Backend

## 맥락

도락의 지점, 리뷰, 예약, 미디어 등은 database relation에 안정적인 내부 키가 필요하다. 동시에 URL과 API ID는 enumeration, 생성 시각 노출, entity 혼용을 줄이고 향후 storage migration과 무관해야 한다.

PostgreSQL 18은 RFC 9562 기반 UUIDv7 생성을 core에서 지원한다. UUIDv7은 시간 정렬 특성이 있지만 timestamp 성분 때문에 외부 비밀 식별자로 취급하기에는 부적절하다.

## 결정 기준

- 분산·batch 생성 가능성
- B-tree insert locality
- 외부 enumeration과 정보 노출
- entity type 식별과 디버깅
- API·DB 분리
- 생성기와 migration 단순성

## 결정

1. 주요 table의 내부 primary key는 PostgreSQL `uuid` 타입과 UUIDv7을 사용한다.
2. DB 생성이 적합한 row는 `DEFAULT uuidv7()`을 사용한다. 외부 producer가 만들 경우 RFC 9562 호환성을 test한다.
3. URL/API에 노출되는 주요 resource는 prefix와 CSPRNG 기반 최소 128-bit entropy를 가진 별도 `public_id`를 사용한다.
4. 내부 UUID를 공개 ID fallback으로 노출하지 않는다.
5. 공개 ID의 alphabet·길이·prefix는 중앙 ID package와 DB unique/shape constraint에서 관리한다.
6. UUID와 공개 ID 모두에서 생성 순서, 지역, shard, 권한을 추론하지 않는다.

초기 prefix:

```text
br_   branch
rv_   review
rsv_  reservation
lst_  list
med_  media asset
```

## 대안

### UUIDv4만 사용

단순하고 널리 지원되지만 대규모 B-tree insert locality가 상대적으로 낮다. 외부에 그대로 노출할 경우 entity 종류도 구분하기 어렵다.

### UUIDv7 하나를 내부·외부에 공용

column과 mapping이 줄지만 생성 시각 성분이 노출되고 API와 persistence가 결합된다.

### Auto-increment bigint

작고 빠르지만 분산·import 생성이 어렵고 외부 노출 시 enumeration이 쉽다.

### ULID

문자열 표현과 시간 정렬이 편하지만 PostgreSQL native UUID 연산·저장 장점을 잃거나 별도 변환 규칙이 필요하다. timestamp 노출 문제도 남는다.

### 공개 ID만 primary key로 사용

키가 하나지만 모든 FK와 index가 가변 길이 문자열에 종속되고 prefix가 storage 전체에 반복된다.

## 긍정적 결과

- 내부 FK와 index는 native UUID를 사용한다.
- 공개 ID로 내부 key와 생성 시각을 직접 노출하지 않는다.
- entity prefix로 운영·SDK 오류를 빠르게 식별한다.
- 공개 URL을 유지한 채 DB·merge 전략을 바꿀 수 있다.

## 부정적 결과

- 주요 resource마다 ID 두 개와 mapping이 필요하다.
- public ID 생성 package와 충돌 test가 필요하다.
- API 조회 시 public ID unique index lookup이 추가된다.
- prefix·alphabet 변경은 장기 호환성 비용이 크다.

## 보안·개인정보·운영 영향

- 공개 ID는 접근 제어를 대신하지 않는다.
- 로그에는 actor와 목적에 필요한 ID만 기록한다.
- 계정 내부 ID는 공개 프로필 식별자로 쓰지 않는다.
- ID 생성 실패와 unique collision은 관측하고 안전하게 재시도한다.
- UUIDv7에서 추출한 timestamp를 감사·업무 시각의 원본으로 사용하지 않는다.

## 구현과 검증

- PostgreSQL 18 `uuidv7()` smoke test
- public ID 최소 128-bit entropy와 형식 test
- 1천만 synthetic ID collision·분포 test
- 잘못된 prefix의 API validation test
- public ID lookup query plan
- import와 API가 만든 내부 UUID의 version 검증
- ORM/API mapper가 내부 UUID를 serialize하지 않는 allowlist test

## 재검토 조건

- PostgreSQL major/version 제약으로 UUIDv7 core 함수를 사용할 수 없다.
- 외부 표준이 특정 resource identifier 형식을 요구한다.
- 공개 ID index의 측정된 비용이 제품 SLO를 지속적으로 침해한다.
- 다중 region ID 생성에서 현재 규칙이 충돌·운영 문제를 만든다.

## 되돌리기 비용

내부 key 전략 변경은 모든 FK와 replication에 영향을 주므로 매우 높다. 공개 ID 형식 변경도 URL·앱·파트너 호환성 때문에 높다. 따라서 실제 코드 전 ID package와 migration spike를 완료한다.

## 관련 문서

- [DATABASE_SCHEMA_BLUEPRINT.md](../architecture/DATABASE_SCHEMA_BLUEPRINT.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [CONTRACTS_AND_SCHEMAS.md](../architecture/CONTRACTS_AND_SCHEMAS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
