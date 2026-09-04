# 도락 기술 스택

> 상태: Accepted  
> 버전: 0.2.0  
> 기준일: 2026-09-03  
> 현재 제약: 개인 개발, 월 고정 인프라 비용 0원 목표  
> 최상위 기준: [COST_FIRST_ARCHITECTURE.md](./COST_FIRST_ARCHITECTURE.md)

## 1. 목표

도락은 한국형 음식점 리뷰·랭킹 서비스의 핵심 가설을 한 사람이 최소 비용으로 검증한다. 지금의 기술 선택은 전국 트래픽을 미리 감당하는 것보다 다음을 우선한다.

- 로컬과 production이 같은 PostgreSQL 동작을 사용한다.
- 하나의 배포로 사용자 화면, 운영 화면, API를 실행한다.
- 무료 한도 안에서 검색·검수·리뷰 기능을 완성한다.
- 도메인 로직을 호스팅 공급자와 분리해 나중에 확장할 수 있다.
- 측정된 문제가 없으면 새 저장소와 상시 서비스를 추가하지 않는다.

## 2. 기술 원칙

### TS-P01. 배포 단위 하나로 시작한다

공개 웹, `/ops`, `/api`를 하나의 Next.js 애플리케이션에 둔다. 화면별 코드와 권한은 분리하되 서버를 미리 분리하지 않는다.

### TS-P02. PostgreSQL을 최대한 사용한다

PostgreSQL은 음식점과 리뷰의 원장이면서 초기 텍스트 검색, 공간 검색, 소량 작업 큐를 담당한다. OpenSearch와 Redis는 측정된 한계가 생길 때만 추가한다.

### TS-P03. 도메인은 framework 밖에 둔다

Route Handler는 입력 검증, 인증, 응답 변환만 담당한다. 음식점, 검수, 리뷰, 평점 규칙은 `packages/server-*`에 둔다.

### TS-P04. 무료 한도는 품질을 버리는 이유가 아니다

용량을 줄이려고 감사 이력, 사용자 데이터, 무결성 제약을 무단 삭제하지 않는다. 무료 한도에 가까워지면 범위 확대를 멈추거나 유료 DB로 전환한다.

### TS-P05. 공급자를 adapter 뒤에 둔다

지도, 객체 저장소, 인증, 알림은 내부 인터페이스를 통해 사용한다. Vercel·Neon·R2 SDK를 도메인 코드에서 직접 import하지 않는다.

### TS-P06. 비동기 작업은 먼저 DB로 해결한다

작은 배치는 GitHub Actions, PostgreSQL job table, advisory lock과 멱등성 키로 처리한다. 지속적 backlog가 관측되기 전 Redis나 queue를 도입하지 않는다.

### TS-P07. 비용도 운영 지표다

저장 용량, compute, 함수 호출, 대역폭, 지도 호출 수를 기능 지표와 함께 확인한다. 무료 한도의 80%를 재검토선으로 사용한다.

## 3. 현재 스택

| 영역          | 선택                                  | 비고                                   |
| ------------- | ------------------------------------- | -------------------------------------- |
| 저장소        | pnpm workspace + Turborepo            | 기존 구조 유지                         |
| 언어          | TypeScript                            | 웹·API·도메인 공통                     |
| 사용자 웹     | Next.js App Router                    | SEO와 반응형 웹                        |
| 운영 화면     | Next.js `/ops`                        | 같은 앱, 별도 인증·권한                |
| API           | Next.js Route Handlers                | `/api/v1/*`                            |
| 도메인 계층   | framework-neutral TypeScript packages | `packages/server-*`                    |
| 데이터 접근   | Drizzle ORM + 명시적 SQL              | migration과 복잡 쿼리                  |
| production DB | Neon PostgreSQL                       | Free로 시작                            |
| 로컬 DB       | Docker PostgreSQL + PostGIS           | Redis/OpenSearch 불필요                |
| 위치 검색     | PostGIS                               | 거리·지도 viewport                     |
| 텍스트 검색   | PostgreSQL FTS + `pg_trgm`            | 전용 검색 없음                         |
| 사진          | Cloudflare R2                         | 실제 업로드 기능부터                   |
| 예약 작업     | GitHub Actions + DB job               | 저빈도 작업                            |
| 지도          | 카카오맵 또는 네이버 지도             | 한 공급자부터 선택                     |
| 배포          | Vercel Hobby                          | 개인·비상업 단계                       |
| CI            | GitHub Actions                        | typecheck, test, build, migration 검사 |
| 오류 확인     | Vercel logs + 구조화 로그             | 민감정보 기록 금지                     |
| 모바일        | Expo + React Native, 후순위           | 웹 흐름 검증 뒤 착수                   |

2026-09-03에 전환 전 NestJS `apps/api`와 별도 `apps/ops`를 제거했다. 현재 소비자 화면, 운영 화면, API는 `apps/web` 하나에서 실행된다.

## 4. 목표 구조

```text
dorak/
├── apps/
│   ├── web/
│   │   ├── app/(public)/       # 검색·상세·리뷰
│   │   ├── app/ops/            # 운영 검수
│   │   ├── app/api/v1/         # HTTP adapter
│   │   └── server/             # Next 전용 composition
│   └── mobile/                 # 웹 검증 뒤 추가
├── packages/
│   ├── domain-types/
│   ├── ids/
│   ├── db/
│   ├── server-catalog/
│   ├── server-review/          # 필요 시
│   └── test-fixtures/
├── db/
│   ├── migrations/
│   └── seeds/
├── scripts/
└── infra/
    └── compose.yaml            # 로컬 PostgreSQL만
```

### 의존 방향

```text
UI → Route Handler → server-* application → db port → PostgreSQL

domain-types ← UI/Route Handler/server-*
db ← server-* infrastructure
```

금지 사항:

- client component에서 `@dorak/db` 또는 `server-*` import
- Route Handler에 평점·검수 규칙 직접 구현
- `server-*`에서 `next/*`, Vercel, R2 SDK import
- 다른 도메인이 소유한 테이블을 임의 수정
- 공개 환경 변수를 통해 DB URL이나 비밀 노출

## 5. 웹·운영 화면

### 공개 경로

- `/`: 탐색 시작
- `/search`: 검색 결과와 필터
- `/restaurants/[publicId]`: 음식점 상세
- 이후 `/reviews/*`, `/lists/*`, `/rankings/*`

공개 음식점 페이지는 server rendering을 기본으로 한다. 사용자별 상태가 없는 데이터는 짧게 캐시할 수 있지만 영업 상태와 운영 수정이 지나치게 늦게 반영되지 않게 무효화 기준을 둔다.

### 운영 경로

- `/ops`: 운영 홈
- `/ops/candidates`: 음식점 후보 검수
- 이후 `/ops/reports`, `/ops/audit`

운영 화면은 같은 Next.js 배포에 있어도 공개 화면과 동일 권한이 아니다.

- 인증 구현 전 production에서 `/ops`를 차단한다.
- 운영 작업은 서버에서 권한을 다시 확인한다.
- 승인·거절·병합에는 감사 로그를 남긴다.
- UI에서 버튼을 숨기는 것으로 권한 검사를 대신하지 않는다.

## 6. API

HTTP 계약은 REST/JSON을 유지한다.

```text
GET    /api/v1/branches
GET    /api/v1/branches/:publicId
GET    /api/v1/ops/candidates
POST   /api/v1/ops/candidates/:id/decision
```

원칙:

- 공개 ID와 내부 UUID를 구분한다.
- 입력은 런타임에서 검증한다.
- 오류는 안정된 code와 request ID를 반환한다.
- mutation은 인증·권한·감사·멱등성을 적용한다.
- DB transaction 경계를 application use case에 둔다.
- Route Handler가 DB row를 그대로 반환하지 않는다.

OpenAPI 원본은 모바일이나 외부 소비자가 생길 때도 유지할 수 있다. 단일 배포가 계약 규율을 없애는 것은 아니다.

## 7. 데이터베이스

### production

- Neon의 production 프로젝트 또는 branch를 사용한다.
- `DATABASE_URL`은 server-only 환경 변수다.
- serverless 연결 수를 고려해 작은 pool과 짧은 idle timeout을 쓴다.
- 가능한 경우 공급자의 pooled connection URL을 runtime에 사용한다.
- migration에는 direct connection이 필요한지 공급자 지침을 확인한다.

### 확장 기능

- PostGIS: 위치와 거리
- `pg_trgm`: 부분 문자열과 유사도
- 필요한 경우 별도 정규화 컬럼

확장 설치 가능 여부를 migration preflight에서 확인한다. 로컬과 production의 PostgreSQL major version 및 extension 차이를 기록한다.

### migration

1. SQL migration은 저장소에 순서대로 기록한다.
2. PR에서 빈 DB 적용과 기존 DB upgrade를 검사한다.
3. production 배포 전에 별도 단계에서 실행한다.
4. 앱 시작 시 migration을 자동 실행하지 않는다.
5. 파괴적 변경은 expand → migrate → contract 순서로 한다.

## 8. 검색

초기 검색 read path:

```text
정규화 query
  → exact/alias match
  → pg_trgm similarity
  → FTS rank
  → PostGIS/구조화 filter
  → 공개 정렬 규칙
```

최소 인덱스 후보:

- 정규화 상호·별칭 GIN trigram
- 검색 document `tsvector` GIN
- 위치 `geometry/geography` GiST
- 활성 상태, 장르, 지역 B-tree/partial index

실제 데이터와 대표 쿼리 평가셋 없이 인덱스를 늘리지 않는다. `EXPLAIN (ANALYZE, BUFFERS)`와 저장 공간을 함께 기록한다.

OpenSearch는 [COST_FIRST_ARCHITECTURE.md](./COST_FIRST_ARCHITECTURE.md)의 도입 문턱을 넘긴 뒤 새 ADR로만 추가한다.

## 9. 파일과 이미지

R2는 리뷰 사진 구현 시점에 추가한다.

- 업로드는 짧은 수명의 서명 URL을 사용한다.
- DB는 객체 key와 metadata를 원장으로 가진다.
- 공개 URL을 영구 식별자로 쓰지 않는다.
- 썸네일 규격은 실제 UI 요구만 만든다.
- 원본과 공개본을 구분한다.
- 비공개 방문 증빙은 별도 bucket·권한·보존 정책 없이는 받지 않는다.

## 10. 배치와 비동기 작업

초기 방식:

```text
GitHub Actions schedule/manual
  → CLI command
  → PostgreSQL advisory lock
  → job_run 기록
  → 작은 batch transaction
  → checkpoint/재시도
```

Redis/BullMQ 또는 관리형 queue 도입 기준:

- 실행 지연이 사용자 약속을 반복적으로 어김
- 지속적 backlog와 여러 consumer가 필요함
- webhook 재시도와 DLQ 운영이 필요함
- DB job polling이 원장 부하에 영향을 줌

## 11. 로컬 개발

기본 의존 서비스는 PostgreSQL 하나다.

```bash
docker compose -f infra/compose.yaml up -d postgres
DATABASE_URL=postgres://dorak:dorak_local_only@localhost:5432/dorak pnpm db:migrate
DATABASE_URL=postgres://dorak:dorak_local_only@localhost:5432/dorak pnpm db:seed
DATABASE_URL=postgres://dorak:dorak_local_only@localhost:5432/dorak pnpm db:smoke
pnpm dev
```

`DATABASE_URL`이 없을 때의 인메모리 모드는 UI 개발 편의용이다. DB 통합 완료를 증명하는 환경으로 취급하지 않는다.

## 12. 테스트와 CI

필수 gate:

```bash
pnpm typecheck
pnpm test
pnpm build
```

계층별 기준:

- unit: domain rule, ID, 검색 query 정규화
- integration: 실제 PostgreSQL/PostGIS/`pg_trgm`과 migration
- contract: 기존 NestJS와 새 Route Handler의 응답 동등성, 전환 완료까지
- E2E: 검색 → 상세, 후보 검수 → 공개 반영
- visual: 소비자·운영 핵심 화면

OpenSearch와 Redis가 없는 것을 test gap으로 간주하지 않는다.

## 13. 보안과 개인정보

- 실제 사용자 데이터는 synthetic preview와 분리한다.
- production DB URL은 로컬 공유 파일에 넣지 않는다.
- 로그에는 이메일, 전화번호, 영수증, 위치 원문을 넣지 않는다.
- `/ops` mutation은 CSRF를 포함한 웹 공격 경계를 검토한다.
- 관리자 계정에는 강한 인증을 적용한다.
- 개인정보·예약·결제를 시작하기 전에 별도 launch gate를 통과한다.
- 무료 플랜이라는 이유로 암호화, 최소 권한, 삭제 요청을 생략하지 않는다.

## 14. 관측성과 비용

초기 대시보드가 없어도 다음은 주기적으로 기록한다.

- Vercel 함수 호출, 실행 시간, 오류율, 대역폭
- Neon 저장 공간, compute, connection, 느린 query
- R2 저장 공간과 operation 수
- 지도 API 호출 수와 오류
- 검색 p50/p95, 결과 없음 비율
- 배치 실패와 마지막 성공 시각

임계값은 무료 한도의 80%다. 80%에서 최적화·범위 동결·유료 전환 중 하나를 결정하고, 100%에 닿은 뒤 대응하지 않는다.

## 15. 확장 사다리

| 단계 | 구조                           | 진입 조건                  |
| ---- | ------------------------------ | -------------------------- |
| A    | Vercel + Neon                  | 현재                       |
| B    | 유료 DB 또는 유료 웹 플랜      | 한도·상업화·복구 요구      |
| C    | 별도 API/worker + 관리형 queue | 장시간 작업·독립 SLO       |
| D    | 전용 검색·cache                | 측정된 검색·DB 병목        |
| E    | AWS 등 격리 cloud 구성         | 매출·팀·개인정보·예약 규모 |

단계를 건너뛰지 않아도 된다. 공급자는 그 시점의 가격, 리전, 데이터 처리 조건을 다시 비교한다. 과거 AWS 설계는 후보일 뿐 자동 목적지가 아니다.

## 16. 전환 작업

### 완료

- PostgreSQL timestamp mapping 안정화와 회귀 테스트
- Next.js API Route Handler 작성
- `apps/ops`를 `/ops`로 이동
- 검색·상세·검수 계약 동등성 확인 후 별도 앱 제거
- PostgreSQL FTS·`pg_trgm` 검색과 리뷰·평점 집계
- Better Auth 기반 Google 로그인과 리뷰 작성 제한
- 리뷰 신뢰 표시, 운영자 숨김과 감사 기록
- GitHub Actions DB 통합·HTTP smoke CI

### 다음

- 실제 음식점 원천 선정과 검수 데이터 적재
- 신고 접수와 사용자 계정·리뷰 삭제 흐름
- 영수증·예약 기반 방문 확인은 운영 부담을 검증한 뒤 도입

### 배포 직전

- Neon extension·migration·seed 검증
- Vercel preview 검증
- production secrets와 사용량 알림 설정
- 백업·복원 절차 확인

## 17. 명시적 비목표

현재 단계에서는 다음을 구현하지 않는다.

- ECS, RDS, ElastiCache, OpenSearch, NAT Gateway
- Terraform 기반 cloud landing zone
- production과 같은 상시 staging
- 마이크로서비스
- Kubernetes
- 실시간 데이터 warehouse
- 상시 Python rating server
- 전국 데이터 일괄 적재

## 18. 관련 문서

- [COST_FIRST_ARCHITECTURE.md](./COST_FIRST_ARCHITECTURE.md)
- [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md)
- [MONOREPO_ARCHITECTURE.md](./MONOREPO_ARCHITECTURE.md)
- [DATABASE_SCHEMA_BLUEPRINT.md](./DATABASE_SCHEMA_BLUEPRINT.md)
- [ROADMAP.md](../product/ROADMAP.md)
- [ADR_INDEX.md](../adr/README.md)
