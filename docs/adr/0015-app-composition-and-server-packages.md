# ADR-015: App composition root와 서버 bounded-context package

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Platform
- 검토자: Backend, Data, Search, Web, Mobile

## 맥락

도락은 NestJS 모듈형 모놀리스 API와 TypeScript worker를 별도 실행점으로 둔다. ingestion, catalog, search indexing 코드를 API app 내부에만 두면 worker가 app 내부 경로를 import하거나 로직을 복제하게 된다. 반대로 기능마다 `services/` deployable을 만들면 아직 존재하지 않는 운영·데이터·팀 경계를 앞서 구현하게 된다.

## 결정 기준

- app 간 import 금지
- API와 worker의 도메인 규칙 재사용
- 모듈형 모놀리스 경계
- client/server 코드 격리
- 독립 배포로의 이행 가능성
- 초기 package·운영 복잡도

## 결정

1. 독립 실행·배포 entrypoint는 `apps/*`에 둔다.
2. API와 worker가 공유하는 bounded context는 `packages/server-*` workspace package로 둔다.
3. 초기에는 별도 최상위 `services/`를 만들지 않는다.
4. `apps/api`와 `apps/worker`는 composition root이며 서로를 import하지 않는다.
5. client app은 `server-*`와 `db` package를 import할 수 없다.
6. package `exports`, dependency graph, lint/architecture test로 경계를 강제한다.
7. 실제 독립 scale·SLO·보안·팀 경계가 생기면 새 `apps/<service>` composition root로 추출한다.

초기 server package:

```text
@dorak/server-catalog
@dorak/server-ingestion
@dorak/server-search
@dorak/server-platform
```

## 대안

### 모든 server 코드를 `apps/api/src/modules`에 둠

단일 app은 단순하지만 worker가 app 내부를 import하거나 로직을 복제하게 된다.

### 기능별 microservice를 `services/`에 즉시 생성

배포 경계는 선명하지만 transaction, 계약, 관측, 배포, local 개발 비용이 초기 요구보다 크다.

### 하나의 거대한 `server-core` package

공유는 쉽지만 ownership과 의존 방향이 보이지 않고 사실상 다른 형태의 monolith가 된다.

### Nest CLI 자체 monorepo만 사용

Nest app/library 조립에는 유용하지만 Expo·Next·Python·계약·IaC를 포함한 전체 제품 workspace의 경계와 task graph를 단독으로 해결하지 않는다.

## 긍정적 결과

- API와 worker가 같은 도메인/application 규칙을 사용한다.
- app은 얇은 composition root로 유지된다.
- client bundle에 server 코드가 들어오는 것을 차단한다.
- package별 owner·test·table ownership을 지정할 수 있다.
- 미래 서비스 분리 시 bounded context를 새 app에서 composition할 수 있다.

## 부정적 결과

- workspace package와 exports 관리가 필요하다.
- 너무 작은 package로 분해할 위험이 있다.
- cross-domain transaction orchestration 위치를 명시해야 한다.
- Nest decorator와 framework-neutral domain 경계를 지키는 비용이 생긴다.

## 통제

- app-to-app import 금지
- client-to-server import 금지
- deep import 금지
- package cycle CI 실패
- `server-*`별 public entrypoint와 table ownership manifest
- affected CI + 주기 full graph build
- package 생성 기준과 합치기 재검토 신호

## 검증

- API와 worker가 catalog package를 각각 composition
- worker 없이 API build, API 없이 worker build
- 금지 import fixture가 CI에서 실패
- package cycle 0
- Foundation E2E가 app 내부 import 없이 통과
- client production bundle에서 `server-*`, DB driver, server secret 문자열 없음

## 재검토 조건

- 독립 팀·SLO·scale·보안 경계가 서비스 분리를 정당화한다.
- package가 항상 함께 변경되고 독립 경계 가치가 없다.
- compile/bundle/tooling 제약이 package source 공유를 지속 방해한다.
- 특정 codebase에 별도 저장소 접근 통제가 필요하다.

## 되돌리기 비용

명확한 public entrypoint와 port를 유지하면 package를 app 내부 또는 독립 service로 옮기는 비용은 중간이다. deep import와 cross-table write가 퍼지면 매우 높아진다.

## 관련 문서

- [MONOREPO_ARCHITECTURE.md](../architecture/MONOREPO_ARCHITECTURE.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [FOUNDATION_VERTICAL_SLICE.md](../architecture/FOUNDATION_VERTICAL_SLICE.md)
- [ADR-001](./0001-monorepo-pnpm-turborepo.md)
- [ADR-004](./0004-nestjs-modular-monolith.md)
