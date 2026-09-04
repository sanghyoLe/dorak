# ADR-008: Transactional Outbox

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Platform
- 검토자: Backend, Data, Booking, Notifications

## 맥락

branch 변경 후 검색 색인, 예약 확정 후 알림·점주 보드, 리뷰 게시 후 평점 재계산처럼 DB 변경과 비동기 이벤트 발행이 함께 필요하다. DB commit과 메시지 broker publish를 하나의 원자 작업으로 가정하면 이벤트 유실 또는 ghost event가 생긴다.

## 결정 기준

- DB 변경과 이벤트 기록의 원자성
- 재시도·중복 처리
- 순서·버전
- 모듈형 모놀리스 단순성
- 감사·재생

## 결정

도메인 트랜잭션 안에서 `outbox_event`를 기록하고 별도 publisher가 broker/queue로 발행한다.

```text
BEGIN
  mutate aggregate
  append status/audit if required
  insert outbox_event
COMMIT

publisher -> broker -> idempotent consumers
```

전송은 at-least-once이며 consumer는 eventId와 aggregateVersion으로 멱등 처리한다.

## 대안

### DB commit 후 직접 publish

구현은 단순하지만 process crash 구간에서 이벤트가 유실된다.

### publish 후 DB commit

DB rollback 시 존재하지 않는 변경 이벤트가 발행된다.

### 분산 트랜잭션/2PC

복잡도와 broker/DB 지원·운영 부담이 크다.

### CDC만 사용

유망하지만 비즈니스 이벤트 의미, payload, 초기 운영 도구가 추가로 필요하다. 향후 outbox CDC publisher로 발전할 수 있다.

## 긍정적 결과

- 핵심 상태와 이벤트 기록 원자성
- publisher 장애 시 backlog 보존
- 재생·감사 가능
- broker 교체와 domain transaction 분리

## 부정적 결과

- 최종 일관성 지연
- outbox table 증가·보존
- 중복 소비 필수
- aggregate 순서와 poison event 처리 필요

## 통제

- eventId unique
- aggregateType/Id/Version
- payload version
- publisher claim/lock와 retry
- DLQ가 원본 삭제를 의미하지 않음
- lag SLO/alert
- partition/retention 기준
- consumer idempotency store 또는 원자 처리

## 검증

- commit 직후 process kill
- publish 성공 응답 전 timeout
- 중복·역순
- consumer crash
- 대규모 backlog replay
- 예약·알림, branch·index E2E

## 재검토 조건

- 검증된 CDC 플랫폼이 동일 보장을 더 단순하게 제공한다.
- 서비스가 독립 DB를 가져 event architecture가 변한다.
- 처리량이 현재 publisher 방식 한계를 넘는다.

## 되돌리기 비용

event contract와 consumer 멱등성은 유지할 수 있다. publisher 구현을 CDC로 바꾸는 비용은 중간이다.

## 관련 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
