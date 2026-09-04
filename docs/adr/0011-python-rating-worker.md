# ADR-011: 평점 계산 Python 워커 경계

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Trust/Data Science
- 검토자: Backend, Data Platform, Operations

## 맥락

공개 점수는 리뷰어 기준선, 방문·무결성 가중치, Bayesian shrinkage, 불확실성, 평가·shadow 발행을 포함한다. 모델 연구·수치 계산·데이터 평가 생태계는 Python이 유리하지만 API의 주 언어는 TypeScript다.

## 결정 기준

- 수치·통계 라이브러리
- 모델 연구와 재현
- API 런타임 격리
- 버전·승인·batch 발행
- 운영 단순성

## 결정

평점 계산을 Python batch/worker 경계로 둔다. 온라인 API 요청에서 Python 모델을 동기 호출해 공개 점수를 매번 계산하지 않는다.

```text
PostgreSQL input snapshot
 -> Python calculation artifact
 -> validation/shadow
 -> approved branch_score snapshot
 -> atomic publication
```

API는 승인된 결과를 읽는다.

## 대안

### TypeScript에서 전부 계산

언어 단일화는 장점이나 통계·평가·연구 workflow가 제한된다.

### 실시간 Python microservice

독립 모델 서빙은 가능하지만 공개 점수는 실시간 요청별 계산이 필요 없고 새 SLO·네트워크 실패가 생긴다.

### warehouse SQL만

집계는 가능하지만 복잡한 모델·simulation·artifact 관리가 어렵다.

## 긍정적 결과

- Python 수치·데이터 생태계
- 모델 artifact·notebook/evaluation 연계
- API 장애와 batch 실패 격리
- shadow·승인 발행
- 입력 snapshot 재현

## 부정적 결과

- 두 언어·build·dependency 운영
- schema contract 필요
- batch latency
- 부동소수점·library version 차이
- 데이터 접근 권한 확대 위험

## 통제

- versioned input/output schema
- immutable input snapshot
- locked dependencies/container digest
- deterministic ordering/seed
- golden portfolio와 tolerance
- Python worker는 최소 DB role
- 원문 개인정보 미사용
- atomic publish와 이전 snapshot 유지

## 검증

- 동일 artifact 재실행 결과
- 부분 실패
- model version 혼합 방지
- 광고·계약 필드가 input에 없음
- 대규모 계산 시간·비용
- 이전 버전 복구

## 재검토 조건

- 실시간 개인화 모델과 공통 서빙 플랫폼이 필요하다.
- Python 운영 비용이 모델 가치보다 커진다.
- warehouse/feature platform이 더 안정된 경계를 제공한다.

## 되돌리기 비용

입출력 snapshot 계약을 유지하면 구현 언어 교체 비용은 중간이다. 모델 logic과 artifact는 재검증해야 한다.

## 관련 문서

- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)

