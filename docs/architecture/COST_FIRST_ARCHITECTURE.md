# 도락 개인 프로젝트 비용 우선 운영안

> 상태: Accepted  
> 버전: 1.0  
> 기준일: 2026-09-03  
> 적용 단계: 개발, 개인 사용, 폐쇄 알파, 소규모 공개 베타  
> 목표: 사용자 요금이 발생하기 전까지 월 고정 인프라 비용 0원 유지

## 1. 한 줄 결정

도락은 당분간 하나의 Next.js 애플리케이션을 Vercel Hobby에 배포하고, Neon Free PostgreSQL을 원장으로 사용한다. 검색은 PostgreSQL로 처리하고, 실제 사진 업로드가 시작될 때만 Cloudflare R2를 붙인다.

```text
사용자·운영자
      │
      ▼
Vercel Hobby
Next.js App Router
├─ 공개 웹
├─ /ops 운영 화면
└─ /api Route Handlers
      │
      ▼
Neon Free
PostgreSQL + PostGIS + pg_trgm

사진이 생긴 뒤에만 → Cloudflare R2
지도 화면이 생긴 뒤에만 → 카카오맵 또는 네이버 지도
```

AWS, ECS, RDS, OpenSearch, Redis, 상시 실행 워커는 현재 실행 구조가 아니다. 이들은 측정된 사용량이나 보안 요구가 무료 구성을 넘어설 때 재검토한다.

## 2. 비용 원칙

1. 고정비가 생기는 서비스는 무료 수단으로 해결할 수 없다는 증거가 있을 때만 추가한다.
2. 사용자가 없는 기능을 위해 인프라를 미리 띄우지 않는다.
3. 무료 한도를 늘리려고 여러 계정이나 프로젝트를 편법으로 쪼개지 않는다.
4. 공급자 사용량 알림과 예산 한도를 먼저 설정하고 유료 전환한다.
5. 제품 기능은 깊게 설계하되 실제 데이터 지역과 장르는 작게 시작한다.
6. 전국 원장 스키마는 유지하지만 초기 운영 데이터는 선택한 1~2개 생활권으로 제한한다.
7. 광고·유료 구독 등 상업화가 시작되면 무료 플랜의 이용 조건을 다시 검토한다.

## 3. 현재 선택

| 영역         | 현재 선택                              | 무료 범위의 역할              | 지금 제외하는 것             |
| ------------ | -------------------------------------- | ----------------------------- | ---------------------------- |
| 웹·운영·API  | Vercel Hobby의 Next.js                 | 화면, 서버 렌더링, API        | 별도 상시 API 서버           |
| 데이터베이스 | Neon Free PostgreSQL                   | 음식점, 검수, 리뷰, 평점 원장 | RDS, 별도 캐시 DB            |
| 위치         | PostGIS                                | 거리·영역 질의                | 전용 지리 검색 서비스        |
| 텍스트 검색  | PostgreSQL FTS + `pg_trgm`             | 상호·지역·메뉴 검색           | OpenSearch                   |
| 파일         | Cloudflare R2, 필요 시 활성화          | 공개 리뷰 사진                | S3 + CloudFront              |
| 비동기 작업  | 요청 후 DB 작업, 예약된 GitHub Actions | 소량 수집·정리·백업           | Redis, BullMQ, 상시 worker   |
| 지도         | 카카오맵 또는 네이버 지도              | 지도 렌더링·지오코딩          | 복수 지도 동시 운영          |
| 오류 확인    | Vercel 로그 + 구조화 로그              | 초기 장애 확인                | 상시 APM·로그 클러스터       |
| 배포         | GitHub + Vercel Git 연동               | preview와 production          | Terraform, 컨테이너 registry |

공식 무료 한도와 약관은 바뀔 수 있다. 아래 수치는 2026-09-03에 확인한 계획 기준이며 실제 배포 직전에 다시 확인한다.

- Vercel Hobby: 개인·비상업 용도 무료. 한도를 넘으면 유료 초과 청구가 아니라 사용 제한이 발생할 수 있다.
- Neon Free: 프로젝트당 0.5GB 저장소와 월 100 CU-hours, 유휴 시 scale-to-zero.
- Cloudflare R2 Free: 월 10GB-month 저장, Class A 100만 회, Class B 1,000만 회, 인터넷 송신 비용 무료.
- 지도 호출: 개인 MVP 트래픽은 국내 지도 공급자의 무료 쿼터 안에서 시작하되 호출량과 이용약관을 관찰한다.

## 4. 월 비용 시나리오

| 상태                |       예상 월 고정비 | 전제                                          |
| ------------------- | -------------------: | --------------------------------------------- |
| 로컬 개발           |                  0원 | 로컬 PostgreSQL 사용                          |
| 개인 사용·폐쇄 알파 |                  0원 | Vercel·Neon 무료 한도                         |
| 소규모 공개 베타    |             0원 목표 | 무료 한도와 10GB 이하 사진                    |
| 커스텀 도메인       | 월 환산 약 1천~3천원 | 실제 결제는 등록기관별 연 단위                |
| DB 무료 한도 초과   |        월 약 $15부터 | Neon 사용량 기반 플랜의 전형적 시작점         |
| 상업화              | 월 약 $35부터 재산정 | Vercel 유료 플랜과 유료 DB를 함께 쓴다고 가정 |

문자, 본인 인증, 결제, AI 번역·OCR은 호출 즉시 변동비가 생길 수 있으므로 해당 기능의 출시 문턱에서 별도 예산을 승인한다.

## 5. 데이터 범위

Neon Free의 0.5GB에는 테이블뿐 아니라 인덱스도 포함된다. 전국 음식점 원본 전체를 처음부터 적재하지 않는다.

### 초기 허용 범위

- 선택한 1~2개 생활권
- 우선 장르 1~3개
- 서비스에 필요한 정규화 필드만 DB에 적재
- synthetic fixture 또는 이용 조건을 확인한 데이터만 사용
- 원천 대용량 파일은 DB에 넣지 않고 필요 시 압축 보관

### 확장 순서

1. 저장소와 인덱스 사용량 측정
2. 불필요한 원문·중복·검색 인덱스 제거
3. 데이터 지역을 한 단계 확장
4. 0.5GB 접근 시 Neon 유료 전환과 다른 공급자를 함께 비교

무료 용량을 지키려고 사용자 데이터나 감사 이력을 임의 삭제하지 않는다. 보존이 필요한 데이터가 무료 한도를 넘으면 유료 DB로 전환한다.

## 6. 애플리케이션 구성

목표 배포 단위는 하나다.

```text
apps/web
├─ app/(public)/*
├─ app/ops/*
├─ app/api/*
└─ server/*

packages
├─ db
├─ domain-types
├─ ids
└─ server-catalog
```

2026-09-03에 기존 `apps/web`, `apps/ops`, `apps/api`를 다음 순서로 통합했고 현재는 `apps/web` 하나 배포한다.

1. `apps/web`에서 PostgreSQL 연결과 `/api` Route Handler를 만들었다.
2. 기존 NestJS API와 같은 검색·상세·검수 흐름을 확인했다.
3. `apps/ops` 화면을 `apps/web/app/ops`로 옮겼다.
4. 웹과 운영 화면이 같은 서버 계층을 사용하게 했다.
5. 동등성 확인 후 `apps/api`, `apps/ops`를 제거했다.

`packages/server-*`의 도메인 규칙은 Next.js에 직접 섞지 않는다. Route Handler는 얇은 HTTP 어댑터이고 실제 규칙은 서버 패키지에 남긴다. 나중에 상시 API 서버가 필요해도 같은 패키지를 재사용할 수 있다.

## 7. 검색

초기 검색은 PostgreSQL 하나로 처리한다.

- exact match: 정규화 상호와 별칭
- 부분·오타 허용: `pg_trgm`
- 문장 검색: PostgreSQL full-text search
- 거리·지도 영역: PostGIS
- 필터: 장르, 가격대, 영업 상태, 지역 컬럼과 B-tree/GIN/GiST 인덱스
- 정렬: 관련도, 거리, 리뷰 수, 도락 점수를 명시적으로 분리

OpenSearch 도입은 다음 조건 중 하나를 실제 검색 평가셋과 운영 지표로 확인한 뒤 검토한다.

- PostgreSQL 튜닝 후에도 p95 검색 시간이 목표를 반복적으로 넘는다.
- 한글 형태소, 자동완성, facet 품질이 제품 사용을 명확히 막는다.
- 검색 부하가 거래 DB의 안정성을 침해한다.
- 전용 검색 비용을 감당할 실제 사용자나 매출이 생긴다.

## 8. 사진

실제 리뷰 사진 기능 전까지 객체 저장소를 만들지 않는다. 활성화할 때는 다음 흐름만 구현한다.

```text
클라이언트
  → 서버에서 짧은 수명의 업로드 URL 발급
  → R2에 직접 업로드
  → DB에는 객체 키·크기·MIME·소유자·상태만 저장
```

- 원본 버킷은 public listing을 허용하지 않는다.
- 파일 크기와 허용 MIME을 서버에서 제한한다.
- EXIF 위치정보는 공개본에서 제거한다.
- 비공개 영수증·신분 증빙은 공개 사진과 같은 경로에 두지 않는다.
- 증빙을 실제로 받기 전 별도의 보안·보존 설계를 승인한다.

## 9. 배치와 백업

### 초기 배치

- 데이터 동기화: 수동 명령 또는 예약된 GitHub Actions
- 평점 계산: 트래픽이 적을 때 주기 실행
- 실패 기록: PostgreSQL job 테이블
- 동시 실행 방지: PostgreSQL advisory lock
- 멱등성: 입력 파일 checksum과 job key

Redis와 큐는 이 방식으로 처리하기 어려운 지속적 backlog가 측정될 때 추가한다.

### 백업

- Neon이 제공하는 복구 범위를 확인한다.
- 스키마 migration은 저장소에 버전 관리한다.
- 사용자 데이터가 생긴 뒤에는 정기 `pg_dump`를 암호화해 private 저장소에 보관한다.
- DB dump를 Git 저장소에 commit하지 않는다.
- 백업이 있다는 사실이 아니라 실제 복원 시험 성공을 기준으로 한다.

## 10. 환경과 배포

| 환경       | 데이터                                          | 목적                |
| ---------- | ----------------------------------------------- | ------------------- |
| local      | Docker PostgreSQL 또는 개인 Neon branch         | 개발과 migration    |
| preview    | synthetic 데이터, 필요 시 짧은 수명의 DB branch | PR 화면 확인        |
| production | 별도 Neon production DB                         | 개인 사용·공개 베타 |

- production 비밀은 Vercel 환경 변수에만 저장한다.
- `NEXT_PUBLIC_*`에는 공개 가능한 값만 둔다.
- preview에서 production DB 쓰기를 금지한다.
- migration은 애플리케이션 시작 시 자동 실행하지 않는다.
- production 배포 전 수동 또는 승인된 CI 단계에서 migration을 실행한다.
- 공급자 대시보드에서 사용량 알림을 켜고 매주 비용을 확인한다.

세부 배포 절차는 [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md)를 따른다.

## 11. 유료 전환 문턱

### Neon 유료 전환

- DB 또는 인덱스가 무료 저장 한도의 80%에 도달
- compute 무료 한도의 80%가 두 달 연속 사용됨
- scale-to-zero 재기동 시간이 사용자 경험을 반복적으로 해침
- 더 긴 복구 시점이나 운영 지원이 필요함

### Vercel 유료 또는 다른 호스팅 전환

- 광고, 구독, 예약 수수료 등 상업적 운영 시작
- Hobby 이용 조건과 서비스 용도가 맞지 않음
- 함수 실행·대역폭 한도가 반복적으로 개발을 차단
- 상시 연결, 장시간 작업, 고정 리전 제어가 필요함

### 전용 API·worker 전환

- 1분 이상 작업이 빈번함
- queue backlog와 재시도 운영이 필요함
- 모바일·외부 파트너 API가 웹 배포와 독립된 SLO를 요구함
- 분리로 줄어드는 비용이나 장애가 운영 복잡도보다 큼

### OpenSearch·Redis 전환

- 검색과 캐시 문제를 PostgreSQL 쿼리·인덱스·애플리케이션 캐시로 해결하지 못함
- 장애·부하 자료와 예상 월 비용을 같이 제시할 수 있음
- 추가 서비스의 백업, 관측, 장애 대응을 혼자 감당할 수 있음

## 12. 지금 하지 않는 것

- 전국 데이터 일괄 적재
- AWS 계정과 VPC 구성
- ECS/Fargate, RDS, ElastiCache, OpenSearch
- Kubernetes
- Redis를 사용한 조기 캐시
- 빈 큐를 소비하는 상시 워커
- 유료 APM과 데이터 웨어하우스
- production과 동일한 상시 staging 환경
- 다중 리전과 무중단 blue/green 인프라

설계 문서에 위 요소가 등장하더라도 이 문서의 전환 문턱을 넘기 전에는 구현 티켓으로 간주하지 않는다.

## 13. 당장 실행 순서

1. 완료: PostgreSQL 검색, 리뷰·평점, Google 로그인, 운영자 인증과 CI를 구현했다.
2. Neon Free 프로젝트를 만들고 격리 DB에서 migration·seed·smoke test를 검증한다.
3. 실제 데이터의 출처와 정확성을 검수해 production DB에 적재한다.
4. Vercel preview를 먼저 배포하고 Google OAuth callback을 확인한다.
5. production 배포 후 사용량 알림과 복원 절차를 확인한다.
6. 실제 사진 기능에 착수할 때만 R2를 연결한다.

## 14. 관련 결정과 자료

- [TECH_STACK.md](./TECH_STACK.md)
- [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md)
- [ROADMAP.md](../product/ROADMAP.md)
- [ADR-017 비용 우선 개인 프로젝트 배포](../adr/0017-cost-first-personal-project.md)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Neon pricing](https://neon.com/pricing)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [카카오 API 쿼터](https://developers.kakao.com/docs/ko/getting-started/quota)
- [네이버 클라우드 요금](https://m.ncloud.com/charge/price/ko)
