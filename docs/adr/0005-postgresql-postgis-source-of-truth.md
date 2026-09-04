# ADR-005: PostgreSQL + PostGIS를 트랜잭션 원장으로 사용

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Data Platform
- 검토자: Backend, Search, Booking, Privacy

## 맥락

도락은 음식점 정체성·출처·이력, 리뷰, 점주 권한, 예약 재고, 결제 참조를 일관되게 저장해야 한다. 지도 거리·경계 쿼리도 필요하다. 검색·캐시·분석 저장소는 유용하지만 최종 진실로 쓰면 관계와 거래 불변식이 분산된다.

## 결정 기준

- ACID 트랜잭션과 제약조건
- 관계·이력 모델
- 지리 연산
- 운영 성숙도·백업·복구
- 도구와 인력
- 파생 시스템 재생성

## 결정

PostgreSQL을 canonical source of truth로, PostGIS를 위치 타입·인덱스·연산에 사용한다.

원장 대상:

```text
restaurant/branch/provenance
account/permission
visit/review/moderation
rating version/snapshot metadata
booking/allocation
payment/refund references and movements
notification intents
operations/audit/outbox
```

OpenSearch, Redis, warehouse는 파생 또는 보조 저장소다.

## 대안

### MongoDB/document DB

유연한 문서에는 유리하지만 관계, 기간, 권한, 예약 제약과 지리/SQL 분석의 중심 원장으로 이점이 작다.

### 여러 polyglot 원장을 초기 도입

도메인별 최적화는 가능하지만 조정·백업·일관성·운영 비용이 크다.

### 지도 공급자 DB를 원장으로 사용

외부 ID·약관·스키마에 종속되고 내부 리뷰·예약 정체성을 안정적으로 유지할 수 없다.

## 긍정적 결과

- 관계·외래키·unique/exclusion 제약
- 예약과 outbox의 원자성
- PostGIS 거리·경계
- 성숙한 backup/PITR/replication
- 하나의 원장에서 검색·분석 재생성

## 부정적 결과

- 쓰기 확장과 hot table 관리 필요
- 큰 원본·미디어는 별도 객체 저장소 필요
- domain schema가 커질 수 있음
- 분석·검색 전용 query를 직접 수행하면 원장 부하

## 통제

- domain schema/table ownership
- 객체 저장소·검색·warehouse 분리
- connection budget
- read replica는 stale 허용 조회만
- migration expand/contract
- backup restore와 불변식 검증
- 개인정보 schema·역할 격리

## 검증

- reservation exclusion/conditional update prototype
- PostGIS viewport/nearby query plan
- 예상 규모 데이터의 index·partition 평가
- PITR restore game day
- OpenSearch 전체 재생성

## 재검토 조건

- 검증된 부하가 단일 write topology를 초과한다.
- 법률·보안상 별도 계정/DB가 필요하다.
- 독립 서비스가 자체 데이터 소유를 정당화한다.

## 되돌리기 비용

핵심 원장 교체는 매우 높다. 도메인별 추출은 outbox와 소유권 경계를 지키면 점진적으로 가능하다.

## 관련 문서

- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)

