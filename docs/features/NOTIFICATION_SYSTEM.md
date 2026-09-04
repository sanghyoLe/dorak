# 도락 알림 시스템 설계

> 상태: 초안 v0.1  
> 범위: 앱 내 알림, 푸시, 문자, 이메일, 점주·운영 에스컬레이션  
> 원칙: 거래·보안·활동·마케팅 목적을 분리하고, 예약 상태의 최종 진실을 알림 전달 성공에 맡기지 않는다.  
> 연관 문서: [RESERVATION_SYSTEM.md](./RESERVATION_SYSTEM.md), [OWNER_PLATFORM.md](./OWNER_PLATFORM.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md), [OPERATIONS.md](../operations/OPERATIONS.md)

---

## 1. 목적

도락 알림은 사용자의 주의를 얻는 성장 도구이기 전에 예약·계정·정책 상태를 제때 전달하는 신뢰 인프라다.

다음 목표를 갖는다.

- 거래·보안 알림이 마케팅 수신 동의와 섞이지 않는다.
- 동일 사건의 중복 알림과 과거 상태의 늦은 알림을 억제한다.
- 푸시·문자·이메일 공급자가 실패해도 예약 자체가 손실되지 않는다.
- 사용자·점주가 목적과 채널별 선호를 이해하고 통제한다.
- 점주 예약 담당자가 응답하지 않으면 역할·지점 기반으로 에스컬레이션한다.
- 메시지 본문과 공급자 payload에 개인정보를 최소화한다.
- 각 알림의 정책·템플릿·대상·전달·클릭 결과를 감사하고 재현한다.

---

## 2. 비목표

- 앱 체류시간을 늘리기 위한 무차별 알림
- 알림 공급자 상태를 예약·결제 원장으로 사용
- 점주가 예약 연락처에 임의 마케팅 발송
- 모든 채널에 같은 메시지를 동시에 보내기
- 사용자 행동을 유도하기 위한 기만적 긴급성
- 민감한 리뷰·예약 내용을 잠금 화면에 전부 표시

---

## 3. 알림 분류

### 3.1 보안 `security`

예:

- 새 기기 로그인
- 비밀번호·passkey·연락처 변경
- 점주 owner·구성원 권한 변경
- 계정 복구·잠금
- 민감 데이터 내보내기

특성:

- 중요도가 높다.
- 마케팅 동의와 무관하다.
- 사용자가 전체 비활성화할 수 없는 경우에도 안전한 전달 채널과 법률·정책 근거가 필요하다.
- 메시지에서 즉시 검토·세션 종료 경로를 제공한다.

### 3.2 거래 `transactional`

예:

- 예약 요청·확정·거절
- 변경 제안·취소
- 예약 임박·웨이팅 호출
- 결제 필요·성공·실패·상태 불명
- 환불 요청·완료
- 점주 취소

특성:

- 특정 사용자 행동·계약 상태와 직접 연결된다.
- 예약 화면이 최종 진실이며 알림은 전달 수단이다.
- 사용자에게 실질적 손해가 생길 수 있어 전달 실패 에스컬레이션이 필요하다.

### 3.3 서비스·운영 `service`

예:

- 개인정보 요청 상태
- 신고·이의 제기 결과
- 음식점 정보 수정 결과
- 점주 claim 상태
- 정책·약관의 필요한 공지
- 서비스 장애·데이터 노출 관련 통지

### 3.4 활동 `activity`

예:

- 리뷰 공식 답글
- 리뷰 유용 반응
- 팔로우한 리뷰어의 새 글
- 저장 목록 공유 반응
- 취소 자리 알림

사용자가 목적별로 켜고 끌 수 있어야 하며 묶음 요약을 지원한다.

### 3.5 추천 `recommendation`

예:

- 저장한 지역의 새 음식점
- 취향 기반 컬렉션
- 다시 볼 만한 목록

개인화 설명과 끄기 기능을 제공한다. 사용자의 민감 방문 패턴이 메시지 문구로 드러나지 않게 한다.

### 3.6 마케팅 `marketing`

예:

- 도락 프로모션
- 유료 점주 상품 안내
- 광고 캠페인
- 제휴 혜택

다른 분류와 동의·템플릿·발송 자격·수신거부를 분리한다. 거래 정보 안에 광고를 끼워 넣어 분류를 우회하지 않는다.

---

## 4. 분류 결정

메시지 분류는 화면 이름이나 발송팀이 아니라 주된 목적과 내용으로 판단한다.

질문:

1. 사용자가 요청한 특정 거래·보안 상태를 전달하는가?
2. 이 메시지 없이 사용자의 권리·안전·예약 이행에 문제가 생기는가?
3. 구매·방문·구독을 촉진하는 내용이 포함되는가?
4. 거래 내용을 제거해도 프로모션 가치가 남는가?
5. 누구의 상품이며 전송 책임자가 누구인가?

혼합 메시지는 더 엄격한 분류를 적용하거나 거래와 마케팅을 별도 메시지로 나눈다.

새 템플릿은 Product, Legal/Policy, Privacy 검토가 필요한 분류를 표시한다.

---

## 5. 채널

### 5.1 앱 내 inbox

장점:

- 도락이 상태·읽음·deep link를 통제한다.
- 민감 내용을 인증 후 표시할 수 있다.
- 다른 외부 연락 수단 없이도 기록을 제공한다.

한계:

- 앱을 열지 않으면 긴급성이 떨어진다.
- 웹 사용자는 별도 inbox 접근이 필요하다.

모든 장기적으로 의미 있는 서비스·거래 알림은 가능한 경우 inbox record를 남긴다.

### 5.2 모바일 푸시

- 빠르고 비용이 낮다.
- OS 토큰·권한·집중 모드에 의존한다.
- 잠금 화면 개인정보를 최소화한다.
- `delivered`가 실제 읽음을 뜻하지 않는다.

### 5.3 문자

- 앱이 없어도 전달 가능하다.
- 예약 임박과 점주 에스컬레이션에 적합하다.
- 비용, 발신번호, 광고 규칙, 길이, 공급자 장애를 관리해야 한다.
- 예약 전화번호를 점주 마케팅에 재사용하지 않는다.

### 5.4 이메일

- 긴 설명, 영수증, 정책 문서, 보안 알림에 적합하다.
- 스팸 필터와 지연을 고려한다.
- 민감 문서 자체를 첨부하기보다 인증된 페이지 링크를 사용한다.

### 5.5 웹 푸시

초기 우선순위는 낮다. 브라우저 권한 UX와 중복 채널을 검토한 뒤 도입한다.

### 5.6 점주 콘솔 task

점주 예약 승인이나 데이터 충돌은 알림만 보내지 않고 `오늘 할 일`의 지속적인 task로 남긴다.

---

## 6. 도메인 모델

```text
domain event
  -> notification policy evaluation
  -> notification intent
  -> recipient resolution
  -> content render snapshot
  -> delivery plan
  -> delivery attempt(s)
  -> provider receipt/webhook
  -> final delivery status
  -> interaction event
```

### 6.1 `notification_policy`

```text
id
event_type
audience_type
notification_category
eligibility rules
default channels
fallback rules
schedule rules
deduplication rule
template key/version mapping
priority
effective period
status
```

### 6.2 `notification_intent`

특정 사건을 특정 수신자에게 알릴 의무 또는 의도다.

```text
id
source_event_id
source_event_type
subject_type and subject_id
recipient_actor_type and id
category
policy_version
priority
status
deduplication_key
scheduled_for
expires_at
created_at
```

### 6.3 `notification_message`

```text
intent_id
channel
locale
template_id and version
rendered_subject
rendered_body_ref or safe body
deep_link
content_classification
rendered_at
```

발송 후 템플릿이 바뀌어도 당시 무엇을 보냈는지 재현할 수 있게 안전한 렌더 스냅샷 또는 해시·변수 스냅샷을 보존한다.

### 6.4 `delivery_attempt`

```text
id
intent_id
channel
provider
destination_ref
attempt_number
provider_message_id
status
requested_at
accepted_at
delivered_at
failed_at
failure_code
retry_after
```

### 6.5 `notification_interaction`

```text
intent_id
event_type: seen/opened/clicked/dismissed/actioned
surface
occurred_at
```

읽음과 거래 처리 완료를 구분한다.

---

## 7. 상태 머신

### 7.1 intent 상태

```text
created
 -> eligibility_pending
 -> scheduled
 -> dispatching
 -> delivered
 -> partially_delivered
 -> failed
 -> suppressed
 -> cancelled
 -> expired
```

### 7.2 attempt 상태

```text
queued -> sent_to_provider -> accepted -> delivered
                              -> bounced
                              -> rejected
                              -> undeliverable
queued/sent -> retryable_failed
queued -> cancelled
accepted -> delivery_unknown
```

공급자 `accepted`는 사용자 단말 전달을 의미하지 않는다.

### 7.3 읽음 상태

읽음은 채널별 전달 상태와 별도다.

```text
unseen -> seen -> opened -> actioned
```

모든 채널에서 정확한 `seen`을 알 수 있다고 가정하지 않는다.

---

## 8. 이벤트 입력

### 8.1 주요 이벤트

```text
account.security_changed
owner.member_role_changed
branch_claim.decided
branch_assertion.decided
review.owner_response_published
moderation.case_decided
reservation.requested
reservation.confirmed
reservation.change_proposed
reservation.cancelled
reservation.reminder_due
reservation.no_show_marked
payment.action_required
payment.succeeded
payment.state_unknown
refund.succeeded
waitlist.offer_created
privacy_request.updated
```

### 8.2 이벤트 계약

알림 서비스가 도메인 DB를 임의 조회해 이벤트 의미를 재구성하지 않는다. 이벤트에는 최소 식별자, aggregate version, 발생 시각, 알림에 필요한 안전한 상태 코드를 포함한다.

개인정보 원문은 이벤트 payload에 넣지 않고 제한 저장소 reference로 해결한다.

### 8.3 outbox

예약 확정과 알림 이벤트 outbox 기록은 같은 트랜잭션에 둔다. 푸시 발송은 트랜잭션 밖에서 이루어진다.

### 8.4 과거 이벤트

재생이나 지연으로 오래된 이벤트가 들어와도 현재 aggregate version을 확인해 과거 상태 알림을 보내지 않는다.

---

## 9. 수신자 해소

### 9.1 소비자

```text
account id
reservation participant/contact role
verified channel destinations
locale
timezone
channel availability
preference/consent
account status
block/suppression state
```

### 9.2 점주

수신자는 조직 owner 전체가 아니라 다음 규칙으로 찾는다.

```text
branch scope
required role/permission
active membership
notification assignment
primary/backup order
channel verification
on-call schedule if applicable
```

### 9.3 운영자

P0/P1 에스컬레이션은 개인 연락처를 코드에 넣지 않고 온콜 시스템의 현재 schedule을 참조한다.

### 9.4 계정 없는 예약

비회원 예약을 허용한다면 예약 contact와 알림 목적을 제한한다. 해당 연락처를 일반 도락 계정이나 마케팅 프로필로 자동 생성하지 않는다.

### 9.5 연락처 변경

예약 후 계정 전화가 바뀌어도 예약 당시 contact와 사용자 확인된 새 contact 중 어느 것을 쓸지 명시한다. 임박 거래 알림은 사용자가 예약에서 별도로 갱신할 수 있게 한다.

---

## 10. 선호와 동의

### 10.1 모델

```text
notification_preference
  actor id
  category
  channel
  enabled
  source
  policy/legal basis
  effective_at
  updated_at
```

```text
communication_consent
  actor/contact scope
  purpose
  channel
  status
  policy version
  captured_at
  capture context
  withdrawn_at
```

선호 설정과 법적 동의 사실을 같은 boolean으로 두지 않는다.

### 10.2 설정 화면

목적 중심으로 보여 준다.

```text
예약·결제
계정 보안
리뷰와 활동
저장·팔로우 소식
개인화 추천
혜택·프로모션
```

사용자가 채널별 상세 설정을 펼칠 수 있게 한다.

### 10.3 기본값

- 보안·거래: 서비스 수행에 필요한 범위
- 활동: 명확한 제품 기본값과 쉬운 끄기
- 추천: 보수적 빈도와 끄기
- 마케팅: 법률·동의 정책에 따라 별도

### 10.4 수신거부

- 메시지와 설정에서 쉽게 가능
- 인증 로그인 없이도 해당 연락처 마케팅 수신거부 경로 제공 검토
- 처리 결과 기록·통지
- 공급자 suppression과 내부 consent 모두 갱신
- 이후 캠페인 대상에서 즉시 제외되도록 전파

### 10.5 점주 연락처

점주 조직의 예약 연락처를 점주용 유료 상품 마케팅 연락처로 자동 전환하지 않는다. 역할 기반 거래 알림과 조직 마케팅 동의를 분리한다.

---

## 11. 발송 자격 평가

발송 직전에 다시 평가한다.

```text
intent is current
recipient still authorized/relevant
category preference/consent valid
destination verified and not suppressed
account/resource not deleted
quiet-hour rule
frequency cap
dedupe state
content/template active
experiment assignment valid
```

예약 취소 후 예정된 임박 알림을 보내지 않으려면 스케줄 생성 시뿐 아니라 실행 시 상태를 확인한다.

---

## 12. 중복 제거와 순서

### 12.1 deduplication key

예:

```text
reservation:{id}:confirmed:{version}:recipient:{id}
reservation:{id}:reminder:24h:recipient:{id}
review:{id}:owner_response:{responseVersion}:author:{id}
security:{accountId}:new_device:{sessionId}
```

### 12.2 동일 상태 중복

같은 도메인 이벤트가 재전송되면 기존 intent와 결과를 반환한다. 공급자 timeout 재시도는 같은 provider idempotency key를 가능한 범위에서 사용한다.

### 12.3 상태 순서

```text
requested < confirmed < changed/cancelled
refund_requested < refund_succeeded
```

단순 선형 버전이 아닌 분기 상태는 aggregate version과 정책으로 비교한다. 취소 알림 후 늦게 온 확정 이벤트를 억제한다.

### 12.4 메시지 합치기

짧은 시간 안에 같은 목록에 반응이 여러 개 생기면 digest로 합칠 수 있다. 예약·보안·결제는 다른 활동과 묶지 않는다.

---

## 13. 예약 알림 흐름

### 13.1 승인형 예약

```text
user submits
 -> user: request received
 -> merchant primary: approval task
 -> merchant backup: escalation if threshold
 -> merchant decision
    -> user: confirmed or rejected
    -> merchant: board task updated
 -> no decision by deadline
    -> user: expired
    -> merchant: missed request summary
```

### 13.2 즉시 예약

```text
hold/payment processing
 -> do not send confirmed yet
reservation confirmed in server ledger
 -> user confirmation
 -> merchant new reservation
 -> reminders scheduled
```

결제 리디렉션 화면만으로 확정 알림을 만들지 않는다.

### 13.3 변경 제안

- 제안자에게 접수
- 상대방에게 새 조건·가격 차이·응답 기한
- 수락·거절 결과 양측
- 만료 시 기존 예약 상태를 명확히 설명

### 13.4 취소·환불

예약 취소와 환불 완료를 한 문장으로 합치지 않는다.

```text
reservation cancelled
refund requested/processing
refund completed or failed
```

### 13.5 임박 알림

지점 시간대를 기준으로 생성하고 사용자의 표시 시간대도 함께 고려한다. 변경·취소 시 기존 schedule을 취소하고 새 버전으로 생성한다.

### 13.6 민감 내용

잠금 화면:

```text
"예약 상태가 변경되었습니다. 도락에서 확인해 주세요."
```

앱 인증 후:

```text
지점, 시각, 인원, 정책, 필요한 행동
```

사용자 설정에 따라 지점명을 잠금 화면에 표시할지 선택할 수 있다.

---

## 14. 점주 에스컬레이션

### 14.1 담당자 설정

지점별로 다음을 요구한다.

```text
primary reservation managers
backup managers
business notification hours
emergency destination
channel order
test status
```

### 14.2 승인 요청

예시:

```text
T+0: primary push + console task
T+N: unread/untouched -> primary SMS
deadline approaching -> backup manager
deadline -> auto-expire according to policy
```

구체 간격은 지점 정책과 사용자 약속에 맞춘다.

### 14.3 연락 폭주 방지

- 같은 예약의 반복 화면 열기를 알림으로 만들지 않는다.
- 여러 승인 요청을 점주 설정에 따라 묶되 각 기한을 숨기지 않는다.
- 역할이 없는 owner에게 모든 운영 알림을 보내지 않는다.
- 장기 미응답 지점은 승인형 예약 판매를 자동 중지할 수 있다.

### 14.4 담당자 퇴사

구성원 권한 해제 이벤트가 알림 routing을 즉시 갱신한다. primary가 없어지면 조직 owner에게 설정 필요 task를 생성하고 예약 판매 범위를 검토한다.

---

## 15. 템플릿 시스템

### 15.1 템플릿 구조

```text
template key
category
channel
locale
version
subject/body
allowed variables
required variables
deep link definition
preview examples
legal footer component
status
effective period
approval record
```

### 15.2 변수 allowlist

템플릿이 임의 객체를 직렬화하지 않는다.

허용 예:

```text
branchDisplayName
reservationLocalDateTime
partySize
confirmationCodeMasked
actionDeadline
safeStatusLabel
```

금지 예:

```text
payment token
full contact
freeform special request
moderation evidence
review draft
fraud score
```

### 15.3 자유 입력

점주의 예약 변경 메시지나 답글 원문을 SMS·push에 그대로 넣지 않는다. `새 변경 제안이 있습니다`라고 알리고 인증된 상세에서 보여 준다.

### 15.4 템플릿 승인

| 분류 | 승인 |
|---|---|
| 보안 | Security + Product |
| 예약·결제 | Booking Ops + Product |
| 정책·개인정보 | Policy/Privacy |
| 활동 | Product |
| 마케팅 | Marketing + Legal/Policy |

### 15.5 테스트

- 모든 locale 렌더
- 변수 없음·최대 길이
- 한글/영문 줄바꿈
- SMS 세그먼트 수
- 이메일 HTML/text
- 링크 allowlist
- 스크립트·HTML escaping
- 화면 읽기 제목
- 실제 데이터가 아닌 fixture

---

## 16. 다국어와 시간

### 16.1 locale 선택

우선순위:

```text
transaction-specific language
user explicit preference
account locale
device/app locale
service default
```

점주와 사용자가 다른 언어를 쓸 수 있다. 각자 자기 locale로 별도 렌더한다.

### 16.2 시간 표시

예약은 지점 현지 시간과 시간대 이름을 표시한다. 해외 사용자에게는 필요하면 사용자 현지 시각을 보조 표시하되 예약 기준 시각을 명확히 한다.

### 16.3 번역 fallback

필수 거래 템플릿에 locale 번역이 없으면 승인된 기본 언어로 fallback하고 내부 경보를 남긴다. 기계 번역으로 취소·결제 조건을 실시간 생성하지 않는다.

---

## 17. 스케줄링과 quiet hours

### 17.1 시간대

- 사용자 설정 또는 합리적으로 확인된 시간대
- 지점 거래는 지점 시간대
- 시간대가 없으면 보수적 기본값
- DST가 있는 지역 확장 대비 IANA timezone

### 17.2 quiet hours

활동·추천·마케팅은 사용자의 quiet hours에 발송하지 않고 다음 허용 시간으로 미룬다.

보안·임박 예약처럼 시간 민감한 메시지는 별도 정책을 적용하되 필요성을 기록한다.

### 17.3 만료

알림마다 `expiresAt`을 둔다. 이미 예약 시간이 지난 후 임박 알림을 재시도하지 않는다.

### 17.4 일광절약시간

국내 초기에는 DST가 없지만 현지 예약 일시를 UTC로 한 번 계산한 뒤 고정 문자열만 재사용하지 않는다. 정책 변경·지역 확장 시 timezone database를 따른다.

---

## 18. 빈도 제한

### 18.1 우선순위

```text
security/critical transaction
time-sensitive transaction
service
activity
recommendation
marketing
```

낮은 우선순위가 높은 우선순위 예산을 소비하지 않는다.

### 18.2 제한 단위

- 수신자
- 카테고리
- 채널
- 지점 또는 리뷰어 source
- 캠페인
- 시간 창

### 18.3 digest

활동·추천은 일간 또는 주간 digest를 제공할 수 있다. 예약·보안·개인정보 결과는 digest에 넣지 않는다.

### 18.4 피로 신호

- 푸시 권한 해제
- 수신거부
- 알림 후 즉시 앱 종료
- 반복 dismiss
- 캠페인 신고
- 채널 bounce

이 신호를 사용자 탓으로 보지 않고 발송 정책을 줄이는 데 사용한다.

---

## 19. 공급자 어댑터

### 19.1 내부 인터페이스

```text
send(message, destination, idempotencyKey)
getStatus(providerMessageId)
parseWebhook(rawRequest)
validateDestination(destination)
classifyFailure(providerError)
```

도메인 코드가 공급자 상태 코드나 payload를 직접 사용하지 않는다.

### 19.2 공급자 응답 정규화

```text
accepted
delivered
temporary_failure
permanent_failure
invalid_destination
suppressed
rate_limited
unknown
```

### 19.3 다중 공급자

초기부터 모든 채널을 이중화할 필요는 없지만 교체 가능한 어댑터, 발신 ID, 템플릿, webhook 경계를 둔다.

### 19.4 fallback

공급자 장애가 감지되면:

- 같은 채널의 보조 공급자
- 허용된 다른 채널
- 앱 inbox와 운영 task

광고 메시지를 거래 fallback 채널로 우회하지 않는다.

### 19.5 공급자 전환 중 중복

첫 공급자의 결과가 `unknown`이면 두 번째 공급자로 즉시 같은 문자를 보내 중복될 수 있다. 메시지 중요도, 비용, 중복 피해를 기준으로 대기·조회·fallback 정책을 정한다.

---

## 20. 재시도

### 20.1 재시도 가능

- timeout
- rate limit
- 일시적 5xx
- 공급자 unavailable
- 네트워크 오류

### 20.2 재시도 불가

- 잘못된 목적지
- 명시적 suppression
- 동의 없음
- 만료된 알림
- 비활성 템플릿
- 존재하지 않는 수신자

### 20.3 backoff

지수 backoff + jitter를 사용하되 거래 기한 안에서만 재시도한다. `Retry-After`를 존중한다.

### 20.4 dead-letter

최종 실패는 다음을 남긴다.

```text
intent and subject
safe failure class
attempt history
user/merchant impact
manual action eligibility
next owner
```

보안·임박 거래의 최종 실패는 운영 사건으로 승격할 수 있다.

---

## 21. deep link와 행동

### 21.1 링크 원칙

- 도락 소유 도메인 또는 앱 링크 allowlist
- 인증 후 원래 목적지 복귀
- 권한이 없으면 안전한 홈·설명
- 오래된 링크는 현재 상태 화면으로 연결
- URL에 전화, 이메일, 예약자명, 비밀 토큰 없음

### 21.2 one-tap action

푸시에서 예약 취소·점주 승인 같은 고위험 쓰기를 즉시 실행하지 않는다. 앱을 열고 현재 상태·정책을 확인한 뒤 명령을 수행한다.

### 21.3 이메일 링크

비밀번호 없는 magic action이 필요하면 짧은 수명, 단일 사용, 대상·행동 제한, 재인증 조건을 적용한다.

---

## 22. 개인정보와 보안

### 22.1 목적지 분리

이메일·전화·device token은 계정 프로필과 분리된 연락처 저장소에서 reference로 사용한다.

### 22.2 provider payload 최소화

- 공급자에는 전달에 필요한 목적지와 메시지만 전송
- 내부 accountId 대신 전용 reference
- 예약 ID 전체 대신 불투명 link token 가능
- 리뷰·예약 자유 입력 제외
- 공급자의 analytics/광고 재사용 비활성·계약 통제

### 22.3 로그

남기지 않는 값:

- 전체 목적지
- 전체 메시지 본문, 특히 자유 입력
- 인증 토큰
- deep link의 일회용 token
- 공급자 secret

운영 화면은 목적지를 마스킹하고 사건 기반으로 제한 해제한다.

### 22.4 device token

- 사용자 계정과 설치 관계
- 로그아웃 시 연결 해제
- 공급자 invalid 응답 시 폐기
- 다른 계정 로그인 시 이전 알림 방지
- 환경·앱 bundle 분리

### 22.5 계정 열거 방지

로그인·복구 알림 API는 이메일 존재 여부를 공개하지 않는다. 알림 재전송 기능에는 속도 제한을 적용한다.

### 22.6 민감 추천

주류 업종, 건강·종교·개인관계를 추론할 수 있는 방문 패턴을 잠금 화면 추천 문구로 사용하지 않는다.

---

## 23. 마케팅 준수 설계

대한민국의 영리목적 광고성 정보 전송 제한은 명시적 사전 동의, 예외, 수신거부·철회 처리, 전송 위탁 관리 등 구체 의무를 포함한다. 현재 법령과 시행령·가이드를 출시 시점에 법률 전문가와 다시 검토한다.

제품 통제:

- 목적·채널별 동의 증거
- 동의 문구 버전과 획득 맥락
- 수신거부 즉시 전파
- 처리 결과 기록
- 광고 템플릿 분류와 승인
- 전송자·수신거부 정보 구성요소
- 발송 시간 정책
- 공급자 위탁 관리
- 정기적 동의 상태 확인 작업이 필요한지 검토
- 캠페인 생성 전 대상 자격 dry-run
- 법적 차단 규칙을 실험으로 우회 불가

거래관계 예외가 있을 수 있다는 이유로 모든 기존 사용자에게 자동 마케팅하지 않는다. 해당 상품·기간·연락처 수집 경위와 현재 법령을 개별 검토한다.

이 문서는 법률 자문이 아니다.

---

## 24. 운영자 도구

### 24.1 조회

- intent와 source event
- 분류·정책·템플릿 버전
- 수신자 역할과 마스킹 목적지
- 자격 평가 결과
- attempt 타임라인
- 공급자 상태
- deep link 안전 미리보기
- 사용자의 현재 거래 상태

### 24.2 재전송

`resend`는 과거 payload를 무조건 다시 보내지 않는다.

1. 현재 상태를 확인한다.
2. 새 intent가 필요한지 판단한다.
3. 동의·목적지·만료를 다시 검사한다.
4. 현재 템플릿 또는 당시 템플릿 정책을 선택한다.
5. 재전송 사유와 운영자를 기록한다.

### 24.3 수동 메시지

자유형 대량 발송은 금지한다. 승인된 템플릿과 대상 사건을 사용한다. P0 긴급 공지도 작성·승인·범위·중단 통제가 필요하다.

### 24.4 캠페인

마케팅 캠페인 도구에는:

- 대상 예상 수와 제외 수
- 동의·수신거부 검증
- 작은 canary
- 발송 속도
- 중단 버튼
- 비용 추정
- 템플릿 승인
- 결과와 신고

---

## 25. 분석

### 25.1 전달 지표

- intent 생성
- 자격 통과·억제
- 공급자 accepted
- delivered 또는 추정 전달
- bounce/invalid
- retry와 최종 실패
- 채널·공급자 latency

### 25.2 사용자 결과

- inbox seen/open
- deep link open
- 필요한 행동 완료
- 예약 승인 시간 감소
- 임박 알림 후 취소·변경 확인
- 수신거부·권한 해제·신고

클릭률만으로 거래 알림 품질을 평가하지 않는다. 알림을 열지 않아도 사용자가 이미 예약을 알고 행동했을 수 있다.

### 25.3 피로

- 사용자당 카테고리별 발송량
- 연속 무반응
- 알림 권한 해제
- 마케팅 철회
- 앱 제거 추정의 신중한 사용
- 활동 digest 선택

### 25.4 실험

보안·법적 고지·예약 확정 여부를 실험으로 누락하지 않는다. 활동·추천의 시각·빈도·문구는 동의 범위 안에서 실험할 수 있으며 피로 가드레일을 둔다.

---

## 26. SLO

초기 목표 예:

| 유형 | intent 생성 | 공급자 접수 | 최종 상태 파악 |
|---|---:|---:|---:|
| 계정 보안 | p99 1분 | 생성 후 p99 1분 | 채널별 목표 |
| 예약 확정·취소 | p99 1분 | 생성 후 p99 1분 | 5분 내 추적 |
| 점주 승인 요청 | p99 1분 | 생성 후 p99 1분 | 기한 전 에스컬레이션 |
| 환불 완료 | p99 5분 | 생성 후 p99 5분 | 공급자 상태 반영 |
| 활동 | 15분 내 | 정책 일정 | best effort |
| 마케팅 | 캠페인 일정 | 속도 제한 | 보고 주기 |

SLO는 공급자 accepted와 실제 사용자 전달 가능성을 분리한다.

### 경보

```text
transactional intent lag
queue age
provider rejection spike
invalid device token spike by app version
SMS/email bounce spike
reservation reminders expired unsent
merchant approval escalation failure
consent suppression mismatch
duplicate send anomaly
webhook signature failures
```

---

## 27. 장애 모드

### 27.1 푸시 장애

- 앱 inbox 기록
- 시간 민감 거래는 허용된 SMS/email fallback
- 일반 활동은 복구 후 만료 여부 검사
- 점주 콘솔 task 유지

### 27.2 문자 장애

- 공급자 전환 또는 push/email
- 임박 예약 영향 큐
- 광고 메시지는 다른 동의 없는 채널로 우회 금지

### 27.3 이벤트 큐 지연

- 예약 DB/outbox를 최종 사실로 유지
- lag 경보와 사용자 앱 내 직접 상태 조회
- 복구 시 aggregate version으로 오래된 알림 억제

### 27.4 잘못된 템플릿

- template kill switch
- 영향 intent와 수신자 확인
- 개인정보 노출이면 Security/Privacy 사건
- 정정 알림 필요성 검토
- 캐시된 템플릿 무효화

### 27.5 중복 발송

- 캠페인/정책 중지
- dedupe와 공급자 reference 확인
- 사용자 영향과 비용 계산
- 필요 시 사과·수신 설정 보호

---

## 28. 테스트

### 28.1 정책

- 카테고리 분류
- 동의·철회
- quiet hours
- frequency cap
- 예약 상태 변경에 따른 scheduled 취소
- 점주 역할·지점 범위 변경

### 28.2 멱등·순서

- 동일 이벤트 100회
- 역순 예약 이벤트
- 공급자 timeout 후 성공 webhook
- webhook 중복
- 재생된 과거 이벤트
- 템플릿 변경 중 재시도

### 28.3 템플릿

- locale별 snapshot
- 최대·최소 변수
- HTML/script escaping
- SMS 길이
- 민감 필드 검사
- 만료 deep link
- 화면 읽기

### 28.4 채널

- invalid token
- bounce
- rate limit
- 공급자 5xx
- webhook 서명
- 보조 공급자 전환
- 로그 redaction

### 28.5 end-to-end

- 예약 요청→점주 에스컬레이션→승인→사용자 확정
- 예약 변경→기존 알림 취소→새 알림
- 취소→환불 처리→환불 완료
- 마케팅 철회→대상 제외→처리 결과
- 구성원 해제→점주 알림 routing 제거
- 계정 삭제→destination·device token 연결 해제

---

## 29. 구현 순서

### N0. 기반

1. notification event contract
2. intent·attempt 모델
3. inbox
4. template registry
5. 한 채널 adapter
6. 로그·관측성

### N1. 보안·서비스

1. 로그인·보안 변경
2. claim·신고·개인정보 요청 상태
3. preference 기본
4. 이메일 또는 push

### N2. 예약

1. 사용자 예약 상태
2. 점주 task와 role routing
3. SMS fallback
4. reminder scheduler
5. 에스컬레이션
6. 실패 운영 큐

### N3. 활동

1. 리뷰 답글
2. 팔로우·리스트
3. digest
4. frequency cap

### N4. 마케팅

1. 별도 consent ledger
2. 캠페인 승인·canary
3. 수신거부 전파
4. 준수 감사
5. 비용·피로 분석

---

## 30. 출시 체크리스트

- [ ] 거래·보안·활동·마케팅 분류가 정책에 등록되어 있다.
- [ ] 알림 실패가 예약·결제 원장을 되돌리지 않는다.
- [ ] 같은 이벤트 재처리가 중복 알림을 만들지 않는다.
- [ ] 오래된 이벤트가 최신 상태와 충돌하면 억제된다.
- [ ] 점주 수신자가 역할과 지점 범위로 해소된다.
- [ ] 퇴사한 구성원과 로그아웃 기기에 알림이 가지 않는다.
- [ ] 잠금 화면과 provider payload에 민감정보가 최소화된다.
- [ ] 예약 변경·취소가 기존 임박 알림을 취소한다.
- [ ] 마케팅 동의·철회·처리 결과가 감사된다.
- [ ] 수신거부가 다음 캠페인 발송 전에 전파된다.
- [ ] 템플릿 변수 allowlist와 escaping 테스트가 있다.
- [ ] 공급자 장애와 최종 실패 운영 큐가 훈련된다.
- [ ] 앱 inbox에서 현재 거래 상태로 이동할 수 있다.

---

## 31. 미결정 사항

- 초기 푸시·문자·이메일 공급자
- 소비자 예약 알림의 기본 채널 조합
- 점주 승인 요청의 에스컬레이션 간격
- 보안 알림에서 사용자가 끌 수 없는 범위
- 앱 잠금 화면 지점명 기본 표시 여부
- 활동 알림의 기본 opt-in/out 정책
- 추천 digest 주기
- 마케팅 동의 확인의 구체 운영 주기
- 공급자 이중화 시점
- 비회원 예약 연락처의 알림·계정 전환 방식
- 웹 푸시 도입 여부

---

## 32. 공식 법률 참고

- [국가법령정보센터: 정보통신망법 제50조 광고성 정보 전송 제한](https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000463042)
- [국가법령정보센터: 정보통신망법](https://www.law.go.kr/lsEfInfoP.do?lsiSeq=282481)

현재 확인한 법령은 2026년 시행본을 포함한다. 구체적인 동의 예외, 표시 형식, 발송 시간, 정기 확인, 전송 위탁 의무는 실제 출시·캠페인 시점의 법령과 시행령·공식 가이드로 재검증한다.

---

## 33. 연관 문서

- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [RESERVATION_SYSTEM.md](./RESERVATION_SYSTEM.md)
- [OWNER_PLATFORM.md](./OWNER_PLATFORM.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
