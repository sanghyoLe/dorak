# 도락 예약·좌석·결제 시스템 설계

> 실행 우선순위 안내: 예약·결제는 현재 MVP 범위가 아니다. 구현을 시작할 때 무료 인프라가 거래 정확성·알림 시간·개인정보 보호를 충족하는지 새 ADR로 검토하며, 비용 절감을 이유로 이 문서의 강한 일관성 원칙을 낮추지 않는다.

> 상태: 초안 v0.1  
> 범위: 자체 예약, 점주 예약대장, 예약금·환불, 웨이팅, 외부 채널 경계  
> 기본 시간대: 지점별 IANA timezone, 국내 초기값 `Asia/Seoul`  
> 연관 문서: [PRODUCT.md](../product/PRODUCT.md), [DATA_MODEL.md](../architecture/DATA_MODEL.md), [API_DESIGN.md](../architecture/API_DESIGN.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)

---

## 1. 목적

도락 예약 시스템은 사용자가 실제로 사용할 수 있는 시간과 조건을 확인하고, 중복 판매 없이 예약하며, 점주가 모든 유입 채널을 한 예약대장에서 운영하게 한다.

핵심 목표는 다음과 같다.

- 동시에 여러 사용자가 마지막 자리를 선택해도 초과 예약하지 않는다.
- 조회된 가용성과 실제 확정 결과가 다를 수 있음을 명확히 처리한다.
- 예약 상태와 결제 상태를 분리해 부분 실패를 복구할 수 있게 한다.
- 전화, 현장, 도락, 외부 채널 예약을 하나의 운영 화면에서 구분해 다룬다.
- 변경·취소·환불의 주체, 사유, 정책 버전, 금액을 감사 가능하게 남긴다.
- 예약 완료를 방문 신호로 활용하되 실제 방문과 동일시하지 않는다.

---

## 2. 범위와 비범위

### 2.1 포함

- 날짜·시간·인원별 가용성
- 즉시 확정과 점주 승인형 예약
- 테이블, 룸, 카운터, 좌석 조합, 용량형 재고
- 코스, 이용 시간, 최소 주문, 예약금
- 짧은 재고 hold
- 예약 생성·변경·취소·완료·노쇼
- 결제 시도, 취소 수수료, 전액·부분 환불
- 점주 예약대장과 수동 예약
- 웨이팅과 취소 자리 알림
- 외부 예약 채널 연동 경계
- 거래 알림과 운영 조정

### 2.2 초기 비범위

- POS 전체 기능
- 테이블 주문과 주방 티켓
- 배달·포장 주문
- 항공권 수준의 복잡한 가격 변동
- 식당 간 좌석 재판매 시장
- 사용자 간 예약 양도

비범위 기능을 위해 예약 핵심 상태를 오염시키지 않는다. 필요하면 별도 도메인으로 연결한다.

---

## 3. 예약 원칙

### 3.1 가용성 조회는 확약이 아니다

조회 결과는 그 시점의 스냅샷이다. 사용자가 결제를 마칠 때까지 다른 예약이 생길 수 있으므로 확정 전 재고를 원자적으로 다시 검증한다.

### 3.2 상태는 덮어쓰지 않고 전이한다

현재 상태만 저장하는 것에 그치지 않고 모든 상태 변경을 이력으로 남긴다. 과거 상태 행을 수정하지 않는다.

### 3.3 결제 성공과 예약 확정은 서로 다른 사실이다

결제가 성공했지만 예약 기록 반영이 지연될 수 있고, 예약 요청을 받았지만 아직 결제가 필요할 수 있다. 각 상태를 독립적으로 기록하고 조정 작업으로 수렴시킨다.

### 3.4 정책은 예약 당시 버전으로 고정한다

점주가 다음 날 취소 정책을 바꾸더라도 이미 확정한 예약에는 당시 동의한 정책 스냅샷을 적용한다.

### 3.5 자동화가 모호하면 운영 큐로 보낸다

결제 승인 여부, 외부 채널 상태, 환불 금액이 불명확하면 추측하지 않는다. `reconciliation_required` 상태와 사건을 만든다.

### 3.6 점주 편의 때문에 소비자 권리를 숨기지 않는다

예약 전 총 금액, 예약금, 취소 기한, 수수료, 확정 방식, 좌석 유형을 명확히 표시한다. 사전 선택된 유료 옵션을 두지 않는다.

---

## 4. 예약 방식

### 4.1 즉시 확정형 `instant`

재고와 필수 결제 조건이 충족되면 서버가 즉시 확정한다.

```text
availability -> hold -> payment if needed -> confirmed
```

### 4.2 점주 승인형 `request`

사용자가 요청을 제출하고 점주가 제한 시간 안에 승인 또는 거절한다.

```text
availability -> requested -> confirmed
                         -> rejected
                         -> expired
```

승인 전 카드 보증이 필요하다면 승인 가능 금액을 임시 인증할 수 있으나 실제 매입 시점과 자동 해제 규칙을 명시한다.

### 4.3 외부 연결형 `external_redirect`

도락은 외부 예약 페이지로 연결하며 자체 예약처럼 표시하지 않는다.

- 결과를 알 수 없으면 도락 예약 내역에 `confirmed`를 만들지 않는다.
- 파트너 콜백으로 확인 가능한 경우 출처와 외부 예약 ID를 저장한다.
- 외부 서비스 정책, 결제, 고객지원 주체를 전환 전에 표시한다.

### 4.4 전화형 `phone`

전화번호를 제공하는 탐색 행동이다. 통화 클릭만으로 예약을 생성하지 않는다. 점주가 통화 결과를 예약대장에 입력한 경우 `manual_phone` 출처 예약이 생긴다.

---

## 5. 핵심 개념

```text
branch
 └─ booking_policy
     ├─ service_period
     ├─ bookable_resource
     ├─ resource_combination
     ├─ availability_rule
     ├─ availability_exception
     ├─ course / booking_option
     └─ cancellation_policy_version

availability request
 └─ candidate allocation
     └─ reservation_hold
         └─ reservation
             ├─ party and contact vault reference
             ├─ resource allocation
             ├─ status history
             ├─ payment_intent -> charge -> refund
             └─ notification and audit events
```

---

## 6. 엔터티 설계

### 6.1 `booking_policy`

지점의 예약 운영 기본값이다.

| 필드                             | 설명                          |
| -------------------------------- | ----------------------------- |
| `id`                             | 정책 식별자                   |
| `branch_id`                      | 대상 지점                     |
| `timezone`                       | IANA 시간대                   |
| `confirmation_mode`              | `instant`, `request`, `mixed` |
| `booking_window_days`            | 며칠 뒤까지 열지              |
| `minimum_lead_minutes`           | 최소 사전 예약 시간           |
| `default_duration_minutes`       | 기본 이용 시간                |
| `slot_interval_minutes`          | 화면 노출 간격                |
| `max_party_size_online`          | 온라인 최대 인원              |
| `hold_ttl_seconds`               | hold 기본 시간                |
| `request_response_minutes`       | 승인형 응답 기한              |
| `version`                        | 낙관적 잠금 버전              |
| `effective_from`, `effective_to` | 적용 기간                     |

정책은 미래 적용 예약을 지원한다. 편집 시 이미 생성된 슬롯과 기존 예약에 미치는 영향을 미리 계산한다.

### 6.2 `service_period`

점심, 저녁, 심야처럼 예약 운영 구간을 표현한다.

| 필드                                 | 설명           |
| ------------------------------------ | -------------- |
| `branch_id`                          | 지점           |
| `name`                               | 점심, 저녁 등  |
| `days_of_week`                       | 적용 요일      |
| `start_local_time`, `end_local_time` | 현지 시간      |
| `last_seating_local_time`            | 마지막 입장    |
| `default_duration_minutes`           | 기본 이용 시간 |
| `turn_buffer_minutes`                | 정리 시간      |

자정을 넘는 영업은 영업일 기준 날짜와 실제 timestamp를 모두 저장해 구분한다.

### 6.3 `bookable_resource`

| 필드                               | 설명                                        |
| ---------------------------------- | ------------------------------------------- |
| `id`                               | 자원 식별자                                 |
| `branch_id`                        | 지점                                        |
| `resource_type`                    | `table`, `room`, `counter`, `capacity_pool` |
| `name`                             | 점주 내부 표시명                            |
| `min_party_size`, `max_party_size` | 수용 인원                                   |
| `capacity_units`                   | 용량형 재고 단위                            |
| `accessible`                       | 접근성 속성                                 |
| `smoking_policy`                   | 해당 구역 정책                              |
| `status`                           | `active`, `inactive`, `maintenance`         |
| `version`                          | 변경 버전                                   |

실제 테이블 번호 같은 내부 정보는 기본적으로 소비자에게 노출하지 않는다. 소비자에게는 `룸`, `카운터`, `일반석`처럼 예약 조건에 필요한 유형만 보여 준다.

### 6.4 `resource_combination`

두 테이블을 붙이는 등의 허용 조합이다.

| 필드                               | 설명           |
| ---------------------------------- | -------------- |
| `id`                               | 조합 식별자    |
| `resource_ids`                     | 구성 자원      |
| `min_party_size`, `max_party_size` | 조합 수용 인원 |
| `setup_buffer_minutes`             | 준비 시간      |
| `priority`                         | 배정 우선순위  |
| `active`                           | 사용 여부      |

모든 가능한 조합을 런타임에 생성하지 않는다. 점주가 허용한 조합만 사용해 계산 폭증과 잘못된 배정을 막는다.

### 6.5 `availability_rule`

정기적인 판매 규칙이다.

```text
branch/resource scope
day of week
service period
bookable start times or interval
party-size range
duration
channel allocation
course constraints
effective period
```

### 6.6 `availability_exception`

특정 날짜의 휴무, 특별 영업, 대관, 재고 감소, 이벤트를 표현한다.

우선순위:

```text
resource-specific exception
branch date exception
regular availability rule
regular opening hours
```

예외가 충돌하면 더 구체적인 범위와 최신 승인 버전을 적용하되, 운영 화면에 충돌 경고를 표시한다.

### 6.7 `booking_course`

| 필드                  | 설명                      |
| --------------------- | ------------------------- |
| `id`                  | 코스 식별자               |
| `branch_id`           | 지점                      |
| `name`, `description` | 소비자 표시               |
| `price_per_person`    | 1인 금액                  |
| `minimum_party_size`  | 최소 인원                 |
| `duration_minutes`    | 이용 시간                 |
| `prepayment_type`     | 없음, 예약금, 전액 선결제 |
| `menu_snapshot_ref`   | 예약 시점 메뉴 설명       |
| `allergen_notice`     | 알레르기 고지             |
| `status`              | 판매 상태                 |

코스 메뉴가 바뀌어도 기존 예약에서 사용자가 동의한 설명과 가격은 스냅샷으로 남긴다.

### 6.8 `reservation_slot`

검색과 화면 표시를 위한 파생된 판매 단위다.

| 필드                   | 설명                     |
| ---------------------- | ------------------------ |
| `id`                   | 슬롯 식별자              |
| `branch_id`            | 지점                     |
| `starts_at`, `ends_at` | 절대 시각                |
| `local_service_date`   | 지점 영업일              |
| `party_size_bucket`    | 지원 인원 범위 또는 버킷 |
| `course_id`            | 선택 코스                |
| `confirmation_mode`    | 확정 방식                |
| `sellable_status`      | 판매 상태                |
| `availability_version` | 계산 입력 버전           |

슬롯은 최종 재고 원장이 아니다. 검색 최적화를 위한 읽기 모델이며 확정 시 실제 자원 점유를 다시 계산한다.

### 6.9 `reservation_hold`

| 필드                   | 설명                                        |
| ---------------------- | ------------------------------------------- |
| `id`                   | hold 식별자                                 |
| `user_account_id`      | 사용자                                      |
| `branch_id`            | 지점                                        |
| `slot_id`              | 조회 슬롯                                   |
| `allocation_candidate` | 잠정 자원 배정                              |
| `party_size`           | 인원                                        |
| `status`               | `active`, `consumed`, `expired`, `released` |
| `expires_at`           | 만료 시각                                   |
| `idempotency_scope`    | 중복 처리 범위                              |

hold는 결제창을 무기한 열어 둔 사용자가 재고를 잠그지 못하게 짧게 유지한다. 만료 후 결제가 돌아오면 자동 확정하지 않고 조정 로직을 거친다.

### 6.10 `reservation`

| 필드                       | 설명                                                      |
| -------------------------- | --------------------------------------------------------- |
| `id`                       | 도락 예약 식별자                                          |
| `confirmation_code`        | 사용자·점주용 짧은 확인 코드                              |
| `branch_id`                | 지점                                                      |
| `user_account_id`          | 계정, 비회원 지원 시 선택                                 |
| `source_channel`           | `dorak`, `manual_phone`, `walk_in`, `partner`, `imported` |
| `external_reference`       | 외부 시스템 참조, 암호화/제한                             |
| `starts_at`, `ends_at`     | 예약 점유 시간                                            |
| `local_service_date`       | 영업일                                                    |
| `party_size`               | 예약 인원                                                 |
| `course_snapshot`          | 코스·가격 스냅샷                                          |
| `policy_snapshot`          | 취소·환불 정책 스냅샷                                     |
| `status`                   | 예약 상태                                                 |
| `payment_summary_status`   | 결제 요약 상태                                            |
| `confirmation_mode`        | 생성 당시 방식                                            |
| `special_request`          | 요청사항, 제한 접근                                       |
| `resource_version`         | 동시 수정 버전                                            |
| `created_at`, `updated_at` | 시각                                                      |

예약 행의 상태를 바꿀 때마다 `reservation_status_history`와 outbox 이벤트를 같은 트랜잭션에서 기록한다.

### 6.11 `reservation_party`

공개 프로필과 분리된 개인정보 영역에 둔다.

| 필드                         | 설명                    |
| ---------------------------- | ----------------------- |
| `reservation_id`             | 예약                    |
| `booker_name_ciphertext`     | 예약자명 암호문         |
| `contact_ref`                | 전화·이메일 보관소 참조 |
| `party_size`                 | 총 인원                 |
| `adult_count`, `child_count` | 필요한 경우만           |
| `highchair_count`            | 선택                    |
| `accessibility_request`      | 명시적 입력, 제한 접근  |
| `retention_until`            | 보존 종료 시각          |

동행자의 이름과 연락처를 기본 수집하지 않는다. 실제 운영상 반드시 필요한 경우 목적과 고지를 별도로 설계한다.

### 6.12 `reservation_allocation`

예약과 실제 자원 점유를 연결한다.

```text
reservation_id
resource_id or combination_id
occupies_from
occupies_until
allocation_status
created_by
```

사용자 입장·퇴장 시각과 재고 점유 시간은 다를 수 있다. 정리 buffer까지 점유 시간에 포함한다.

---

## 7. 예약 상태 머신

### 7.1 정규 상태

```text
requested
confirmed
change_proposed
cancellation_pending
cancelled
rejected
expired
seated
completed
no_show
```

hold와 결제 시도는 예약 상태가 아니라 별도 엔터티 상태다.

### 7.2 의미

| 상태                   | 의미                                        |
| ---------------------- | ------------------------------------------- |
| `requested`            | 점주 응답을 기다리는 예약 요청              |
| `confirmed`            | 지점이 수용하기로 확정, 재고 점유           |
| `change_proposed`      | 한쪽이 변경안을 제안, 기존 확정 조건은 유지 |
| `cancellation_pending` | 외부 결제·파트너 처리 때문에 취소 완료 대기 |
| `cancelled`            | 예약 취소 완료                              |
| `rejected`             | 점주 또는 정책이 요청을 거절                |
| `expired`              | 승인·결제·사용자 응답 기한 만료             |
| `seated`               | 점주가 착석 처리                            |
| `completed`            | 식사 이용 완료로 처리                       |
| `no_show`              | 유예시간 이후 미방문 판정                   |

### 7.3 허용 전이

```text
requested -> confirmed
requested -> rejected
requested -> expired
requested -> cancelled

confirmed -> change_proposed
confirmed -> cancellation_pending
confirmed -> cancelled
confirmed -> seated
confirmed -> no_show

change_proposed -> confirmed        # 제안 거절 또는 기존 조건 복귀
change_proposed -> confirmed        # 제안 수락 후 새 스냅샷으로 확정
change_proposed -> cancelled
change_proposed -> expired          # 제안 만료, 기존 예약은 정책에 따라 복귀 가능

cancellation_pending -> cancelled
cancellation_pending -> confirmed  # 외부 취소 실패, 명시적 조정 후만

seated -> completed
seated -> cancelled                 # 운영자 예외 처리만
no_show -> completed                # 오판 정정
```

동일한 `confirmed -> confirmed` 변경은 새 버전과 상태 이력 이벤트로 남긴다. 시작 시각, 인원, 코스, 가격이 바뀌면 이전 스냅샷을 보존한다.

### 7.4 종료 상태

일반적으로 `cancelled`, `rejected`, `expired`, `completed`, `no_show`는 종료 상태다. 다만 분쟁 정정은 별도의 권한 있는 명령으로 가능하며 원래 이력을 삭제하지 않는다.

### 7.5 상태 전이 레코드

```text
reservation_id
from_status
to_status
actor_type and actor_id
reason_code
note_ref
request_id
occurred_at
effective_at
```

`occurred_at`은 기록 시각, `effective_at`은 실제 효력 시각이다. 외부 채널 지연 이벤트를 구분할 때 필요하다.

---

## 8. 변경 제안 모델

예약을 바로 덮어쓰면 양쪽이 무엇에 동의했는지 알 수 없다. `reservation_change_proposal`을 별도로 둔다.

| 필드                       | 설명                                                      |
| -------------------------- | --------------------------------------------------------- |
| `id`                       | 제안 식별자                                               |
| `reservation_id`           | 대상 예약                                                 |
| `proposed_by`              | 사용자, 점주, 운영자                                      |
| `base_reservation_version` | 제안 기준 버전                                            |
| `proposed_changes`         | 시간, 인원, 코스 등                                       |
| `price_delta`              | 추가·환불 예정 금액                                       |
| `policy_impact`            | 취소 정책 변화                                            |
| `status`                   | `pending`, `accepted`, `rejected`, `expired`, `withdrawn` |
| `expires_at`               | 응답 기한                                                 |

원칙:

- 변경 제안 중에도 기존 확정 예약과 재고는 유지한다.
- 새 시간 재고는 필요하면 별도 hold한다.
- 금액이 늘면 추가 결제 성공 후 변경을 확정한다.
- 금액이 줄면 변경 확정과 환불 의무를 함께 기록한다.
- 점주가 일방적으로 불리한 조건을 확정할 수 없다.

---

## 9. 가용성 계산

### 9.1 입력

```text
branch and timezone
local service date
party size
requested time or range
course and duration
seat preferences
channel
booking policy version
regular rules and exceptions
existing holds and allocations
resource combinations
```

### 9.2 계산 단계

1. 지점 운영 상태와 예약 기능 활성화를 확인한다.
2. 현지 영업일과 서비스 구간을 계산한다.
3. 휴무·대관·특별 영업 예외를 적용한다.
4. 사전 예약 시간과 예약 오픈 기간을 적용한다.
5. 코스의 인원, 시간, 채널 조건을 적용한다.
6. 자원별 기존 점유와 유효 hold를 뺀다.
7. 허용된 조합 중 인원 낭비가 적고 운영 선호에 맞는 후보를 찾는다.
8. 소비자에게 노출할 슬롯과 정책 요약을 만든다.

### 9.3 자원 배정 우선순위

예시 비용 함수:

```text
allocation_cost =
  unused_capacity_penalty
  + combination_penalty
  + preference_mismatch_penalty
  + future_fragmentation_penalty
  + operational_priority
```

단순히 가장 작은 테이블을 배정하면 뒤 시간대에 큰 예약을 막을 수 있다. 초기에는 설명 가능한 휴리스틱을 사용하고 실제 예약 손실률을 측정한다.

### 9.4 슬롯 사전 생성과 동적 검증

- 앞으로 일정 기간의 슬롯 후보는 미리 생성해 검색에 사용한다.
- 규칙 변경 시 영향 날짜를 재생성한다.
- 예약 확정 시 PostgreSQL의 현재 자원 점유를 동적으로 검증한다.
- 검색 색인과 Redis의 `available` 값은 최종 진실이 아니다.

### 9.5 인원 변경

- 인원 감소는 코스 최소 인원, 테이블 정책, 환불을 다시 계산한다.
- 인원 증가는 새 자원 배정이 성공해야 확정한다.
- 어린이·유아를 수용 인원에서 제외할지 점주가 임의 해석하지 않도록 정책 필드로 명시한다.

---

## 10. 재고 일관성과 동시성

### 10.1 확정 트랜잭션

즉시 예약의 핵심 트랜잭션:

```text
BEGIN
  validate idempotency ownership
  lock or conditionally claim candidate resources
  validate hold status and expiry
  validate no overlapping active allocation
  create reservation
  create allocation rows
  consume hold
  append status history
  append outbox event
COMMIT
```

### 10.2 겹침 방지

테이블형 자원은 활성 예약 시간 범위가 겹치지 않도록 PostgreSQL range와 exclusion constraint 또는 동등한 잠금 전략을 검토한다.

용량형 자원은 다음 중 하나를 사용한다.

- 슬롯별 잔여 용량의 원자적 조건부 감소
- 시간 버킷별 점유 합을 트랜잭션에서 검증
- 고정된 inventory unit을 개별 할당

정확성 검증 없이 Redis 분산 락 하나에 최종 재고를 맡기지 않는다.

### 10.3 교착과 재시도

- 자원 잠금 순서를 ID 기준으로 고정한다.
- 짧은 트랜잭션만 유지한다.
- 결제사 네트워크 호출을 DB 잠금 안에서 하지 않는다.
- 직렬화 실패나 교착은 제한 횟수만 재시도한다.
- 재시도 전체가 동일 멱등키 결과로 수렴해야 한다.

### 10.4 hold 공정성

- 계정당 동일 지점 활성 hold 수를 제한한다.
- 동일 연락처·결제수단의 반복 hold를 위험 신호로 본다.
- 인기 예약 오픈에는 대기열 또는 공정한 진입 제어를 사용할 수 있다.
- 봇 방지 때문에 접근성 사용자를 과도하게 차단하지 않게 대체 인증을 둔다.

---

## 11. 결제 모델

### 11.1 결제 유형

| 유형              | 의미                                         |
| ----------------- | -------------------------------------------- |
| `none`            | 결제 없음                                    |
| `deposit`         | 예약금 결제                                  |
| `full_prepayment` | 코스 전체 선결제                             |
| `card_guarantee`  | 노쇼 등에 대비한 카드 인증·보증              |
| `post_charge`     | 정책에 따른 사후 수수료, 법률·약관 검토 필수 |

### 11.2 엔터티 분리

```text
reservation
 ├─ payment_intent
 │   ├─ payment_attempt
 │   └─ charge
 ├─ cancellation_charge
 └─ refund
```

예약에 `paid=true` 하나만 두지 않는다.

### 11.3 `payment_intent`

| 필드                            | 설명                                                  |
| ------------------------------- | ----------------------------------------------------- |
| `id`                            | 내부 결제 의도                                        |
| `reservation_id` 또는 `hold_id` | 대상                                                  |
| `purpose`                       | `deposit`, `prepayment`, `change`, `cancellation_fee` |
| `amount`, `currency`            | 요청 금액                                             |
| `status`                        | 결제 의도 상태                                        |
| `provider`                      | 어댑터 공급자                                         |
| `provider_reference`            | 제한 접근 참조                                        |
| `idempotency_key`               | 공급자 요청 재시도 키                                 |
| `expires_at`                    | 유효 시각                                             |

결제 상태:

```text
requires_method
requires_action
processing
succeeded
failed
cancelled
unknown
```

### 11.4 결제와 예약 순서

#### 즉시 확정 + 예약금

1. 재고 hold를 만든다.
2. 결제 의도를 생성한다.
3. 사용자 인증을 완료한다.
4. 결제 성공을 확인한다.
5. hold를 소비하며 예약을 확정한다.
6. 5단계가 실패하면 자동 취소·환불 또는 조정 의무를 생성한다.

결제 전 DB 잠금을 유지하지 않는다.

#### 승인형 + 예약금

가능한 정책:

- 요청 시 카드 인증, 점주 승인 시 매입
- 점주 승인 후 사용자 결제 요청
- 요청 시 예약금 결제, 거절 시 자동 전액 환불

지점별 선택을 허용하더라도 사용자에게 승인·매입 시점을 명확히 설명한다. 초기 v1은 운영 복잡도를 줄이기 위해 한 가지 흐름만 지원한다.

### 11.5 공급자 웹훅

- 원본 본문으로 서명을 검증한다.
- 이벤트 ID로 중복 제거한다.
- 발생 시각과 상태 순서를 함께 검증한다.
- 콜백 성공만으로 내부 예약을 찾지 못하면 조정 큐에 넣는다.
- 브라우저 리디렉션 성공 화면을 결제 성공의 최종 근거로 사용하지 않는다.

### 11.6 조정 `reconciliation`

정기 작업이 내부 결제 상태와 공급자 조회 결과를 비교한다.

```text
internal processing too long
webhook received without matching intent
succeeded payment without confirmed/requested reservation
refund requested but provider pending
amount mismatch
duplicate provider references
```

금전 불일치는 자동 삭제하지 않고 사건, 금액, 책임자, 해결 결과를 기록한다.

---

## 12. 취소와 환불

### 12.1 취소 정책 버전

```text
policy version id
branch and course scope
effective period
timezone
cutoff rules
fee schedule
no-show fee
party-size reduction rule
merchant cancellation compensation rule
user-facing summary version
full legal text version
```

예약에는 정책 ID뿐 아니라 핵심 계산 입력을 스냅샷으로 남긴다.

### 12.2 취소 견적

취소 확정 전 서버가 다음을 반환한다.

```json
{
  "reservationId": "rsv_123",
  "refundAmount": 10000,
  "cancellationFee": 10000,
  "currency": "KRW",
  "calculatedAt": "2026-09-02T08:00:00Z",
  "quoteExpiresAt": "2026-09-02T08:05:00Z",
  "policyVersionId": "cp_7"
}
```

취소 시각 경계에서 분쟁이 생기지 않게 서버 수신 시각과 지점 시간대를 사용한다.

### 12.3 환불 상태

```text
requested -> processing -> succeeded
                        -> failed
                        -> manual_review
```

예약 `cancelled`와 환불 `succeeded`는 동시에 완료되지 않을 수 있다. 사용자 화면에 각각 상태와 예상 처리 기간을 표시한다.

### 12.4 점주 취소

점주가 예약을 취소할 때:

- 소비자 귀책 수수료를 부과하지 않는다.
- 미사용 예약금과 선결제는 전액 환불 대상으로 기록한다.
- 사유와 담당자를 남긴다.
- 사용자에게 즉시 거래 알림을 보낸다.
- 반복 취소율을 지점 품질과 운영 위험 지표로 본다.

보상 정책은 별도 사업 정책과 법률 검토 후 정한다.

### 12.5 예외 환불

운영자는 정책 계산 결과를 임의 덮어쓰지 않고 `refund_adjustment`를 생성한다. 승인자, 사유, 원래 금액, 조정 금액을 기록하며 고액은 이중 승인을 요구한다.

---

## 13. 노쇼와 방문 판정

### 13.1 노쇼 후보

예약 시작 후 지점별 유예시간이 지나고 다음 신호가 없으면 후보가 된다.

- 착석 처리
- 점주 완료 처리
- 사용자 체크인
- 결제 또는 POS 신호
- 운영자 확인

자동으로 즉시 확정하지 않고 점주 확인 또는 충분한 신호를 요구할 수 있다.

### 13.2 이의 제기

- 사용자는 노쇼 판정에 이의를 제기할 수 있다.
- 점주는 착석 기록과 제한된 증빙을 제공할 수 있다.
- 운영자는 필요한 최소 정보만 열람한다.
- 정정 시 원래 판정을 삭제하지 않고 `no_show -> completed` 이력을 남긴다.

### 13.3 리뷰 인증과의 관계

| 예약 신호   | 방문 인증 의미                        |
| ----------- | ------------------------------------- |
| `confirmed` | 방문 예정, 인증 아님                  |
| `seated`    | 강한 방문 후보                        |
| `completed` | 강한 방문 후보, 독립 무결성 검사 필요 |
| `no_show`   | 방문 인증 불가, 이의 제기 가능        |
| `cancelled` | 방문 인증 불가                        |

점주와 사용자가 공모할 수 있으므로 예약 완료 하나만으로 평점 가중치를 최대화하지 않는다.

---

## 14. 점주 예약대장

### 14.1 보기

- 일간 타임라인
- 테이블·룸별 배치
- 미배정 요청
- 승인 대기
- 변경 응답 대기
- 결제·환불 문제
- 입장 예정, 지연, 노쇼 후보
- 전화·현장·외부 채널 출처

### 14.2 점주 작업

- 수동 예약 등록
- 자원 배정 및 변경
- 요청 승인·거절
- 변경안 제안
- 착석·완료·노쇼 처리
- 휴무·대관·재고 차단
- 연락 시도 기록
- 예약 메모

### 14.3 민감정보 최소화

- 메뉴 편집자와 분석가는 예약 연락처를 볼 수 없다.
- 예약 담당자에게도 필요한 기간에만 마스킹 해제를 허용한다.
- 전화번호 전체 보기와 복사는 감사 이벤트가 될 수 있다.
- 예약 종료 후 운영 필요 기간이 지나면 콘솔에서 마스킹한다.
- 자유 메모에 건강정보나 과도한 개인정보를 쓰지 않도록 안내·필터링한다.

### 14.4 수동 예약

점주가 입력하는 전화·현장 예약에도 다음을 기록한다.

```text
source channel
created by member
contact collection context
notification permission for this transaction
resource allocation
policy communication status
```

점주가 수동 등록한 전화번호를 도락 마케팅 동의로 간주하지 않는다.

### 14.5 오프라인·연결 끊김

점주 콘솔이 오프라인일 때 확정 예약을 로컬에서 새로 발급하지 않는다. 읽기 전용 캐시와 임시 메모는 가능하지만 서버 재연결 후 충돌 확인을 거쳐야 한다.

---

## 15. 외부 채널과 재고

### 15.1 연동 방식

| 방식           | 특성                                          |
| -------------- | --------------------------------------------- |
| 링크 연결      | 재고 동기화 없음, 외부 책임 명시              |
| 채널별 할당    | 도락에 고정 수량 배정, 단순하지만 비효율 가능 |
| 공유 재고 API  | 실시간 조회·차감, 지연·중복·역순 처리 필요    |
| 중앙 예약 원장 | 도락 또는 파트너 한 곳이 최종 재고 보유       |

### 15.2 외부 ID 매핑

공급자의 음식점·좌석·예약 ID를 도락 내부 ID로 사용하지 않는다.

```text
provider
provider_location_id
dorak_branch_id
provider_resource_id
dorak_resource_id
mapping_status
verified_at
```

### 15.3 이벤트 순서

외부 변경 이벤트에는 공급자 버전 또는 발생 시각을 저장한다. 늦게 도착한 오래된 이벤트가 최신 상태를 되돌리지 않게 한다.

### 15.4 불일치 대응

- 외부 예약을 받았는데 자원이 없으면 자동으로 사용자를 취소하지 않고 점주 조정 큐에 올린다.
- 중복 외부 참조는 격리한다.
- 동기화 지연이 임계치를 넘으면 해당 채널의 즉시 확정을 잠시 닫을 수 있다.
- 점주 화면에 마지막 동기화 시각과 기능 저하 상태를 표시한다.

---

## 16. 웨이팅과 취소 자리 알림

### 16.1 두 기능의 구분

- `waitlist`: 당일 현장 순번 대기
- `cancellation_alert`: 미래 예약 취소 자리 알림

알림 신청은 예약이 아니다. 자리가 나도 자동 보장되지 않는다면 이를 명확히 표시한다.

### 16.2 `waitlist_entry`

```text
branch_id
party_size
contact_ref
joined_at
estimated_range
status
notification_attempts
checked_in_at
seated_at
expired_at
```

상태:

```text
waiting -> notified -> accepted -> seated -> completed
waiting/notified -> cancelled
notified -> expired
```

### 16.3 순번 공정성

기본은 가입 시각이지만 다음을 정책으로 명시할 수 있다.

- 인원에 맞는 테이블 가용성
- 접근성 좌석 필요
- 예약과 현장 대기의 재고 분리
- 호출 후 응답 기한

유료 고객이나 광고 구매 여부로 순번을 비공개 변경하지 않는다.

### 16.4 취소 자리 제안

동시에 모든 사람에게 보내 경쟁시키는 방식과 순차 hold 방식 중 하나를 명시한다. v1은 짧은 순차 제안으로 불필요한 경쟁과 알림 폭주를 줄이는 방안을 우선 검토한다.

---

## 17. 알림

### 17.1 거래 알림

- 요청 접수
- 예약 확정·거절
- 결제 필요
- 변경 제안·응답 기한
- 예약 임박
- 취소·환불 상태
- 점주 취소
- 웨이팅 호출

거래 알림은 마케팅 수신 동의와 분리한다. 다만 사용자가 선택한 채널이 실패할 경우 필수 거래 정보를 전달할 합리적 대체 경로를 정책화한다.

### 17.2 알림 이벤트

```text
event id
reservation id
recipient role
template version
locale
channel
deduplication key
send status
provider reference
sent/delivered/failed timestamps
```

### 17.3 중복과 순서

- 예약 버전별 알림 dedupe key를 사용한다.
- 확정 뒤 늦게 도착한 요청 접수 알림은 보내지 않는다.
- 결제나 환불의 불확실한 상태를 성공처럼 표현하지 않는다.
- 메시지 본문에는 필요 이상의 요청사항이나 민감정보를 넣지 않는다.

---

## 18. 운영 사건

### 18.1 자동 사건 생성 조건

- 결제 성공인데 예약이 없음
- 취소 완료인데 환불이 장기 지연
- 같은 자원에 겹치는 활성 예약
- 승인 응답 기한 초과
- 외부 채널 버전 충돌
- 점주 연속 취소 급증
- 비정상적인 hold 또는 예약 생성 패턴
- 노쇼 수수료 이의 제기
- 연락처 접근 이상 패턴

### 18.2 우선순위

| 우선순위 | 예                                 |
| -------- | ---------------------------------- |
| P0       | 광범위한 중복 예약, 결제 이중 청구 |
| P1       | 임박한 예약의 결제·확정 불일치     |
| P2       | 개별 환불 지연, 외부 동기화 실패   |
| P3       | 표시 정보 오류, 일반 문의          |

### 18.3 운영자 조치

모든 조치는 명령으로 제공하고 직접 DB 수정을 금지한다.

```text
force reconciliation
release orphan hold
correct attendance result
issue adjustment refund
reassign resource
cancel with merchant fault
resend transaction notification
```

고위험 조치는 이중 승인과 사유 코드를 요구한다.

---

## 19. 개인정보와 보안

### 19.1 분리 저장

- 예약 핵심 행은 불투명한 contact reference만 가진다.
- 이름·전화번호·이메일은 암호화된 제한 영역에 저장한다.
- 결제수단 원문은 보관하지 않고 결제사 토큰만 참조한다.
- 알레르기·접근성 요청은 더 엄격한 접근과 짧은 보존을 적용한다.

### 19.2 접근 역할

| 역할           | 예약 기본 | 연락처              | 결제 요약      | 내부 위험 신호   |
| -------------- | --------- | ------------------- | -------------- | ---------------- |
| 예약 사용자    | 자신의 것 | 자신의 것           | 자신의 것      | 불가             |
| 점주 예약 담당 | 허용 지점 | 운영 기간 제한      | 결제 여부 요약 | 불가             |
| 점주 분석가    | 집계만    | 불가                | 집계만         | 불가             |
| 고객지원       | 배정 사건 | 필요 시 마스킹 해제 | 분쟁 필요 범위 | 제한             |
| 부정사용 조사  | 사건 범위 | 최소                | 제한           | 역할에 따라 가능 |

### 19.3 연락처 토큰

중복·남용 탐지에 전화번호 자체를 넓게 공유하지 않고 정규화 후 별도 키로 HMAC한 토큰을 사용할 수 있다. 키 회전과 링크 가능성의 프라이버시 위험을 함께 관리한다.

### 19.4 보존

- 예약 거래 기록은 법적·분쟁 처리 기간과 맞춰 제한 보관한다.
- 좌석 선호, 자유 요청, 알레르기 정보는 목적 종료 후 더 빨리 삭제 또는 비식별화한다.
- 마케팅 프로필로 자동 전환하지 않는다.
- 점주 콘솔의 표시 기간과 백엔드 법정 보관 기간을 분리한다.

정확한 기간과 고지 문구는 출시 시점의 국내 법률 및 결제사 계약 검토를 거친다. [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)의 정책을 따른다.

---

## 20. API 계약

### 20.1 가용성 조회

```text
GET /v1/branches/{branchId}/reservation-availability
```

입력:

```text
local date
party size
optional time range
optional course
optional seat preference
```

응답에는 `availabilityVersion`, 정책 버전, 지점 시간대, 총액, 확정 방식, 좌석 유형, 이용 시간을 포함한다.

### 20.2 hold 생성

```text
POST /v1/reservation-holds
Idempotency-Key: required
```

서버는 최신 재고를 검사한다. 성공 응답은 `expiresAt`과 서버 현재 시각을 포함한다. 클라이언트 타이머는 안내용이고 서버 만료 시각이 기준이다.

### 20.3 예약 생성

```text
POST /v1/reservations
Idempotency-Key: required
```

민감 연락처는 사전 검증된 contact token으로 전달한다. 정책 동의 버전과 결제수단 토큰을 포함한다.

### 20.4 변경과 취소

```text
POST /v1/reservations/{id}:request-change
POST /v1/reservations/{id}:cancel
```

두 요청 모두 `If-Match` 또는 `resourceVersion`, 멱등키를 사용한다. 취소는 먼저 견적을 조회하거나 요청 본문에 유효한 quote ID를 포함한다.

### 20.5 점주 명령

점주 명령에는 조직, 지점 범위, 역할, 예약 버전, 사유를 검사한다. 웹 화면에서 버튼을 숨긴 것만으로 권한을 보장하지 않는다.

---

## 21. 이벤트

### 21.1 도메인 이벤트

```text
reservation.requested
reservation.confirmed
reservation.change_proposed
reservation.changed
reservation.cancelled
reservation.seated
reservation.completed
reservation.no_show_marked
reservation.no_show_corrected
payment.succeeded
payment.state_unknown
refund.requested
refund.succeeded
availability.changed
waitlist.notified
```

### 21.2 이벤트 봉투

```json
{
  "eventId": "evt_01K...",
  "eventType": "reservation.confirmed",
  "aggregateType": "reservation",
  "aggregateId": "rsv_01K...",
  "aggregateVersion": 4,
  "occurredAt": "2026-09-02T08:30:00Z",
  "traceId": "tr_01K...",
  "payloadVersion": 1,
  "payload": {}
}
```

### 21.3 소비자

- 알림 서비스
- 점주 예약대장 읽기 모델
- 검색 예약 가능 여부
- 분석 이벤트 파이프라인
- 방문 인증 후보 생성
- 위험 탐지
- 파트너 웹훅

각 소비자는 이벤트 ID로 멱등 처리한다. 소비 실패가 예약 트랜잭션을 되돌리지 않는다.

---

## 22. 검색과의 연결

### 22.1 검색 필드

- `reservable`: 자체 또는 외부 예약 가능
- `dorakInstantBookable`: 도락 즉시 예약 가능
- `nextAvailableAt`: 근사값
- `bookablePartySizes`: 제한된 버킷
- `bookingChannel`: 자체, 파트너, 전화

### 22.2 일관성

검색의 예약 가능 배지는 파생 데이터다. 상세 진입 후 실제 가용성을 다시 조회한다. 검색 이벤트 지연 때문에 매진된 지점을 잠시 예약 가능으로 표시할 수 있으므로, 확정 실패 시 사용자를 비난하지 않고 대안을 제공한다.

### 22.3 기능 저하

예약 엔진 장애 시:

- 일반 음식점 검색과 상세는 유지한다.
- 실시간 예약 가능 필터는 비활성 또는 마지막 갱신 시각을 표시한다.
- 자체 예약 버튼을 안전하게 닫고 전화·외부 링크가 유효하면 분리 표시한다.

---

## 23. 지표

### 23.1 퍼널

```text
availability viewed
slot selected
hold acquired
payment started
reservation submitted
reservation confirmed
reminder delivered
seated
completed
review created
```

### 23.2 핵심 운영 지표

- 가용성 조회 성공률과 p95
- hold 획득 성공률
- hold 후 예약 확정률
- 동시성 충돌률
- 중복 예약 발생 건수
- 결제 성공 후 예약 불일치 건수
- 환불 처리 시간
- 점주 승인 시간과 기한 초과율
- 점주 취소율
- 사용자 취소율과 정책 구간별 분포
- 노쇼율과 이의 제기 정정률
- 외부 채널 동기화 지연
- 알림 전달 성공률

### 23.3 품질 가드레일

예약 전환율을 높이는 실험이 다음을 악화시키면 중단한다.

- 취소 정책 인지율
- 원치 않는 유료 옵션 선택률
- 점주 취소율
- 고객지원 문의율
- 결제·환불 불일치
- 접근성 작업 성공률

---

## 24. SLO와 경보

초기 목표:

| 대상                            | 목표                    |
| ------------------------------- | ----------------------- |
| 예약 쓰기 API 가용성            | 월 99.95%               |
| 확정된 중복 자원 배정           | 0건 목표                |
| 결제 성공-예약 불일치 자동 탐지 | 5분 이내                |
| 예약 요청 이벤트 발행           | p99 1분 이내            |
| 임박 예약 거래 알림 생성        | 예정 시각 기준 5분 이내 |
| 점주 예약대장 최신성            | 정상 시 p99 30초 이내   |

경보는 단순 오류율뿐 아니라 금전·재고 불변식 위반을 우선한다.

```text
active overlapping allocations > 0
successful payment without reservation > 0
refund pending beyond threshold
outbox lag
webhook signature failures spike
hold creation abuse spike
partner synchronization stale
```

---

## 25. 실패 시나리오

### 25.1 결제 성공 후 앱이 종료됨

- 클라이언트 재접속 시 멱등키 또는 payment intent로 결과를 조회한다.
- 서버는 웹훅과 조정 작업으로 상태를 수렴한다.
- 새 예약을 다시 생성하도록 유도하지 않는다.

### 25.2 결제 성공 후 hold 만료

- 같은 자원을 다시 원자적으로 확보한다.
- 확보되면 예약을 확정한다.
- 확보되지 않으면 즉시 환불 의무를 생성하고 사용자에게 처리 상태를 알린다.
- 운영자가 임의의 다른 시간으로 바꾸지 않는다.

### 25.3 점주가 예약 시간에 휴무를 등록

- 기존 확정 예약 목록과 영향을 먼저 보여 준다.
- 단순 정책 저장으로 예약을 자동 취소하지 않는다.
- 각 예약에 점주 취소 또는 변경 제안 절차를 수행한다.

### 25.4 외부 채널에서 같은 테이블을 판매

- 충돌 사건을 만들고 점주에게 즉시 알린다.
- 책임 채널과 동기화 로그를 보존한다.
- 소비자에게는 가능한 대안이나 전액 환불을 명확히 안내한다.
- 해결 후 채널 재고 방식과 지연 임계치를 조정한다.

### 25.5 웹훅이 역순 도착

공급자 이벤트 버전, 발생 시각, 허용 상태 전이를 비교한다. 최신 `succeeded`를 늦은 `processing`으로 되돌리지 않는다.

### 25.6 알림 공급자 장애

- 예약 자체는 확정한다.
- 다른 허용 채널로 fallback한다.
- 사용자 앱 내 예약 내역을 최종 진실로 유지한다.
- 전송 복구 후 너무 늦은 임박 알림은 억제한다.

---

## 26. 테스트 계획

### 26.1 상태 머신

- 허용 전이 전부
- 금지 전이 전부
- 종료 상태 정정 권한
- 동일 명령 중복
- 낙관적 버전 충돌
- 변경 제안 만료와 기존 예약 복귀

### 26.2 재고

- 마지막 테이블 동시 100개 요청
- 겹치는 시간과 buffer
- 테이블 조합 경쟁
- 인원 증가와 자원 재배정
- 휴무 예외와 자정 넘는 영업
- hold 만료 경계
- DB 교착 재시도

### 26.3 결제

- 성공, 실패, 사용자 인증 필요
- 타임아웃과 `unknown`
- 중복·역순 웹훅
- 결제 성공 후 DB 커밋 실패
- 부분 환불과 반복 환불
- 취소 경계 시각의 수수료
- 금액·통화 불일치

### 26.4 권한과 개인정보

- 다른 사용자의 예약 ID 접근
- 다른 지점 점주 직원의 접근
- 메뉴 편집자의 연락처 접근
- 마스킹 해제 감사 로그
- 로그·오류 추적 시스템의 개인정보 누출
- 만료된 내보내기 URL 접근

### 26.5 복원력

- Redis 없이 확정 정확성 유지
- 큐 지연 중 outbox 보존
- 결제사 장애
- 문자 공급자 장애
- 외부 채널 API 지연
- 검색 인덱스 장애와 직접 상세 가용성 조회

---

## 27. 출시 단계

### R0. 예약 없는 탐색

- 전화, 외부 링크를 출처와 함께 표시
- 클릭 성과만 측정
- 자체 확정으로 오해하지 않게 UI 분리

### R1. 점주 예약대장

- 점주 수동 예약
- 테이블·룸 자원
- 영업·휴무 예외
- 역할 기반 연락처 접근
- 결제 없음

### R2. 승인형 자체 예약

- 제한된 지역·지점
- 점주 승인/거절
- 거래 알림
- 변경·취소
- 예약금 없이 운영 품질 검증

### R3. 즉시 예약

- hold와 강한 재고 제약
- 코스와 이용 시간
- 예약금·선결제
- 환불과 결제 조정
- 점주 취소 품질 정책

### R4. 통합 재고

- 외부 채널 양방향 동기화
- 웨이팅
- POS 또는 현장 착석 연동
- 수요 기반 점주 분석

각 단계는 기능 출시가 아니라 운영 종료 조건을 통과해야 다음으로 간다.

---

## 28. 단계별 완료 조건

### 승인형 예약 출시 조건

- [ ] 점주 예약 응답 담당과 영업시간이 설정되었다.
- [ ] 승인 기한 초과 자동 처리와 알림이 동작한다.
- [ ] 사용자·점주 변경 및 취소 이력이 남는다.
- [ ] 예약 연락처 접근 권한과 마스킹이 검증되었다.
- [ ] 중복 예약 운영 대응 절차가 훈련되었다.

### 즉시 예약 출시 조건

- [ ] 마지막 재고 동시성 테스트가 통과했다.
- [ ] 결제 성공 후 예약 불일치 자동 탐지·환불이 검증되었다.
- [ ] 멱등키 재시도와 웹훅 중복·역순 테스트가 통과했다.
- [ ] 취소 정책 스냅샷과 견적이 소비자 화면에 정확히 표시된다.
- [ ] 환불 지연 사건 큐와 책임자가 있다.
- [ ] 예약·결제 장애 runbook과 기능 차단 스위치가 있다.

### 외부 채널 연동 조건

- [ ] 지점·자원 ID 매핑 검수 도구가 있다.
- [ ] 동기화 지연과 충돌을 관측한다.
- [ ] 파트너 장애 시 채널별 차단이 가능하다.
- [ ] 재전송·재조정 도구가 있다.
- [ ] 사용자에게 거래 책임 주체를 표시한다.

---

## 29. v1 결정안

초기 구현의 복잡도를 통제하기 위한 권고안이다.

- 승인형 예약부터 시작하고 결제는 붙이지 않는다.
- 5~10개 협력 지점에서 실제 예약대장 운영을 먼저 검증한다.
- 테이블형과 단순 용량형만 지원하고 임의 자동 조합은 제한한다.
- 지점 시간대는 구조적으로 저장하되 국내에서는 `Asia/Seoul`로 운영한다.
- 변경은 새 제안으로 처리하며 조용한 필드 덮어쓰기를 금지한다.
- 거래 알림은 앱 푸시와 문자 중 점주 운영에 필요한 경로를 확보한다.
- 즉시 예약과 예약금은 결제 조정 도구가 준비된 후 연다.
- 외부 채널은 초기에는 링크 또는 채널별 할당으로 시작한다.

---

## 30. 미결정 사항

- 승인형 예약 요청 단계에서 재고를 얼마나 오래 점유할지
- 점주 승인 전 카드 보증을 도입할지
- 수수료와 예약금 정산의 주체·주기
- 비회원 예약을 허용할지, 허용한다면 계정 병합 방법
- 점주 취소 보상 정책
- 연락처 마스킹 해제 가능 시간 범위
- 외부 예약 파트너와 최종 재고 원장을 누가 맡을지
- 대규모 예약 오픈 시 대기열 방식
- 웨이팅 순번에서 접근성·인원 최적화의 구체적 규칙
- 현장 QR 체크인을 방문 인증에 어느 수준으로 사용할지

---

## 31. 법률·사업 검토 메모

다음 항목은 제품 문서만으로 확정하지 않고 대한민국 법률 전문가, 결제대행사, 세무·정산 담당과 출시 시점에 검토한다.

- 예약금, 선결제, 취소 수수료의 표시와 환불 조건
- 통신판매 관련 고지 및 거래 기록 보존
- 결제대행, 에스크로, 정산 구조에 따른 책임
- 전화 예약 개인정보의 수집·제공 고지
- 알레르기·접근성 요청과 같은 민감한 자유 입력의 처리
- 해외 사용자 및 해외 발급 결제수단 지원
- 노쇼 수수료와 사후 청구의 약관·동의 방식

이 문서는 법률 자문이 아니라 기술·제품 설계 기준이다.
