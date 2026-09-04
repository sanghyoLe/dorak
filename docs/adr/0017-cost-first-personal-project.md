# ADR-017: 비용 우선 개인 프로젝트 배포

- 상태: Accepted
- 결정일: 2026-09-03
- owner: 개인 개발자
- Supersedes: ADR-004의 초기 배포 단위, ADR-007, ADR-009, ADR-016

## 맥락

도락은 현재 수익과 운영 조직이 없는 개인 프로젝트다. 기존 설계는 전국 규모와 여러 팀을 전제로 NestJS 상시 API, OpenSearch, Redis, AWS ECS/RDS를 초기 기반으로 선택했다. 이 구조는 미래 확장에는 유효하지만 사용자가 없는 단계부터 고정비와 운영 부담을 만든다.

제품의 핵심 가설은 음식점 데이터 품질, 검색 경험, 리뷰 신뢰도다. 별도 클러스터와 여러 배포 단위는 이 가설을 검증하는 데 필수적이지 않다.

## 결정 기준

- 월 고정비 0원 목표
- 한 사람이 개발·배포·복구할 수 있는 구조
- 무료 한도 초과 시 예측 가능한 확장
- PostgreSQL 원장과 도메인 코드의 재사용
- 상용화 전까지 필요한 충분한 보안 경계
- 공급자 교체 가능성

## 결정

1. 공개 웹, 운영 화면, HTTP API를 하나의 Next.js 애플리케이션과 Vercel 배포로 통합한다.
2. PostgreSQL + PostGIS는 유지하되 초기 운영 공급자는 Neon Free로 선택한다.
3. 검색은 PostgreSQL FTS, `pg_trgm`, PostGIS로 구현한다.
4. OpenSearch와 Redis는 현재 단계에서 운영하지 않는다.
5. 사진 기능이 실제로 필요할 때 Cloudflare R2를 추가한다.
6. 소량 배치는 GitHub Actions와 PostgreSQL job/advisory lock으로 처리한다.
7. 데이터는 서울의 선택한 생활권과 우선 장르부터 시작한다.
8. AWS 설계는 유료 확장 단계의 후보안으로 보존하며 자동 채택하지 않는다.

## 코드 이행

기존 `apps/api`와 `apps/ops`는 계약 동등성을 확인한 뒤 2026-09-03에 제거했다.

```text
NestJS endpoint
  → 같은 계약의 Next.js Route Handler 작성
  → 계약·통합 테스트
  → web/ops 호출 전환
  → /ops 화면 통합
  → 기존 deployable 제거
```

`packages/db`, `packages/domain-types`, `packages/ids`, `packages/server-*`는 유지한다. 도메인 로직을 Route Handler에 직접 작성하지 않는다.

## 대안

### 기존 AWS 구성 즉시 구축

확장성과 격리는 좋지만 초기 월 비용과 운영 표면이 제품 검증 가치보다 크다.

### NestJS만 별도 저가 호스팅

현재 구조 변경은 작지만 두 배포 단위, CORS, 비밀, 로그, cold start를 함께 관리해야 한다. API가 작고 개인 프로젝트인 현재는 단일 Next.js가 더 단순하다.

### Supabase 단일 공급자

DB, 인증, 파일을 묶을 수 있지만 현재는 PostgreSQL 연결만 필요하다. 유휴 프로젝트 동작과 무료 한도를 비교해 scale-to-zero가 명확한 Neon을 우선한다. 인증·스토리지가 필요해질 때 다시 비교한다.

### 처음부터 OpenSearch 유지

검색 기능은 강하지만 별도 서비스의 비용과 동기화·장애 대응이 필요하다. 초기 지역 데이터는 PostgreSQL로 충분한지 먼저 측정한다.

## 긍정적 결과

- 도메인 구매 전 월 고정비 0원으로 운영할 수 있다.
- 배포와 장애 지점이 줄어든다.
- PostgreSQL 하나로 원장·검색·소량 작업을 처리한다.
- 사용자 검증에 시간을 집중할 수 있다.
- 기존 도메인 패키지와 migration을 버리지 않는다.

## 부정적 결과

- 무료 DB 저장 공간과 compute가 작다.
- 유휴 상태 이후 첫 요청이 느릴 수 있다.
- Next.js 함수는 장시간 작업과 상시 연결에 맞지 않는다.
- PostgreSQL 한글 검색 품질이 전용 검색 엔진보다 낮을 수 있다.
- 무료 플랜은 SLA와 지원이 제한적이다.
- 단일 배포 장애가 사용자·운영자 화면에 함께 영향을 준다.

## 통제

- DB 저장소와 함수 사용량을 매주 확인한다.
- 무료 한도의 80%에서 유료 전환 검토를 시작한다.
- preview에서 production DB 쓰기를 금지한다.
- migration은 앱 시작과 분리한다.
- production 데이터가 생기면 암호화 백업과 복원 시험을 추가한다.
- `/ops`는 인증과 권한 없이는 production에 공개하지 않는다.
- 지도·스토리지 공급자는 adapter 경계를 유지한다.

## 재검토 조건

- 서비스가 상업적 목적으로 운영된다.
- Neon 저장 공간 또는 compute의 80%를 지속 사용한다.
- PostgreSQL 검색이 합의된 품질·지연 목표를 통과하지 못한다.
- 1분 이상 비동기 작업이나 지속적 queue backlog가 생긴다.
- 독립 API SLO 또는 모바일·파트너 트래픽이 필요하다.
- 실제 개인정보·예약·결제의 격리 요구가 무료 구성을 넘어선다.

## 되돌리기와 확장 비용

PostgreSQL 표준 기능과 독립 도메인 패키지를 유지하므로 DB와 API 실행 위치의 이관 비용은 중간 이하로 본다. Vercel 전용 API와 R2 전용 URL을 도메인 코드에 퍼뜨리면 비용이 커지므로 adapter에 격리한다.

## 관련 문서

- [COST_FIRST_ARCHITECTURE.md](../architecture/COST_FIRST_ARCHITECTURE.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md)
- [ADR-004](./0004-nestjs-modular-monolith.md)
- [ADR-007](./0007-opensearch-derived-index.md)
- [ADR-009](./0009-aws-seoul-ecs-fargate.md)
- [ADR-016](./0016-production-isolation-and-artifact-promotion.md)
