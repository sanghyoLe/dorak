# 도락 비용 우선 배포·환경 운영

> 상태: Accepted  
> 버전: 0.4.0
> 기준일: 2026-09-04
> 목표 배포: Vercel Hobby + Neon Free  
> 현재 확인: Vercel Preview + Neon PostgreSQL, Next.js build·DB smoke
> 관련 결정: [ADR-017](../adr/0017-cost-first-personal-project.md)

## 1. 목적

이 문서는 개인 프로젝트 단계의 도락을 월 고정비 0원으로 배포하고, 데이터를 잃거나 무료 한도를 갑자기 넘지 않도록 운영하는 방법을 정의한다.

Vercel의 `dorak` 프로젝트와 GitHub 저장소 연결, Preview 배포, Neon migration과 서울 음식점 원장 적재까지 완료했다. Production 공개 전에는 아래 production gate와 OAuth·도메인 설정을 마쳐야 한다.

AWS 계정, ECS, RDS, OpenSearch, Redis, 다중 AZ, Terraform은 이 단계의 필수 인프라가 아니다. 규모 확장 시 과거 ADR과 요구사항을 참고하되 공급자는 다시 비교한다.

## 2. production 구성

```text
Internet
   │
   ▼
Vercel Hobby
Next.js
├─ public pages
├─ /ops
└─ /api/v1
   │
   ├──────────▶ Neon PostgreSQL/PostGIS
   │
   └──────────▶ Cloudflare R2 (사진 기능 이후)
```

| 구성           | 책임                                                  |
| -------------- | ----------------------------------------------------- |
| Vercel         | Next.js build, preview, production runtime, 기본 로그 |
| Neon           | PostgreSQL 원장, PostGIS, 백업·복구 기능 범위         |
| R2             | 공개 사진 object, 실제 사진 기능부터                  |
| GitHub Actions | CI, 수동·예약 작업, 별도 migration 단계               |
| 지도 공급자    | 지도 렌더링과 허용 범위의 지오코딩                    |

## 3. 환경

| 환경       | 실행              | DB                         | 실제 개인정보          | 수명      |
| ---------- | ----------------- | -------------------------- | ---------------------- | --------- |
| local      | 개발자 PC         | Docker PostgreSQL          | 금지                   | 필요할 때 |
| preview    | Vercel PR preview | synthetic 또는 격리 branch | 금지                   | PR 기간   |
| production | Vercel production | production Neon DB         | 기능 승인 후 최소 수집 | 지속      |

상시 staging은 두지 않는다. 실제 운영 전 리허설이 필요한 고위험 migration이나 결제 기능이 생기면 제한된 기간에만 격리 환경을 만든다.

## 4. 환경 변수

### server-only

```text
DATABASE_URL
DATABASE_POOL_MAX
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DORAK_CONTACT_EMAIL
DORAK_OPS_USERNAME
DORAK_OPS_PASSWORD
DORAK_ALLOW_INDEXING
DORAK_DEMO_AUTH
```

`NEXT_PUBLIC_KAKAO_MAP_APP_KEY`는 카카오 지도 JavaScript 키라 브라우저에 노출되는 값이다. 카카오 개발자 콘솔에 localhost와 실제 배포 도메인을 등록한다. `DATABASE_URL`, OAuth secret, Better Auth secret, 운영자 비밀번호를 `NEXT_PUBLIC_*` 이름으로 만들지 않는다.

### browser-visible

```text
NEXT_PUBLIC_KAKAO_MAP_APP_KEY
```

- production에서 `DORAK_DEMO_AUTH`는 사용되지 않으며 반드시 실제 Google 로그인을 사용한다.
- 실데이터와 공개 정책 검수가 끝나기 전에는 `DORAK_ALLOW_INDEXING=false`로 둔다.
- `BETTER_AUTH_SECRET`과 `DORAK_OPS_PASSWORD`는 각각 독립적인 긴 난수로 만든다.

- `.env.example`에는 이름과 로컬 예시만 둔다.
- 실제 production 값은 Vercel environment별 secret에 둔다.
- preview에는 production write credential을 주지 않는다.
- 지도 키가 없거나 좌표가 없는 지점은 주소와 카카오맵 검색 링크로 fallback한다.
- 노출이 의심되면 값을 삭제하는 데 그치지 않고 즉시 회전한다.
- 비밀을 로그, build output, screenshot, issue에 붙이지 않는다.

## 5. 배포 흐름

```text
feature branch
  → pull request
  → CI
  → Vercel preview
  → main merge
  → production migration 필요 여부 확인
  → production deploy
  → smoke test
```

### PR gate

- frozen lockfile install
- typecheck
- unit test
- PostgreSQL migration test
- build
- 핵심 preview 확인

### production gate

- production용 환경 변수 존재 확인
- migration 영향과 rollback/forward-fix 확인
- 무료 한도와 현재 저장 공간 확인
- `/ops` 인증·권한 확인
- 배포 후 검색, 상세, health smoke test

Vercel의 자동 배포만으로 DB migration을 암묵 실행하지 않는다.

### Vercel 프로젝트 설정

- Root Directory: `apps/web`
- Framework Preset: Next.js
- Function Region: `sin1` (Neon `ap-southeast-1`과 동일 리전)
- Build Command: 저장소의 `apps/web/vercel.json` 사용
- Install Command: `cd ../.. && corepack enable && pnpm install --frozen-lockfile`
- production·preview 환경 변수는 서로 분리

모노레포 루트의 workspace package를 함께 빌드해야 하므로 `vercel.json`의 build command는 루트로 이동한 뒤 `@dorak/web`만 필터링한다. schema migration은 배포 build command에 넣지 않고 production 배포 전에 별도로 실행한다.

Node.js 함수의 기본 리전은 미국이므로 `regions: ["sin1"]`을 코드에 고정한다. 현재 Neon도 `ap-southeast-1`에 있어 함수와 DB가 같은 싱가포르 리전에서 통신한다.

로컬 CLI 배포는 저장소 루트에서 실행하고 `.vercelignore`로 `.turbo`, `node_modules`, 원본 CSV와 빌드 산출물을 제외한다. `apps/web` 폴더만 업로드하면 workspace package가 누락되므로 사용하지 않는다.

## 6. Neon 준비

1. production용 project를 하나 만든다.
2. 가장 가까운 사용 가능 리전을 선택하고 실제 서울 사용자 지연을 측정한다.
3. runtime용 pooled URL과 migration용 연결 방식을 구분한다.
4. `postgis`, `pg_trgm` 사용 가능 여부를 확인한다.
5. 빈 DB에 전체 migration을 적용한다.
6. 격리된 preview DB에서 synthetic seed와 smoke test를 실행한다.
7. production에는 검수한 실제 초기 데이터만 적재하며 synthetic seed를 실행하지 않는다.

서울 음식점 초기 데이터는 `pnpm data:import:seoul`로 CSV를 수동 검수한 뒤 적재한다. 원본 파일은 저장소에 커밋하지 않고, 첫 실행은 `--limit=100`으로 변환·좌표를 확인한다. 공간이 제한된 원격 DB는 `--batch-size=1000 --skip-raw`로 정규화 결과만 적재한다. `SEOUL_OPEN_DATA_KEY`를 발급받았다면 CSV 대신 `--api`를 사용할 수 있다. 상세 절차와 출처 정책은 [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)를 따른다.

### 연결 예산

serverless 함수마다 큰 connection pool을 만들지 않는다. 현재 DB client의 최대 연결 수를 production 환경에 맞게 낮추고, 연결 수와 timeout을 측정한다. 정확한 값은 Neon connection 방식과 Vercel 동시성을 확인한 뒤 정한다.

### migration

```text
expand: 새 nullable column/table/index 추가
migrate: 기존 data backfill
switch: app이 새 구조 사용
contract: 이전 구조 제거
```

- DDL과 대량 backfill을 한 transaction에 무리하게 섞지 않는다.
- 잠금 시간이 긴 변경은 데이터 사본이나 preview branch에서 측정한다.
- 실패한 migration을 자동 재시도하지 않는다.
- destructive migration 전에는 복구 가능한 backup을 확인한다.

## 7. 배포 후 확인

최소 smoke test:

```text
GET  /api/health
GET  /api/v1/branches?q={knownQuery}
GET  /restaurants/{knownPublicId}
POST /api/v1/branches/{knownPublicId}/reviews → 로그인·방문 자기확인 확인
GET  /ops                                → 인증 없으면 차단
POST /api/v1/ops/reviews/{reviewId}/hide → 권한·감사·평점 재계산 확인
```

다음을 함께 확인한다.

- 최근 deployment 함수 오류
- DB connection 오류
- migration version
- 검색 응답과 결과 수
- 공개 페이지의 서버 렌더링
- 민감값이 응답·로그에 없는지

## 8. rollback

애플리케이션 오류는 Vercel에서 이전 정상 deployment로 되돌린다. DB가 이미 새 구조를 사용한다면 이전 앱이 새 schema와 호환되는지 먼저 확인한다.

- 앱 rollback을 가능하게 하는 additive schema 변경을 우선한다.
- 데이터가 기록된 column/table을 즉시 drop하지 않는다.
- DB rollback SQL보다 forward fix를 기본으로 한다.
- 데이터 손상 시 쓰기를 멈추고 복구 범위를 확인한다.
- 원인 불명 상태에서 seed나 migration을 다시 실행하지 않는다.

## 9. 백업과 복원

### 사용자 데이터 전

- migration 파일과 synthetic seed를 Git에 보관한다.
- DB는 재생성 가능해야 한다.
- 별도 유료 backup은 두지 않는다.

### 사용자 데이터 후

- Neon plan의 point-in-time restore 범위를 문서화한다.
- 주기적 논리 backup을 암호화된 private 위치에 둔다.
- dump 파일을 Git에 commit하지 않는다.
- backup 보존 기간과 개인정보 삭제 전파를 함께 정의한다.
- 분기마다 새 DB에 복원해 핵심 row count와 query를 검증한다.

Neon 무료 복구 범위가 제품의 데이터 손실 허용치보다 짧으면 트래픽 규모와 관계없이 유료 전환한다.

## 10. R2 활성화

사진 기능이 없으면 이 절차를 실행하지 않는다.

1. public media와 private evidence 요구를 분리한다.
2. public media용 R2 bucket을 만든다.
3. 최소 권한 API token을 만든다.
4. 업로드 크기·MIME allowlist를 정한다.
5. 서명 URL 발급 API를 구현한다.
6. DB object metadata와 상태를 저장한다.
7. orphan object 정리 작업을 만든다.
8. 삭제 요청이 DB와 R2에 모두 반영되는지 시험한다.
9. 저장량과 operation 알림을 설정한다.

비공개 영수증·신분 증빙은 같은 bucket과 공개 delivery 경로를 사용하지 않는다.

## 11. 예약 작업

GitHub Actions의 `schedule`은 정확한 시각을 보장하는 거래 scheduler로 사용하지 않는다. 초기에는 지연 허용 작업에만 쓴다.

- 공공 데이터 소량 동기화
- 검색용 정규화 컬럼 갱신
- 평점 배치
- orphan media 정리
- backup export

각 작업은 수동 실행 경로, 고유 job key, PostgreSQL advisory lock, 실행 기록, checkpoint와 중복 실행 안전성을 가진다.

예약·환불·알림처럼 시각 약속이 있는 기능에는 이 구조를 그대로 사용하지 않는다. 해당 기능 전 별도 scheduler/queue를 결정한다.

## 12. 관측

유료 관측 플랫폼 없이 다음부터 확인한다.

### 요청

- 요청 수와 오류율
- p50/p95 응답 시간
- cold start가 의심되는 지연
- 검색 결과 없음 비율

### DB

- 저장 공간과 증가율
- compute 사용 시간
- 연결 수와 연결 오류
- 느린 query
- index 크기와 사용 여부

### 외부 서비스

- R2 저장 공간과 operation
- 지도 호출과 quota 오류
- GitHub Actions 실행 시간과 실패

로그는 JSON 구조를 사용하되 전화번호, 이메일, 주소 원문, 위치 좌표, 증빙 URL, token을 넣지 않는다.

## 13. 비용 통제

매주 Vercel usage, Neon storage/compute, 활성화된 R2 사용량, 지도 API 호출과 유료 add-on을 확인한다.

| 수준          | 조치                                       |
| ------------- | ------------------------------------------ |
| 무료 한도 50% | 증가 원인 기록                             |
| 80%           | 범위 확대 중단, 최적화 또는 유료 전환 결정 |
| 90%           | 사용자 영향 전 전환 실행                   |
| 예상 밖 청구  | 신규 변동비 기능 차단, 원인 확인           |

금지:

- 비용 알림 없는 유료 전환
- 테스트의 무제한 외부 API 호출
- preview의 production 대용량 데이터 복제
- 로그와 preview artifact의 무기한 보존
- 무료 한도를 우회하려는 다계정 분산

## 14. 장애 대응

### Vercel 배포 장애

1. 최근 deployment와 오류를 확인한다.
2. DB가 정상인지 분리 확인한다.
3. 이전 정상 deployment로 rollback한다.
4. migration 호환성을 확인한다.

### Neon 연결 장애

1. 공급자 상태와 connection quota를 확인한다.
2. 새 connection 폭증 여부를 확인한다.
3. 읽기 화면은 명시적 오류 또는 제한된 cache로 처리한다.
4. 쓰기 성공 여부가 불명확하면 재요청 전 idempotency 상태를 확인한다.

### 검색 지연

1. 느린 query와 실행 계획을 캡처한다.
2. 결과 범위, wildcard, 정렬, index 사용 여부를 확인한다.
3. 비용이 큰 필터를 제한하고 degraded 상태를 알린다.
4. 대표 쿼리 평가셋으로 품질과 지연을 함께 비교한다.

### 무료 한도 도달

1. 신규 ingestion과 비필수 배치를 멈춘다.
2. 사용자 데이터를 임의 삭제하지 않는다.
3. 누수·불필요 artifact를 확인한다.
4. 필요한 경우 유료 전환 후 정상화를 검증한다.

## 15. 보안 gate

다음 기능은 인프라가 무료인지와 관계없이 출시 전 별도 검토가 필요하다.

- 일반 사용자 회원가입
- 운영자 production 접근
- 정확한 위치정보 수집
- 영수증·결제내역 등 방문 증빙
- 점주 사업자 서류
- 예약 연락처와 결제
- 외부 로그인·문자·메일 provider

최소 요구는 인증과 세션 회전, 서버 측 권한 검사, 개인정보 보존 기간, 감사 로그, 삭제·내보내기 절차와 비밀 회전 경로다.

## 16. 확장 신호

| 신호                          | 다음 후보                             |
| ----------------------------- | ------------------------------------- |
| 상업화 또는 Hobby 조건 불일치 | Vercel 유료 또는 다른 runtime         |
| DB 저장·compute 한계          | Neon 유료 또는 관리형 PostgreSQL 비교 |
| 장시간·지속 배치              | 별도 worker와 관리형 queue            |
| DB 검색 병목                  | 전용 검색 서비스                      |
| 측정된 cache 병목             | Redis 또는 edge cache                 |
| 민감 데이터·예약·결제 규모    | 강한 환경·계정 격리                   |
| 여러 개발자와 독립 release    | 배포 단위 분리                        |

AWS는 이 비교의 후보 중 하나다. 기존 AWS 문서의 구성을 그대로 복원하지 않고 현재 가격, 리전, 팀 역량, 이관 비용을 다시 계산한다.

## 17. 첫 배포 체크리스트

- [ ] `apps/web`에 필요한 Route Handler가 있다.
- [x] `/ops`가 같은 앱에 있고 모든 Vercel 환경에서 인증을 요구한다.
- [ ] 로컬 PostgreSQL integration test가 통과한다.
- [ ] Neon에서 PostGIS와 `pg_trgm` migration이 통과한다.
- [ ] runtime connection 수를 확인했다.
- [ ] production과 preview credential이 분리됐다.
- [ ] Vercel preview에서 synthetic smoke test가 통과한다.
- [ ] production migration을 별도 실행할 수 있다.
- [ ] production smoke test와 rollback 절차를 실행했다.
- [x] CI에서 migration·통합 테스트·build·HTTP smoke를 실행한다.
- [ ] Vercel·Neon 사용량 알림을 설정했다.
- [ ] 실제 사용자 데이터의 backup·복구 요구를 결정했다.
- [ ] R2는 사진 기능 전까지 생성하지 않았다.

## 18. 참고

- [COST_FIRST_ARCHITECTURE.md](../architecture/COST_FIRST_ARCHITECTURE.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Neon pricing](https://neon.com/pricing)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
