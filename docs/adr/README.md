# 도락 Architecture Decision Record 인덱스

> 상태: 활성  
> 마지막 정리: 2026-09-03  
> 역할: 되돌리기 비용이 큰 기술·데이터 결정을 배경, 대안, 결과, 재검토 조건과 함께 관리한다.  
> 연관 문서: [TECH_STACK.md](../architecture/TECH_STACK.md), [MONOREPO_ARCHITECTURE.md](../architecture/MONOREPO_ARCHITECTURE.md), [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md), [CONTRACTS_AND_SCHEMAS.md](../architecture/CONTRACTS_AND_SCHEMAS.md), [DATABASE_SCHEMA_BLUEPRINT.md](../architecture/DATABASE_SCHEMA_BLUEPRINT.md), [ROADMAP.md](../product/ROADMAP.md), [GLOSSARY.md](../product/GLOSSARY.md)

---

## 1. 상태 정의

| 상태         | 의미                                    |
| ------------ | --------------------------------------- |
| `Proposed`   | 검토 중이며 구현 기준으로 강제하지 않음 |
| `Accepted`   | 현재 구현 기준                          |
| `Trial`      | 제한 범위에서 검증 중                   |
| `Superseded` | 새 ADR이 대체함                         |
| `Deprecated` | 새 사용을 중단하지만 아직 제거되지 않음 |
| `Rejected`   | 검토했으나 채택하지 않음                |

설계 단계의 `Accepted`는 영구 불변을 뜻하지 않는다. 대체하려면 새 ADR에서 이유와 이행 계획을 기록한다.

---

## 2. ADR 목록

| ADR                                                                       | 상태       | 결정                                              | 재검토 신호                                |
| ------------------------------------------------------------------------- | ---------- | ------------------------------------------------- | ------------------------------------------ |
| [ADR-001](./0001-monorepo-pnpm-turborepo.md)                     | Accepted   | pnpm workspace + Turborepo 모노레포               | 팀·배포 경계가 독립 저장소를 요구          |
| [ADR-002](./0002-expo-react-native-mobile.md)                    | Accepted   | Expo 기반 React Native 모바일                     | 네이티브 제약이 지속적으로 제품을 막음     |
| [ADR-003](./0003-nextjs-app-router-web.md)                       | Accepted   | Next.js App Router 웹                             | 공개 렌더링·점주 앱 요구와 구조적 충돌     |
| [ADR-004](./0004-nestjs-modular-monolith.md)                     | Superseded | NestJS 모듈형 모놀리스 API                        | ADR-017이 초기 실행 방식 대체              |
| [ADR-005](./0005-postgresql-postgis-source-of-truth.md)          | Accepted   | PostgreSQL + PostGIS 원장                         | 검증된 규모·격리 요구가 분리 저장소 요구   |
| [ADR-006](./0006-drizzle-explicit-sql.md)                        | Accepted   | Drizzle + 명시적 SQL                              | ORM/SQL 생산성·안전성 검증 실패            |
| [ADR-007](./0007-opensearch-derived-index.md)                    | Superseded | OpenSearch 파생 검색 인덱스                       | ADR-017이 PostgreSQL 검색으로 대체         |
| [ADR-008](./0008-transactional-outbox.md)                        | Accepted   | PostgreSQL transactional outbox                   | 원자적 로그/CDC로 동등 보장 가능           |
| [ADR-009](./0009-aws-seoul-ecs-fargate.md)                       | Superseded | AWS 서울 + ECS/Fargate                            | ADR-017이 비용 우선 배포로 대체            |
| [ADR-010](./0010-rest-openapi.md)                                | Accepted   | REST/JSON + OpenAPI 3.1.2                         | 소비자 요구가 다른 계약 형태를 정당화      |
| [ADR-011](./0011-python-rating-worker.md)                        | Accepted   | 평점 계산 Python 워커 경계                        | API 언어 통합 또는 모델 서비스 분리가 유리 |
| [ADR-012](./0012-personal-data-isolation.md)                     | Accepted   | 개인정보 schema·저장소·권한 격리                  | 위협·규제·조직 경계가 더 강한 격리를 요구  |
| [ADR-013](./0013-contract-source-of-truth.md)                    | Accepted   | OpenAPI·JSON Schema 계약 원본과 생성 경계         | 도구 호환·소비자 수·registry 요구 변화     |
| [ADR-014](./0014-uuidv7-internal-opaque-public-ids.md)           | Accepted   | UUIDv7 내부 키 + 불투명 공개 ID                   | DB 버전·외부 표준·측정된 lookup 비용 변화  |
| [ADR-015](./0015-app-composition-and-server-packages.md)         | Accepted   | App composition root + `server-*` bounded context | 팀·SLO·scale·보안 배포 경계 성숙           |
| [ADR-016](./0016-production-isolation-and-artifact-promotion.md) | Superseded | Production account 격리 + immutable artifact 승격 | 민감 데이터·조직 규모 확대 시 재검토       |
| [ADR-017](./0017-cost-first-personal-project.md)                 | Accepted   | Vercel + Neon + PostgreSQL 검색의 월 0원 구조     | 상업화·무료 한도 80%·독립 SLO              |

---

## 3. 결정 의존성

```text
ADR-001 monorepo
 ├─ ADR-002 Expo
 ├─ ADR-003 Next.js
 ├─ ADR-015 app composition + server packages
 └─ ADR-017 cost-first single Next.js deploy

ADR-005 PostgreSQL/PostGIS
 ├─ ADR-006 Drizzle + SQL
 ├─ ADR-008 transactional outbox
 ├─ ADR-012 personal data isolation
 └─ ADR-014 UUIDv7/internal + opaque public ID

ADR-017 cost-first deployment
 ├─ supersedes ADR-004 initial runtime
 ├─ supersedes ADR-007 OpenSearch
 ├─ supersedes ADR-009 AWS/ECS
 └─ supersedes ADR-016 current environment model

ADR-010 REST/OpenAPI
 └─ ADR-013 contract source of truth

ADR-011 Python rating boundary
 └─ deferred until batch complexity requires it
```

하위 ADR을 바꿀 때 상위 결정의 전제가 유지되는지 확인한다.

---

## 4. ADR 필수 항목

```text
제목
상태
결정일
owners/검토자
맥락과 문제
결정 기준
결정
대안
긍정적 결과
부정적 결과·비용
보안·개인정보·운영 영향
구현/이행
검증 방법
재검토 조건
대체/되돌리기 비용
관련 문서
```

### ADR에 넣지 않는 것

- 쉽게 바뀌는 패키지 patch 버전
- 단일 함수 구현 세부
- 근거 없는 선호
- 이미 결정된 내용을 설명 없이 반복
- 공급자 마케팅 문구

---

## 5. 새 ADR 절차

1. 문제와 결정 기한을 먼저 작성한다.
2. 최소 두 가지 현실적인 대안을 비교한다.
3. 가역성, 운영, 비용, 보안, 팀 역량을 평가한다.
4. 영향받는 도메인 owner의 검토를 받는다.
5. 결정 후 status와 날짜를 갱신한다.
6. 코드·인프라·운영 문서가 결정과 일치하게 이행한다.
7. 재검토 신호를 관측할 지표 또는 사건으로 연결한다.

---

## 6. 대체 규칙

기존 ADR 본문을 새 결정에 맞춰 조용히 고치지 않는다.

- 새 ADR을 만든다.
- 새 ADR에 `Supersedes: ADR-NNN`을 적는다.
- 기존 ADR은 `Superseded by ADR-NNN`으로 바꾼다.
- 데이터·API·인프라·팀 이행 계획을 기록한다.
- 혼합 운영 기간과 rollback 조건을 정한다.

오탈자, 링크, 당시 맥락 보강은 기존 ADR에 수정 이력과 함께 반영할 수 있다.

---

## 7. 다음 ADR 후보

아직 결정되지 않은 항목:

| 후보                                  | 결정 시점                           |
| ------------------------------------- | ----------------------------------- |
| 인증: 자체 세션 계층 vs 관리형 공급자 | 계정 구현 전                        |
| 지도·지오코딩 공급자                  | Discovery spike 후                  |
| 국내 결제 공급자와 결제 흐름          | 유료 예약 설계 전                   |
| 문자·이메일 공급자                    | 예약 알림 pilot 전                  |
| 분석 warehouse·transform              | 이벤트량과 팀 요구 확인 후          |
| 운영자 SSO                            | 운영 콘솔 프로덕션 전               |
| feature flag 공급자/자체              | 지역 beta 전                        |
| KMS 키·민감 저장소 계정 경계          | 개인정보 프로덕션 전                |
| 예약 서비스를 독립 배포로 분리        | 부하·팀·SLO 임계점 도달 시          |
| semantic search/vector store          | lexical/structured 품질 gap 증명 후 |
| 다국어 번역 공급자·저장 정책          | 다국어 beta 전                      |

---

## 8. 검토 주기

- 구현 시작 전: Accepted ADR의 전제 확인
- 분기: 재검토 신호와 기술 부채
- 큰 장애 후: 관련 ADR의 실패 전제 확인
- 신규 팀/서비스 분리 전: ADR-001/004/005/008/009
- 법률·개인정보 변화: ADR-009/012

ADR 검토가 곧 기술 교체를 의미하지 않는다. 현재 선택이 여전히 최선인지 증거를 확인한다.

---

## 9. 연관 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
- [ROADMAP.md](../product/ROADMAP.md)
