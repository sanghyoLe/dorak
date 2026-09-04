# ADR-004: NestJS 모듈형 모놀리스 API

- 상태: Superseded by ADR-017
- 결정일: 2026-09-02
- owner: Backend
- 검토자: Platform, Data, Booking, Trust

> 2026-09-03: 개인 프로젝트의 초기 배포 단위를 하나의 Next.js 애플리케이션으로 줄이는 [ADR-017](./0017-cost-first-personal-project.md)이 이 결정의 초기 실행 방식을 대체했다. 이 문서의 모듈 경계와 향후 별도 API 서버 원칙은 확장 단계 참고로 보존한다.

## 맥락

도락은 음식점 원장, 계정, 리뷰, 평점, 점주, 예약, 운영 도메인을 가진다. 초기 팀과 트래픽에는 마이크로서비스 운영 비용이 크지만, 경계 없는 단일 서버는 예약·권한·데이터 책임을 뒤섞는다.

## 결정 기준

- 초기 개발·운영 단순성
- 도메인 경계
- 트랜잭션 일관성
- TypeScript/OpenAPI 생태계
- 테스트 가능성
- 향후 서비스 추출

## 결정

NestJS 기반 모듈형 모놀리스로 시작한다.

주요 모듈:

```text
registry
search
account
visit
review
rating-coordination
owner
booking
moderation
operations
notification
```

모듈은 application interface와 event contract로 통신한다. 다른 모듈 테이블을 임의 직접 수정하지 않는다.

## 대안

### 초기 마이크로서비스

독립 배포는 가능하지만 분산 트랜잭션, 관측성, 로컬 개발, 온콜 비용이 과도하다.

### 단순 Express/Fastify

가볍지만 큰 도메인의 모듈·DI·검증·OpenAPI 규약을 팀이 직접 구성해야 한다.

### Spring Boot/Kotlin

강한 타입·성숙한 생태계를 제공하지만 초기 팀의 TypeScript 통합과 개발 속도에서 NestJS를 선택했다.

## 긍정적 결과

- 단일 배포·DB 트랜잭션의 단순성
- 명시적 모듈·DI·guard·interceptor
- OpenAPI와 validation 통합
- 코드 경계를 지키면 점진적 추출 가능

## 부정적 결과

- 한 모듈의 과부하·장애가 프로세스를 공유한다.
- 데이터베이스 schema 결합 가능성
- NestJS abstraction과 decorator 의존
- 팀이 경계를 무시하면 분리 비용 급증

## 통제

- module ownership과 dependency rule
- schema/table ownership
- transactional outbox
- request timeout·bulkhead
- booking/payment의 별도 SLO와 connection budget
- 내부 인터페이스 계약 테스트

## 서비스 추출 기준

다음 중 하나 이상이 실제로 관측될 때 검토한다.

- 독립 팀과 온콜
- 크게 다른 부하/확장 특성
- 별도 보안·규제 경계
- 독립 release cadence
- 장애 격리의 명확한 가치

첫 후보는 검색 indexer, media worker, rating worker, booking이다.

## 검증

- 모듈 간 import 규칙 CI
- booking 트랜잭션과 review 작업의 부하 격리 시험
- 한 모듈 기능 flag 차단
- 서비스 추출을 가정한 event/API boundary 검토

## 재검토 조건

위 추출 기준이 충족되거나 단일 배포가 SLO·조직 속도를 지속적으로 막는다.

## 되돌리기 비용

명시적 모듈·outbox·테이블 소유권을 지키면 단계적 추출 가능해 중간이다. 공유 transaction과 cross-module SQL이 퍼지면 매우 높다.

## 관련 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
