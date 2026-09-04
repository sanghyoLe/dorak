# 도락 모노레포·모듈 경계 설계

> 실행 우선순위 안내: 2026-09-03부터 [ADR-017](../adr/0017-cost-first-personal-project.md)이 배포 단위의 기준이다. 현재 구조는 단일 `apps/web`의 public·`/ops`·`/api` 구성이다. 아래의 `apps/api`, `apps/ops`, worker 구조는 확장 단계 참고안이다.

> 상태: 초안 v0.1  
> 기준일: 2026-09-02  
> 기준: pnpm workspace + Turborepo + TypeScript 중심, Python 평점 워커 공존  
> 역할: 저장소 구조, package 의존 방향, task graph, 환경 변수, CI·ownership 기준  
> 연관 문서: [TECH_STACK.md](./TECH_STACK.md), [FOUNDATION_VERTICAL_SLICE.md](./FOUNDATION_VERTICAL_SLICE.md), [CONTRACTS_AND_SCHEMAS.md](./CONTRACTS_AND_SCHEMAS.md), [DATABASE_SCHEMA_BLUEPRINT.md](./DATABASE_SCHEMA_BLUEPRINT.md), [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md), [ADR_INDEX.md](../adr/README.md)

---

## 1. 목적

도락은 모바일, 공개 웹, 점주·운영 콘솔, API, 비동기 워커, Python 평점 워커를 한 저장소에서 개발한다. 한 저장소에 있다는 사실이 곧 코드 공유를 허용한다는 뜻은 아니다.

이 문서는 다음을 결정한다.

- 무엇이 독립 실행·배포 가능한 app인지
- 무엇이 재사용 가능한 package인지
- API와 worker가 도메인 코드를 어떻게 공유하는지
- client가 server 내부 코드를 import하지 못하게 하는 방법
- OpenAPI·이벤트·DB 원본과 생성물의 위치
- pnpm·Turborepo task와 cache 규칙
- 환경 변수와 비밀이 build cache에 미치는 영향
- PR에서 어떤 변경을 어디까지 검증할지
- 향후 저장소·서비스 분리를 가능하게 하는 경계

---

## 2. 원칙

### MR-P01. `apps`는 실행점이다

`apps/*`는 자체 entrypoint와 deploy artifact를 가진다. 다른 app이 app 내부 경로를 import하지 않는다.

### MR-P02. 공유는 package export를 통해서만 한다

상대 경로로 다른 workspace 내부를 넘나들지 않는다. 공개된 package entrypoint와 `exports`만 사용한다.

### MR-P03. 서버 도메인 package는 client에서 금지한다

모바일·웹 bundle이 DB schema, 암호화 adapter, 내부 risk signal, 운영 권한 코드를 실수로 포함하지 않게 정적 경계를 둔다.

### MR-P04. 계약과 도메인 모델을 구분한다

OpenAPI 생성 DTO는 transport 타입이고, `server-*` package의 entity/value object가 아니다. API adapter가 둘을 mapping한다.

### MR-P05. package는 재사용 가능성보다 ownership 경계로 만든다

함수 두 개를 공유하기 위해 package를 늘리지 않는다. 독립 owner, 안정된 public API, 두 개 이상의 실제 소비자, 금지해야 할 의존 방향 중 하나가 있어야 한다.

### MR-P06. build cache는 정확성이 먼저다

환경 변수, schema, generator version, lockfile이 산출물에 영향을 주면 task input에 포함한다. 빠르지만 잘못된 cache hit를 허용하지 않는다.

### MR-P07. 버전은 scaffold 시 검증 후 고정한다

문서의 `latest`를 설치 명령에 사용하지 않는다. Node, pnpm, Expo, Next, Nest, Turbo는 호환성 matrix와 최소 spike를 통과한 exact 범위를 lockfile·toolchain 파일에 고정한다.

---

## 3. 상위 구조

```text
dorak/
├── apps/
│   ├── mobile/                 # Expo 소비자 앱
│   ├── web/                    # 공개 Next.js 웹
│   ├── owner/                  # 점주 Next.js 콘솔
│   ├── ops/                    # 운영자 Next.js 콘솔
│   ├── api/                    # NestJS HTTP composition root
│   ├── worker/                 # TypeScript job/event composition root
│   └── rating-worker/          # Python 평점·배치 composition root
├── packages/
│   ├── api-contracts/          # OpenAPI 생성 client/transport type
│   ├── event-contracts/        # JSON Schema 생성 event type/validator
│   ├── domain-types/           # 매우 작은 framework-neutral primitive
│   ├── ids/                    # public ID 생성·검증
│   ├── db/                     # Drizzle schema, migration·DB test 도구
│   ├── server-catalog/         # 음식점 원장 bounded context
│   ├── server-ingestion/       # 원천·정규화·entity resolution
│   ├── server-search/          # 검색 document·indexing port
│   ├── server-platform/        # outbox·idempotency·job 공통 기반
│   ├── observability/          # server/client별 안전한 entrypoint
│   ├── design-tokens/          # 플랫폼 중립 디자인 token
│   ├── ui-web/                 # web/owner/ops 공통 web primitive
│   ├── test-fixtures/          # 합성 fixture·builder
│   ├── config-eslint/          # lint와 boundary 규칙
│   ├── config-typescript/      # 역할별 tsconfig preset
│   └── config-testing/         # test preset
├── openapi/                    # REST 계약 원본
├── schemas/                    # event/webhook/search JSON Schema 원본
├── db/
│   ├── migrations/             # 적용 순서가 있는 SQL 원본
│   ├── seeds/                  # 합성·비민감 seed
│   └── checks/                 # invariant·drift query
├── infra/
│   ├── docker/                 # local dependencies
│   ├── terraform/              # cloud IaC
│   └── policies/               # 배포·보안 policy as code
├── docs/
│   ├── adr/
│   ├── runbooks/
│   └── generated/              # 사람 수정 금지 산출물만
├── tooling/                    # repo 전용 실행 script/package
├── scripts/                    # 얇은 안전 wrapper, 장기 로직 금지
├── pnpm-workspace.yaml
├── package.json
├── pnpm-lock.yaml
├── turbo.json
└── tsconfig.json
```

`services/`라는 별도 최상위 폴더는 초기에는 두지 않는다. 배포 가능한 것은 `apps`, 재사용 가능한 bounded context는 `packages/server-*`로 구분한다. 실제 독립 서비스로 분리할 때 해당 composition root를 `apps`에 추가한다.

---

## 4. Workspace 설정

### 4.1 pnpm workspace

개념 예시:

```yaml
packages:
  - apps/*
  - packages/*
  - tooling/*
```

규칙:

- root `package.json`은 `private: true`다.
- `packageManager`에 검증한 pnpm exact version을 기록한다.
- workspace dependency는 `workspace:*`를 사용한다.
- 같은 이름의 registry package로 silent fallback하지 않는다.
- shared lockfile 하나를 사용한다.
- workspace dependency cycle은 install/CI 실패로 처리한다.
- 각 package는 사용하는 dependency를 직접 선언한다.
- root dependency hoist에 우연히 의존하지 않는다.

### 4.2 isolated dependency

pnpm의 엄격한 dependency 해소를 기본으로 유지한다. 현재 Expo 공식 가이드는 최신 SDK에서 isolated dependency를 지원하지만 일부 native library가 문제를 만들 수 있다고 명시한다.

따라서:

1. 검증된 Expo SDK와 native package로 isolated install을 먼저 시도한다.
2. React, React Native, Expo native module 중복을 CI에서 검사한다.
3. 특정 package 문제가 있으면 원인·issue·만료 조건을 기록한 제한적 workaround를 쓴다.
4. repository 전체를 hoisted linker로 바꾸는 것은 mobile build 증거가 있을 때만 승인한다.
5. workaround 제거를 Expo/native dependency upgrade checklist에 넣는다.

### 4.3 lifecycle script

- install 중 실행되는 dependency build script allowlist를 유지한다.
- lockfile 변경 PR에서 새 install script를 검토한다.
- CI는 frozen lockfile install을 사용한다.
- package manager store/cache가 artifact provenance를 가리지 않게 한다.
- dependency source·integrity 변경을 보안 검사에 포함한다.

---

## 5. Package 이름과 exports

### 5.1 이름

모든 내부 workspace package는 `@dorak/` scope를 사용한다.

```text
@dorak/api-contracts
@dorak/event-contracts
@dorak/domain-types
@dorak/ids
@dorak/db
@dorak/server-catalog
@dorak/server-ingestion
@dorak/server-search
@dorak/server-platform
@dorak/observability
@dorak/design-tokens
@dorak/ui-web
```

### 5.2 exports allowlist

package root의 내부 파일 전체를 노출하지 않는다.

```json
{
  "name": "@dorak/server-catalog",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./testing": "./src/testing/index.ts"
  }
}
```

금지:

```ts
import { BranchRow } from "@dorak/db/src/schema/core/branch";
import { CatalogService } from "../../server-catalog/src/application/catalog";
```

허용:

```ts
import { GetPublicBranch } from "@dorak/server-catalog";
```

### 5.3 testing export

production API와 test fixture를 같은 root에서 섞지 않는다. `./testing` subpath는 production bundle에서 금지하고 test configuration에서만 허용한다.

### 5.4 build 또는 source import

초기 내부 package는 source TypeScript를 framework build가 처리할 수 있다. 그러나 다음을 검증한다.

- Next/Expo transpilation 지원
- server-only package가 client bundle에 들어오지 않음
- ESM/CJS format 일치
- test runner alias와 exports 일치
- declaration generation이 필요한 package 구분

모든 package를 습관적으로 prebuild하지 않는다. 독립 publish 또는 Python/외부 consumer가 필요한 artifact만 명시적으로 build한다.

---

## 6. 의존 방향

### 6.1 허용 graph

```text
apps/mobile ───────┐
apps/web ──────────┼→ api-contracts, domain-types, ids, design-tokens
apps/owner ────────┤
apps/ops ──────────┘

apps/api ──────────→ server-* → db/server-platform
apps/worker ───────→ server-* → db/server-platform

apps/rating-worker → event contracts/artifact exported for Python

server-* ──────────→ domain-types, ids, event-contracts
api-contracts ─────→ no server package
db ────────────────→ no domain application package
```

### 6.2 금지 graph

- app → 다른 app
- client app → `server-*`, `db`, server config
- `db` → domain application
- domain/application → HTTP controller 또는 OpenAPI generated DTO
- `server-catalog` → `server-ingestion` infrastructure 직접 호출
- package → app environment singleton
- design token → React/Next/Expo runtime
- event contract → event consumer implementation

### 6.3 cross-domain 호출

모듈형 모놀리스의 동기 호출은 대상 package의 application port를 통한다. 다른 package의 repository나 table mapper를 직접 import하지 않는다.

```text
server-ingestion application
  → CatalogCommandPort
  → server-catalog application implementation
```

독립 transaction이 필요한 변경은 상위 use case가 명확한 orchestration을 소유하거나 event로 분리한다. 순환 호출을 만들지 않는다.

### 6.4 DB 접근

`@dorak/db`는 connection, transaction context, schema와 migration 도구를 제공한다. 다른 domain의 table을 import할 수 있다는 이유로 수정 권한이 생기지 않는다.

- 각 `server-*` package에 table ownership manifest
- write repository는 owner package만 export
- cross-domain read는 public query port 또는 승인된 read model
- architecture test가 금지된 schema import를 검사
- production DB role 분리는 민감 domain부터 단계 적용

---

## 7. Server bounded context 내부

예: `@dorak/server-catalog`.

```text
src/
  domain/
    entities/
    value-objects/
    policies/
    events/
  application/
    commands/
    queries/
    ports/
    dto/
  infrastructure/
    persistence/
    outbox/
    adapters/
  presentation/
    http/                  # 선택: API app에서 조립 가능
  public.ts
  index.ts
```

### 7.1 domain

- framework-neutral TypeScript
- Nest decorator 없음
- Drizzle row 없음
- OpenAPI DTO 없음
- 현재 시각·ID·외부 provider는 port로 주입
- 상태 전이와 불변식

### 7.2 application

- command/query use case
- transaction 필요 선언
- 권한을 actor context와 policy로 확인
- repository/provider port
- domain event 수집
- transport와 무관한 result/error

### 7.3 infrastructure

- Drizzle/SQL repository
- provider adapter
- outbox serializer
- OpenSearch/Redis 접근
- 암호화·object storage adapter

### 7.4 presentation

- HTTP controller
- auth guard와 actor mapping
- OpenAPI request/response mapping
- Problem Details mapping
- header/cache/idempotency 처리

presentation을 bounded context에 둘지 `apps/api` adapter에 둘지는 첫 두 module spike에서 비교한다. 어느 쪽이든 controller가 다른 module의 infrastructure를 호출하지 않는다.

---

## 8. Composition root

### 8.1 `apps/api`

책임:

- Nest application bootstrap
- config validation
- global middleware/guard/filter
- module composition
- HTTP server lifecycle
- readiness/liveness
- graceful shutdown
- OpenTelemetry init

포함하지 않음:

- 도메인 규칙 원본
- DB row의 공개 serialization
- 특정 모듈의 거대 util 모음
- worker loop

### 8.2 `apps/worker`

책임:

- outbox publisher
- event/job consumer 등록
- retry/backoff/dead-letter
- worker concurrency와 shutdown
- ingestion·indexer·media·notification handler composition

초기에는 하나의 worker artifact에 여러 queue handler가 있어도 된다. queue·자원·SLO 차이가 실제로 발생하면 같은 package를 다른 composition root로 나눈다.

### 8.3 `apps/rating-worker`

Python project는 JS workspace dependency를 import하지 않는다.

- JSON Schema/OpenAPI artifact를 언어 중립 파일로 받음
- Python dependency lock 별도
- 모델 artifact와 feature schema version
- TypeScript task graph에서 wrapper task로 실행
- build/test artifact 경계를 명시

### 8.4 client apps

모든 client는 generated API client를 얇은 runtime adapter로 감싼다.

- auth header
- trace/request ID
- timeout·retry 정책
- locale
- app version
- 오류 code mapping

generated client 파일에 이 정책을 직접 수정하지 않는다.

---

## 9. Client 공유 경계

### 9.1 공유

- API transport type/client
- public ID validator의 안전한 부분
- locale-neutral domain primitive 일부
- 디자인 token
- icon source 또는 이름 체계
- 오류 code와 공통 telemetry event 이름

### 9.2 Web 계열 공유

`@dorak/ui-web`은 `web`, `owner`, `ops`가 공유하는 접근 가능한 primitive만 가진다.

- Button, Field, Dialog, Table primitive
- focus·keyboard behavior
- token binding
- loading/error/empty 기본 상태

서비스별 화면, 권한, data fetching을 ui package로 옮기지 않는다.

### 9.3 Mobile 비공유

Expo/React Native component를 web component와 동일 package로 강제하지 않는다. 디자인 token과 의미는 공유하되 gesture, navigation, accessibility, native module 경계는 모바일에서 구현한다.

### 9.4 React singleton

- React/React Native/Expo native module의 중복 버전을 CI에서 탐지
- shared UI의 React는 적절한 peer dependency
- root override는 근본 버전 정렬을 위한 제한적 수단
- 앱별 bundle에서 단일 React runtime 확인

---

## 10. 계약과 생성물

### 10.1 방향

```text
openapi/dorak-v1.yaml
  → @dorak/api-contracts/generated
  → mobile/web/owner/ops client

schemas/events/**
  → @dorak/event-contracts/generated
  → api/worker + Python artifact
```

### 10.2 생성 package

- generated directory는 직접 수정 금지
- package의 수동 `src/`에는 runtime adapter·safe helper만 허용
- generator version과 schema digest 기록
- `generate` 후 git diff가 없음을 CI 확인
- schema 변경과 생성 artifact를 같은 PR에 포함
- API DTO에서 DB/entity type import 금지

### 10.3 circular generation 방지

schema source가 생성 package의 TypeScript를 import하지 않는다. generator config가 app code에 의존하지 않는다. 계약 validation은 최소 toolchain만으로 실행 가능해야 한다.

---

## 11. 환경 설정

### 11.1 원칙

- 환경 변수는 entrypoint에서 한 번 검증
- package가 전역 `process.env`를 임의로 읽지 않음
- typed config object를 application/infrastructure에 주입
- secret과 non-secret config를 구분
- client-exposed 값은 별도 allowlist/prefix
- 빈 문자열을 유효한 값으로 취급하지 않음
- production default로 위험 기능이 켜지지 않음

### 11.2 config package

`@dorak/config` 하나가 client/server secret schema를 모두 export하지 않는다.

```text
@dorak/config-server
@dorak/config-next-public
@dorak/config-expo-public
@dorak/config-test
```

또는 단일 package의 명시적 subpath export를 사용한다. client import graph에서 server entrypoint를 금지한다.

### 11.3 `.env`

- `.env.example`: key 이름·설명, 실제 비밀 없음
- `.env.local`: 로컬 개인 값, gitignore
- CI/production: secret manager·OIDC 기반 주입
- root `.env`가 모든 app에 자동 공유된다고 가정하지 않음
- production dump를 개발 env 파일로 사용 금지

### 11.4 Turbo cache와 env

task output에 영향을 주는 환경 변수는 task의 environment input에 명시한다.

예:

- public build-time API base URL
- locale build config
- feature compile flag
- schema/generator mode
- Next/Expo public configuration

secret 값이 cache key에 필요할 때 remote cache로 값 자체가 노출되지 않는지 도구 동작을 검토한다. secret에 따라 build artifact가 달라지는 구조를 최소화하고 runtime injection을 우선한다.

---

## 12. Turborepo task graph

### 12.1 공통 task

```text
format:check
lint
boundaries
typecheck
test
test:integration
test:e2e
generate
contracts:check
db:check
build
dev
```

### 12.2 개념 의존성

```text
generate
  └─ contracts:check

lint ─────────────┐
boundaries ───────┤
typecheck ────────┼→ build
test ─────────────┤
contracts:check ──┤
db:check ─────────┘

build → test:e2e/deploy artifact
```

`test:integration`은 PostgreSQL/OpenSearch 같은 실제 service dependency를 요구하며 unit task cache와 분리한다.

### 12.3 cache

cache 가능 후보:

- lint
- typecheck incremental artifact가 안전할 때
- unit test
- contract bundle/generation
- deterministic build

cache 금지 또는 신중:

- `dev` persistent process
- migration apply
- E2E with mutable service
- timestamp/random/network에 의존하는 task
- production deployment
- secret rotation 검증

### 12.4 inputs

task input에 포함할 후보:

- package source
- package manifest
- root lockfile
- shared tsconfig/lint config
- OpenAPI/JSON Schema source
- generator config/version
- DB migration
- relevant environment declaration
- native app config/plugin

문서 변경이 build를 항상 무효화하지 않게 하되 generated docs나 schema와 연결된 문서는 예외다.

### 12.5 outputs

각 task가 실제 생성하는 디렉터리만 선언한다. 광범위한 workspace root를 output으로 잡지 않는다. test coverage와 build artifact를 구분한다.

---

## 13. 개발 명령 UX

root script는 기억하기 쉬운 안정된 entrypoint를 제공한다.

```text
pnpm dev                 핵심 local 개발 graph
pnpm dev:foundation      API/ops/web/worker + DB/search
pnpm check               빠른 로컬 필수 검사
pnpm check:full          integration 포함
pnpm contracts:check
pnpm db:migrate
pnpm db:check
pnpm test:foundation
```

script가 내부 도구 command를 감싸더라도 실패 code와 stdout/stderr를 숨기지 않는다. 실제 command 이름은 scaffold에서 확정한다.

### 13.1 filter

개발자는 package filter로 좁게 실행할 수 있어야 한다.

- 특정 app과 dependency
- 특정 bounded context
- main 대비 영향 package
- package 단독 unit test

필터 결과가 0개인데 성공하는 실수를 막기 위해 CI helper는 no-match를 실패로 처리한다.

### 13.2 local services

local dependency lifecycle:

```text
infra up
health wait
migration apply
synthetic seed
apps start
integration/e2e
diagnostic artifact
infra down — 명시 실행, 데이터 삭제 별도
```

`down`과 volume 삭제를 같은 명령으로 묶지 않는다.

---

## 14. TypeScript 설정

### 14.1 preset

```text
config-typescript/base
config-typescript/node
config-typescript/next
config-typescript/expo
config-typescript/library
config-typescript/test
```

### 14.2 strictness

- strict mode
- unchecked indexed access 검토
- exact optional property 의미와 OpenAPI nullability 정렬
- no implicit override
- switch exhaustiveness helper
- import/export type 구분
- DOM type가 server package에 불필요하게 들어오지 않음

compiler flag는 한 번에 무리하게 켜기보다 scaffold 시 sample app/package 전체가 통과하는 조합을 고정한다. 새 package가 strictness를 낮추지 못하게 한다.

### 14.3 alias

TypeScript `paths`만으로 package 경계를 만들지 않는다. 실제 workspace package와 `exports`를 사용한다. test runner, bundler, Node가 모두 해석할 수 있는지 검증한다.

---

## 15. Boundary enforcement

### 15.1 정적 규칙

- package dependency cycle 0
- app-to-app import 금지
- client-to-server import 금지
- deep import 금지
- domain-to-infrastructure 역방향 import 금지
- generated-to-domain import 금지
- test helper production import 금지
- package manifest에 없는 dependency import 금지

### 15.2 package tag

각 workspace manifest 또는 별도 registry에 role을 둔다.

```text
app-client
app-server
app-worker
contract
domain-server
infrastructure
ui-web
ui-token
tooling
test-only
```

허용 matrix를 lint/architecture test에서 검사한다.

### 15.3 CODEOWNERS

- app owner
- bounded context owner
- contracts owner
- DB migration owner
- infra/security owner
- mobile native config owner

owner 부재가 merge 승인 공백을 만들지 않도록 초기에는 primary와 backup을 둔다.

### 15.4 architecture fixture

금지 import 예제를 test fixture로 만들어 rule이 실제 실패하는지 검증한다. lint rule 설정만 존재하고 아무 파일도 검사하지 않는 상황을 막는다.

---

## 16. CI 단계

### 16.1 PR fast lane

목표는 빠른 피드백과 필수 안전성이다.

1. checkout·toolchain pin 확인
2. frozen lockfile install
3. lockfile/install script security check
4. format/lint/boundaries
5. contract validate·breaking diff·clean generation
6. affected typecheck/unit test
7. affected build
8. migration static/schema check
9. secret scan
10. 결과 요약

### 16.2 integration lane

다음 변경이면 실제 dependency를 띄운다.

- DB schema/repository
- PostGIS query
- outbox/worker
- search mapper/index
- auth/session
- reservation/payment
- provider adapter

Foundation에서는 fixture → API/search E2E를 실행한다.

### 16.3 full lane

주기적 또는 main:

- 전체 graph clean build
- 전체 unit/integration
- dependency cycle·duplicate native dependency
- DB empty migration + upgrade snapshot
- OpenSearch rebuild fixture
- mobile/web smoke
- artifact SBOM/provenance 후보

affected detection 오류를 잡기 위해 full lane을 없애지 않는다.

### 16.4 flaky와 retry

CI job 전체 자동 retry로 결함을 숨기지 않는다. 외부 일시 오류와 제품 test 실패를 구분한다. flaky test에는 owner, issue, quarantine 만료일이 필요하다.

---

## 17. Artifact와 배포

### 17.1 build once

server/web artifact는 commit과 source schema digest를 기록하고 environment별로 다시 build하지 않고 승격한다. build-time public config가 환경마다 달라야 하면 artifact 동일성 원칙과 충돌하므로 runtime config 또는 명시된 별도 artifact를 선택한다.

### 17.2 artifact identity

```text
git commit
dirty flag = false
lockfile digest
OpenAPI digest
event schema digest
DB migration head
app/runtime version
build tool version
```

### 17.3 app별 배포

한 저장소 merge가 모든 app 동시 배포를 뜻하지 않는다.

- API와 worker compatibility
- web 독립 deploy
- owner/ops 독립 deploy
- mobile store release/OTA 별도
- rating worker model release 별도

공개 계약은 오래된 모바일과 동시에 호환돼야 한다.

### 17.4 Docker context

각 server artifact의 Docker build context를 최소화한다. 전체 저장소의 비밀·문서·다른 app source를 final image에 복사하지 않는다. multi-stage build와 non-root runtime을 사용한다.

---

## 18. Python 공존

### 18.1 위치

`apps/rating-worker`는 Python project root이며 자신의 dependency lock, lint, typecheck, test 설정을 가진다.

### 18.2 공통 계약

- JSON Schema 파일
- versioned fixture
- object storage artifact manifest
- CLI exit code와 machine-readable result

TypeScript package를 Python이 shell로 import하거나 생성된 TS를 번역해 복사하지 않는다.

### 18.3 task graph

Turborepo에서 Python task를 wrapper로 호출할 수 있지만 Python tool의 cache directory·lockfile·environment를 정확히 input/output에 포함한다. 네트워크 다운로드가 test 중 몰래 발생하지 않게 한다.

### 18.4 model artifact

코드 package version과 model version을 분리한다. 같은 code가 여러 승인 model artifact를 실행할 수 있으며 배포 manifest에서 둘을 함께 기록한다.

---

## 19. 테스트 fixture 공유

### 19.1 `@dorak/test-fixtures`

허용:

- synthetic branch/user/review builder
- contract-valid JSON fixture loader
- stable clock/ID test provider
- domain별 golden key

금지:

- production credential
- 운영 payload 복사본
- 모든 field를 무조건 채우는 거대 factory
- 잘못된 상태를 쉽게 만드는 unchecked override
- fixture package가 production dependency가 됨

### 19.2 contract fixture

언어 중립 JSON fixture는 `schemas` 또는 명시된 fixture directory가 원본이다. TypeScript와 Python이 같은 파일을 검증한다.

### 19.3 seed

DB seed는 합성 dataset version을 가진다. migration test와 demo seed를 분리하고 production에서 실행되지 않게 환경·role gate를 둔다.

---

## 20. Local 개발 경험

### 20.1 최초 성공 목표

새 개발자는 문서와 자동 bootstrap으로 다음을 재현해야 한다.

- toolchain 확인
- dependency install
- local DB/PostGIS/OpenSearch/Redis 기동
- migration과 synthetic seed
- API/worker/ops/web 실행
- Foundation demo test

목표 시간은 첫 scaffold 측정 후 정한다. ADR의 1시간 검증 기준을 초기 상한 후보로 사용한다.

### 20.2 선택 실행

모바일 개발자가 항상 OpenSearch와 owner app을 띄울 필요는 없다.

```text
profile: api-only
profile: foundation
profile: client-mock
profile: full
```

mock profile은 계약 fixture를 사용하고, 실제 통합 test를 대체하지 않는다.

### 20.3 port

port는 중앙 registry/default를 두고 충돌 시 override 가능하게 한다. URL을 source code에 하드코딩하지 않는다. test worker별 database/schema/index namespace를 격리한다.

### 20.4 데이터 삭제

local reset 명령은 대상 environment와 volume을 표시하고, 기본 동작은 합성 데이터만 초기화한다. production credential이 존재하면 실행을 거부한다.

---

## 21. Dependency 관리

### 21.1 추가

새 dependency PR 질문:

- 표준 API나 기존 package로 해결 가능한가?
- server/client 어느 graph에 들어가는가?
- transitive size와 native code가 있는가?
- install script와 network behavior가 있는가?
- 유지보수·license·security 상태는 어떤가?
- 같은 기능 package가 이미 있는가?
- 제거 비용과 adapter가 필요한가?

### 21.2 version

- exact lockfile
- framework peer version 중앙 정렬
- dependency catalog 도입은 반복 관리 이득 검증 후
- major upgrade는 app matrix로 검증
- 자동 merge는 low-risk 범위와 test confidence가 있을 때만

### 21.3 native dependency

Expo/React Native dependency 변경은 별도 검증한다.

- iOS/Android build
- config plugin diff
- permission/manifest diff
- duplicate native module
- EAS cache
- OTA runtime compatibility
- store policy 영향

---

## 22. 금지 패턴

- `apps/web`에서 `apps/api/src/...` import
- root `utils/`에 owner 없는 공용 코드 축적
- 모든 type을 `domain-types`에 넣기
- DB row를 `api-contracts`에서 export
- package root가 `src/**/*` 전체를 deep export
- TypeScript path alias로 workspace manifest 우회
- client package에서 `process.env` server secret 참조
- Turbo cache input에서 build 환경 누락
- generated code 수동 수정
- production dependency로 test fixture 포함
- 하나의 `admin` app 안에 점주·운영자 권한 혼합
- worker가 API endpoint를 자기 내부 작업용으로 loopback 호출
- 동일 React/React Native native module 여러 버전
- CI affected test만 영구 실행하고 full graph 검증 제거

---

## 23. 초기 scaffold 순서

### Step 1. Workspace

- root manifest와 pnpm workspace
- toolchain pin
- Turbo config
- base TypeScript/lint/test package
- cycle/boundary 검사

### Step 2. Contracts

- OpenAPI/JSON Schema source directory
- validation·bundle·generation task
- `api-contracts`, `event-contracts`
- golden fixture

### Step 3. Server

- `apps/api`, `apps/worker`
- `server-platform`, `server-catalog`, `server-ingestion`, `server-search`
- DB package와 migration
- config/observability

### Step 4. Foundation clients

- `apps/ops`
- 최소 `apps/web`
- generated client wrapper
- design token/ui-web 최소 primitive

### Step 5. Mobile/owner

- Expo app compatibility spike
- public web와 다른 navigation/runtime 경계
- owner app은 claim vertical slice 직전에 생성 가능

빈 앱을 모두 동시에 생성해 dependency와 upgrade 표면을 늘리지 않는다. 다만 최종 구조를 문서에 예약하고 경로 이름이 흔들리지 않게 한다.

---

## 24. Scaffold 완료 조건

- [ ] frozen lockfile로 clean install된다.
- [ ] workspace dependency는 `workspace:*`만 사용한다.
- [ ] dependency cycle 0이며 cycle 설정 무시가 없다.
- [ ] app-to-app, client-to-server deep import가 실제 fixture에서 실패한다.
- [ ] API/event 생성 후 working tree가 clean하다.
- [ ] Foundation 관련 package만 filter build/test할 수 있다.
- [ ] 전체 graph clean build가 주기 CI에서 통과한다.
- [ ] Expo app이 isolated dependency 구조에서 iOS/Android 최소 build된다.
- [ ] React/native module 중복 검사가 통과한다.
- [ ] API와 worker가 같은 server package를 composition하되 서로 import하지 않는다.
- [ ] runtime config validation이 누락·잘못된 값을 시작 전에 거부한다.
- [ ] server secret이 client bundle과 remote build artifact에 없다.
- [ ] Docker final image에 source map·dev dependency·다른 app이 불필요하게 없다.
- [ ] 새 개발자가 Foundation local profile을 재현한다.

---

## 25. 재검토 신호

### 저장소 분리

- 법률·보안상 특정 코드 접근을 분리해야 함
- 독립 팀·release cadence·SLO가 장기간 존재
- package boundary만으로 blast radius를 통제하기 어려움
- CI checkout/graph가 최적화 후에도 지속 병목

### package 합치기

- 항상 함께 변경·배포되고 public API가 형식적임
- 순환 의존을 억지 port로 감추고 있음
- owner가 같고 독립 test 가치가 없음
- package 수가 개발 탐색과 tooling을 더 어렵게 함

### service 분리

- 독립 자원·scaling 특성
- 별도 가용성/보안 경계
- 독립 데이터 소유와 transaction 경계 성숙
- 전담 팀과 on-call owner

CPU가 높다는 이유 하나만으로 domain을 즉시 microservice로 나누지 않는다. worker process 또는 별도 task queue로 먼저 격리할 수 있다.

---

## 26. 미해결 결정

| 항목                    | 초기 방향                            | 결정 gate                    |
| ----------------------- | ------------------------------------ | ---------------------------- |
| exact Node/pnpm/Turbo   | 호환 matrix 후 pin                   | scaffold 첫 PR               |
| Nest compile 방식       | tsc/SWC/Rspack 후보 측정             | API cold build spike         |
| package source/prebuild | source 우선, artifact 필요 시 build  | Next/Expo spike              |
| presentation 위치       | server package 또는 API adapter 비교 | catalog+identity 2개 module  |
| boundary 도구           | ESLint + graph test 조합             | scaffold                     |
| remote cache            | 비밀·권한·비용 검토                  | CI baseline 후               |
| pnpm catalog            | 반복 version 정렬 이득 시            | dependency 30개 이상 시 검토 |
| Expo linker workaround  | isolated 기본                        | native build 실패 증거       |
| ui-web 범위             | primitive only                       | owner/ops 두 앱 사용 시      |
| Python task runner      | project lock 도구 비교               | rating-worker scaffold       |
| changesets              | 내부 package publish 안 함           | 외부 SDK publish 시          |

---

## 27. 공식 기준 자료

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Expo monorepo guide](https://docs.expo.dev/guides/monorepos/)
- [Expo EAS monorepo build](https://docs.expo.dev/build-reference/build-with-monorepos/)
- [NestJS modules](https://docs.nestjs.com/modules)
- [NestJS libraries](https://docs.nestjs.com/cli/libraries)
- [Turborepo repository structure](https://turborepo.com/docs/crafting-your-repository/structuring-a-repository)
- [Turborepo environment variables](https://turborepo.com/docs/crafting-your-repository/using-environment-variables)

실제 scaffold 시점에는 각 도구의 current 문서와 선택한 고정 버전 문서를 함께 검토한다.
