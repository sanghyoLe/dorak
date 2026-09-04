# ADR-006: Drizzle ORM과 명시적 SQL 병행

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Backend/Data
- 검토자: Platform, Booking

## 맥락

도락의 일반 CRUD에는 타입 안전한 schema/query 도구가 유용하지만 PostGIS, range/exclusion constraint, 부분 인덱스, 복잡한 migration, 예약 동시성은 SQL을 숨기면 오히려 위험하다.

## 결정 기준

- TypeScript 타입 안전성
- SQL 가시성과 제어
- PostgreSQL/PostGIS 기능 접근
- migration 검토
- query 성능 진단
- 라이브러리 종속성

## 결정

Drizzle을 TypeScript schema와 일반 query의 기본 도구로 사용하되 명시적 SQL을 1급 구현 방식으로 허용·요구한다.

명시적 SQL 대상:

- PostGIS 타입·인덱스·함수
- range/exclusion constraint
- 부분·표현식 인덱스
- 복잡한 CTE/window query
- 동시성 조건부 update/lock
- online migration/backfill
- 성능이 중요한 읽기 모델

## 대안

### Prisma만 사용

생산성·생태계는 강하지만 고급 PostgreSQL 기능과 생성 migration을 우회하는 코드가 늘 가능성이 있다.

### raw SQL만 사용

제어는 최대지만 반복 mapping·타입·일반 CRUD 비용이 높다.

### TypeORM

성숙하지만 active record/data mapper abstraction과 migration 제어에서 현재 선호와 맞지 않는다.

## 긍정적 결과

- TypeScript schema와 query 타입
- SQL에 가까운 mental model
- 고급 DB 기능을 숨기지 않음
- query review와 EXPLAIN 가능

## 부정적 결과

- ORM query와 raw SQL 두 방식의 규약 필요
- schema 정의와 custom SQL migration drift 위험
- 팀이 PostgreSQL을 이해해야 함
- 도구의 version/migration 성숙도 검증 필요

## 통제

- migration 파일은 사람이 검토
- production auto-sync 금지
- SQL owner와 query test
- schema introspection/drift CI
- query plan baseline
- repository/application boundary에서 row를 domain으로 변환

## 검증

- PostGIS point/index migration
- 예약 overlap constraint
- assertion 유효기간 query
- zero-downtime column migration
- rollback/forward fix rehearsal

## 재검토 조건

- Drizzle이 핵심 migration·타입 안정성을 반복 저해한다.
- 팀 생산성 측정에서 다른 도구가 명확한 이득을 보인다.
- 서비스 언어·DB 경계가 변경된다.

## 되돌리기 비용

DB schema가 표준 SQL에 남으므로 ORM 교체 비용은 중간이다. domain 코드가 Drizzle row/type에 직접 결합하면 높아진다.

## 관련 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)

