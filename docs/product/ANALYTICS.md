# 도락 데이터 분석·실험 설계

> 상태: 초안 v0.1  
> 범위: 제품 지표, 이벤트 택소노미, 데이터 파이프라인, 실험, 점주 분석, 프라이버시  
> 원칙: 클릭 수보다 신뢰할 수 있는 외식 결정과 실제 방문 결과를 측정한다.  
> 연관 문서: [PRODUCT.md](./PRODUCT.md), [RATING_SYSTEM.md](../features/RATING_SYSTEM.md), [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md), [RESEARCH_PLAN.md](./RESEARCH_PLAN.md)

---

## 1. 목적

도락의 분석 시스템은 단순한 대시보드 모음이 아니다. 제품·평점·검색·운영·사업 의사결정에서 같은 용어와 같은 분모를 사용하게 하는 측정 계약이다.

이 문서는 다음을 정의한다.

- 도락이 만드는 핵심 가치와 이를 나타내는 지표
- 사용자 행동 이벤트의 이름, 속성, 버전, 품질 기준
- 음식점·리뷰·검색·예약·점주 기능의 퍼널
- 온라인 서비스 데이터와 분석 데이터의 경계
- A/B 테스트의 시작·중단·해석 기준
- 광고와 자연 결과의 성과 분리
- 개인정보와 위치정보를 과도하게 수집하지 않는 분석 방법
- 점주에게 제공할 수 있는 집계와 제공하면 안 되는 정보

---

## 2. 측정 원칙

### 2.1 측정 가능한 행동이 곧 가치인 것은 아니다

클릭, 체류시간, 리뷰 수를 무조건 늘리는 최적화를 하지 않는다. 과장된 콘텐츠는 체류시간을 높이면서 음식점 선택의 신뢰를 떨어뜨릴 수 있다.

### 2.2 결과와 가드레일을 함께 본다

모든 핵심 실험에는 주 지표뿐 아니라 신뢰, 안전, 성능, 접근성, 점주 부담 가드레일을 둔다.

### 2.3 이벤트는 사실, 지표는 정의다

`reservation_confirmed`는 발생한 사실이다. 예약 전환율은 어떤 사용자, 세션, 기간, 취소 제외 조건을 쓰는지 정의가 필요한 파생 지표다.

### 2.4 클라이언트 이벤트를 거래 원장으로 사용하지 않는다

리뷰 게시, 예약 확정, 결제 성공, 환불 완료는 서버 도메인 이벤트를 기준으로 측정한다. 화면에서 성공 애니메이션을 봤다는 사실로 거래 성공을 계산하지 않는다.

### 2.5 광고와 자연 성과를 혼합하지 않는다

광고 노출과 클릭은 별도 placement와 campaign을 갖는다. 광고 구매 여부가 자연 검색 품질 지표나 평점에 암묵적으로 들어가지 않게 한다.

### 2.6 필요한 최소 데이터만 수집한다

정확한 위치, 검색어 원문, 리뷰 초안, 예약 요청사항을 기본 분석 이벤트에 넣지 않는다. 목적에 따라 버킷·분류·비가역 토큰을 사용한다.

### 2.7 지표 정의를 소급해서 조용히 바꾸지 않는다

지표 이름, 버전, 소유자, SQL/semantic definition, 적용일을 관리한다. 정의가 바뀌면 과거 시계열을 재계산할지 단절해 표시할지 결정한다.

---

## 3. 가치 모델

도락의 제품 가치는 다음 흐름에서 만들어진다.

```text
정확한 음식점 데이터
   + 신뢰 가능한 리뷰와 점수
   + 의도에 맞는 검색
        ↓
사용자가 후보를 이해하고 비교
        ↓
저장·길찾기·전화·예약 같은 결정
        ↓
실제 방문과 만족
        ↓
검증된 후기와 데이터 개선
        ↓
다음 사용자의 더 나은 결정
```

각 단계가 다음 단계를 망가뜨리지 않는지 측정한다.

---

## 4. 북극성 지표

### 4.1 권고 지표: 주간 신뢰 외식 결정 `WTDD`

**Weekly Trusted Dining Decisions**는 한 주 동안 사용자가 신뢰 가능한 음식점 정보를 확인한 뒤 고의도가 높은 결정을 수행한 고유 사용자-지점 쌍이다.

후보 행동:

- 저장
- 길 찾기
- 전화 연결
- 자체 또는 확인 가능한 외부 예약
- 방문 기록

### 4.2 자격 조건

다음 최소 조건을 만족한 지점 결정만 포함한다.

- 지점이 공개·영업 가능한 상태다.
- 핵심 데이터 품질이 임계치 이상이다.
- 자연 상세 또는 명확히 표시된 광고 상세를 실제로 열었다.
- 자동화·봇·내부 테스트 트래픽이 아니다.
- 같은 사용자-지점-주 조합은 한 번만 센다.

예약은 서버 확정, 길찾기·전화는 클라이언트 의도 신호이므로 결과 강도가 다르다. 북극성 집계에서는 행동별 수치와 가중치 없는 총 고유쌍을 함께 제공한다.

### 4.3 북극성 지표의 한계

- 전화 클릭이 실제 통화·방문을 보장하지 않는다.
- 결정을 늘리기 위해 저품질 푸시를 남발할 수 있다.
- 한 사용자의 반복 탐색 깊이를 충분히 나타내지 않는다.
- 만족도와 점주 운영 품질을 별도 측정해야 한다.

따라서 아래 가드레일과 함께 본다.

### 4.4 북극성 가드레일

- 잘못된 음식점 정보 신고율
- 검색 재검색·결과 없음·빠른 이탈
- 방문 후 낮은 만족 또는 기대 불일치
- 리뷰·점수 신뢰도 설문
- 점주 취소와 예약 실패
- 콘텐츠 신고의 실제 위반율
- 사용자 차단·알림 해제율
- 앱 성능과 접근성 작업 성공률

---

## 5. 핵심 지표 체계

### 5.1 공급 `Supply`

- 공개 지점 수
- 지역×카테고리별 검색 가능한 지점 비율
- 핵심 필드 완성 지점 비율
- 최근 검증된 영업 상태 비율
- 지도 좌표 정확도 표본
- 메뉴·영업시간 최신성
- 점주 인증 지점 수와 활성률
- 자체 예약 가능 지점 수

### 5.2 신뢰 `Trust`

- 공개 리뷰 수가 임계치 이상인 지점 비율
- 방문 인증 리뷰 비율
- 경제적 이해관계 공개율
- 신고 대비 실제 위반 판정률
- 이의 제기에서 결정이 뒤집힌 비율
- 조작 의심 리뷰 군집률
- 점수 모델 안정성과 지역·장르 편향
- 사용자의 점수 이해도와 신뢰 설문

### 5.3 탐색 `Discovery`

- 검색 성공 세션 비율
- 자동완성 선택률
- 결과 없음 비율
- 재검색 비율
- 검색→상세 전환
- 지도 이동→상세 전환
- 필터 적용 후 상세 전환
- 장르·지역별 결과 다양성
- 검색 지연시간과 오류율

### 5.4 결정 `Decision`

- 상세→저장
- 상세→길 찾기
- 상세→전화
- 상세→예약 가능 조회
- 상세→예약 확정
- 목록 공유와 재방문
- 고의도 행동 전 정보 확인 깊이

### 5.5 거래 `Transaction`

- 가용성 조회 성공률
- 슬롯 선택→hold
- hold→예약 제출
- 제출→확정
- 점주 승인 시간
- 점주·사용자 취소율
- 노쇼율과 정정률
- 결제 성공-예약 불일치
- 환불 완료 시간
- 중복 예약 건수

### 5.6 기여 `Contribution`

- 방문→리뷰 초안
- 초안→게시
- 리뷰 완성도
- 인증 시도 성공률
- 첫 리뷰 후 재작성률
- 유용 반응을 받은 리뷰 비율
- 리뷰 수정·삭제·제재율
- 신규 음식점 정보 제보 정확도

### 5.7 유지 `Retention`

- 첫 가치 행동 후 1·4·12주 재방문
- 탐색 사용자, 리뷰어, 예약 사용자별 유지율
- 지역을 바꾼 뒤에도 사용하는 비율
- 저장 목록 재사용
- 알림 기반이 아닌 자발적 재방문

### 5.8 점주 `Merchant`

- claim 제출→승인 전환과 시간
- 승인 후 핵심 정보 완성률
- 월간 활성 점주 조직
- 정보 수정 반영 시간
- 예약 응답률과 응답 시간
- 점주 취소율
- 공식 답글 정책 위반율
- 분석 조회 후 실제 정보 개선 행동

---

## 6. 지표 정의 레코드

모든 운영 지표는 다음 메타데이터를 갖는다.

```text
metric_id
display_name
version
business_question
owner
definition
numerator
denominator
eligibility filters
time grain and timezone
identity unit
data sources
freshness target
known limitations
privacy classification
effective_from
deprecated_at
```

예:

```text
metric_id: reservation_confirmation_rate
version: 2
numerator: confirmed reservations created in period
denominator: valid submitted reservations in period
exclude: test, fraud-blocked, duplicate idempotent retries
segment separately: instant, request, external
time basis: submitted_at in branch timezone for operations;
            UTC for global technical reporting
```

---

## 7. 이벤트 이름 규칙

### 7.1 형식

분석 이벤트 이름은 `object_action` 과거형을 사용한다.

```text
search_submitted
search_result_impression
branch_viewed
branch_saved
review_published
reservation_confirmed
```

UI 구현 이름인 `button_clicked`, `modal_opened`만으로 핵심 행동을 표현하지 않는다.

### 7.2 이벤트 구성

```json
{
  "eventId": "evt_01K...",
  "eventName": "branch_viewed",
  "eventVersion": 2,
  "occurredAt": "2026-09-02T09:10:00Z",
  "receivedAt": "2026-09-02T09:10:01Z",
  "actor": {
    "anonymousId": "anon_rotating_token",
    "accountId": "acct_01K..."
  },
  "sessionId": "ses_01K...",
  "source": {
    "platform": "ios",
    "appVersion": "1.4.0",
    "surface": "search_results"
  },
  "context": {},
  "properties": {}
}
```

`accountId`는 로그인 시에만 있으며, 외부 분석 도구로 보낼 때 내부 원본 ID를 그대로 사용하지 않는다.

### 7.3 공통 문맥

| 속성 | 설명 |
|---|---|
| `platform` | ios, android, web, owner_web |
| `appVersion` | 앱/웹 릴리스 버전 |
| `surface` | 행동이 발생한 제품 표면 |
| `locale` | 표시 언어 |
| `experimentAssignments` | 관련 실험과 변형, 제한된 수 |
| `requestId` | 서버 요청 연결, 가능한 경우 |
| `referrerSurface` | 내부 진입 표면 |
| `isInternal` | 내부·테스트 트래픽 구분 |

정확한 IP, 전체 user-agent, 광고 식별자를 공통 속성으로 저장하지 않는다.

---

## 8. 이벤트 카탈로그

### 8.1 앱과 세션

```text
app_opened
session_started
session_ended
screen_viewed
authentication_started
authentication_succeeded
authentication_failed
consent_updated
account_closure_requested
```

`screen_viewed`는 진단용이고 북극성의 근거로 단독 사용하지 않는다.

### 8.2 검색

```text
search_started
search_suggestion_impression
search_suggestion_selected
search_submitted
search_results_returned          # server
search_result_impression         # client visibility qualified
search_result_selected
search_filter_applied
search_sort_changed
search_map_moved
search_zero_result_shown
search_recovery_selected
```

검색 이벤트 필수 속성:

```text
searchRequestId
queryClass
queryLengthBucket
intentClass
resultCountBucket
sortMode
filterIds
geoScopeType
rankingVersion
result position for impressions/clicks
placementType: organic or sponsored
```

검색어 원문은 기본 분석 스트림에 넣지 않는다. 검색 품질 연구용 원문이 필요하면 별도 목적, 접근, 짧은 보존, 샘플링을 적용한다.

### 8.3 음식점 상세

```text
branch_viewed
branch_section_viewed
branch_photo_opened
branch_menu_viewed
branch_hours_viewed
branch_score_explanation_viewed
branch_saved
branch_unsaved
branch_directions_requested
branch_phone_requested
branch_share_requested
branch_data_correction_started
branch_data_correction_submitted
```

상세 노출은 페이지 요청이 아니라 핵심 콘텐츠가 실제 렌더링된 시점으로 정의한다. 봇 SEO 요청은 별도 서버 로그로 본다.

### 8.4 리뷰

```text
review_impression
review_expanded
review_helpful_added
review_helpful_removed
review_draft_created
review_draft_saved
review_verification_started
review_verification_completed
review_publish_attempted
review_published                # server
review_edited                   # server
review_deleted                  # server
review_reported
review_moderation_decided       # internal server
review_appeal_submitted
```

리뷰 본문과 초안을 이벤트 속성으로 복제하지 않는다.

### 8.5 목록과 소셜

```text
list_created
list_branch_added
list_branch_removed
list_shared
reviewer_followed
reviewer_unfollowed
feed_item_impression
feed_item_selected
user_blocked
```

비공개 목록 이름이나 메모를 이벤트에 넣지 않는다.

### 8.6 예약

```text
reservation_availability_requested
reservation_availability_returned     # server
reservation_slot_selected
reservation_hold_requested
reservation_hold_acquired             # server
reservation_hold_failed               # server
reservation_payment_started
reservation_payment_action_required
reservation_payment_succeeded         # server
reservation_submitted                 # server
reservation_confirmed                 # server
reservation_rejected                  # server
reservation_change_proposed           # server
reservation_change_accepted           # server
reservation_cancel_quote_viewed
reservation_cancelled                 # server
reservation_seated                    # server
reservation_completed                 # server
reservation_no_show_marked            # server
reservation_no_show_corrected         # server
refund_requested                      # server
refund_succeeded                      # server
```

예약자명, 전화번호, 요청사항, 결제수단을 이벤트에 넣지 않는다.

### 8.7 점주

```text
owner_claim_started
owner_claim_submitted
owner_claim_decided                  # server
owner_member_invited
owner_branch_profile_updated
owner_hours_updated
owner_menu_updated
owner_review_response_published
owner_reservation_board_viewed
owner_reservation_action_completed
owner_analytics_viewed
owner_export_requested
```

### 8.8 운영

```text
operations_case_created
operations_case_triaged
operations_case_assigned
operations_decision_recorded
operations_action_executed
operations_case_reopened
operations_case_closed
```

운영 분석 스트림에는 사건의 민감 증거나 자유 메모를 넣지 않는다.

### 8.9 광고

```text
ad_eligible_request
ad_impression
ad_click
ad_destination_viewed
ad_conversion_attributed
ad_hidden_or_reported
```

광고 이벤트는 `campaignId`, `creativeId`, `placementId`, 표시 문구 버전, 자연 결과와의 중복 여부를 갖는다. 자연 위치를 광고 위치로 덮어쓰지 않는다.

---

## 9. 노출 이벤트

### 9.1 qualified impression

목록에 데이터가 내려왔다는 것과 사용자가 봤다는 것을 구분한다.

초기 기준 예:

- 화면 내 픽셀 비율 50% 이상
- 최소 1초 유지
- 앱이 foreground
- 중복 노출 억제 창 적용

리스트 유형에 따라 기준이 다르면 event version 또는 속성으로 구분한다.

### 9.2 검색 위치

```text
absolutePosition
pagePosition
organicPosition
placementType
viewportId
```

광고가 끼어도 자연 순위의 위치를 별도로 유지한다.

### 9.3 노출 샘플링

대규모 노출은 비용 때문에 샘플링할 수 있다. 샘플링 확률과 단위를 이벤트에 남기고 클릭·예약 같은 희소 결과와 올바르게 가중 결합한다.

---

## 10. 검색 분석

### 10.1 검색 세션

동일 사용자의 연속 탐색을 `searchJourneyId`로 묶는다. 쿼리를 바꾸거나 지도를 움직여도 같은 의도일 수 있다.

종료 조건 예:

- 고의도 행동 발생
- 장시간 비활성
- 완전히 다른 지역·카테고리 의도
- 앱 세션 종료

### 10.2 성공 지표

- 상세 선택까지 시간
- 고의도 행동까지 시간
- 결과 목록에서 만족스러운 선택이 발생한 비율
- 결과 없음 후 회복 성공률
- 재검색 후 성공률
- 상위 K 내 성공 행동

### 10.3 실패 신호

- 즉시 뒤로 가기
- 반복적인 철자 변경
- 동일 의도의 많은 페이지 탐색 후 무행동
- 필터 적용 후 결과 없음
- 지도 영역을 크게 반복 이동
- 폐업·거리·영업시간 오류 신고

실패 신호 하나를 사용자 불만으로 확정하지 않고 복합적으로 본다.

### 10.4 오프라인 평가 연결

검색 요청과 랭킹 버전을 기록해 판단 라벨, 클릭, 저장, 예약 결과를 오프라인 평가 데이터셋으로 연결한다. 위치 편향을 보정하지 않은 클릭을 순수 관련성 라벨로 쓰지 않는다.

---

## 11. 리뷰·평점 분석

### 11.1 공급과 품질 분리

리뷰 수 증가와 유효 리뷰 증가를 분리한다.

```text
submitted reviews
published reviews
rating-eligible reviews
verified eligible reviews
reviews later limited/removed
unique contributing visitors
```

### 11.2 평점 모델 모니터링

- 모델 버전별 점수 분포
- 장르·지역·가격대·리뷰 수별 분포
- 점수 변경 폭
- 신뢰 구간 폭
- 신규 지점 수축 정도
- 검증 리뷰와 비검증 리뷰의 영향
- 특정 리뷰어 집단의 총 영향 집중도
- 이상 군집 제거 전후 변화

### 11.3 조작 탐지 평가

- 검토 표본 기준 정밀도·재현율
- 이의 제기 뒤집힘
- 정상 신규 사용자에 대한 오탐
- 점주·대행사 군집 탐지 시간
- 탐지 회피 후 재발

탐지 모델의 내부 위험 신호를 일반 분석 셀프서비스에 공개하지 않는다.

### 11.4 리뷰어 전문성

전문성 점수가 특정 인구통계나 유명도 대리변수에 과도하게 연결되지 않는지 본다. 팔로워 수, 글 길이, 비싼 음식점 방문 수를 품질의 자동 대리변수로 쓰지 않는다.

---

## 12. 예약 분석

### 12.1 퍼널 단위

예약 방식별로 분리한다.

```text
instant
request
external_redirect
phone
manual_phone
walk_in
partner
```

외부 링크 클릭을 예약 확정으로 계산하지 않는다.

### 12.2 실패 분류

```text
no_inventory
hold_conflict
hold_expired
payment_failed
payment_unknown
user_abandoned
merchant_rejected
merchant_timeout
policy_validation
technical_error
partner_unavailable
```

사용자가 떠난 것과 시스템이 실패한 것을 같은 `drop-off`로 묶지 않는다.

### 12.3 점주 운영 결과

- 승인 응답시간 분포
- 시간대·요일별 거절률
- 점주 변경 제안률
- 점주 취소율
- 과다 예약 사건
- 좌석 활용률과 온라인 판매 가능률
- 외부 채널 충돌

좌석 활용률 최적화가 사용자 대기와 과밀 운영을 악화시키지 않는지 함께 본다.

### 12.4 방문과 노쇼

노쇼율 분모는 확정 예약이며 점주 취소, 시스템 오류, 중복 예약은 제외 또는 별도 분류한다. 노쇼 정정률이 높은 지점은 판정 품질을 조사한다.

---

## 13. 점주 분석 제품

### 13.1 제공 가능 지표

- 검색 노출과 상세 조회
- 저장, 길 찾기, 전화, 예약 전환
- 자연과 광고 유입 분리
- 지역·카테고리 비교의 큰 집계
- 예약 시간대와 인원 분포
- 승인 시간, 취소, 노쇼
- 공식 정보 완성도와 최신성
- 공개 리뷰의 구조화된 주제 요약

### 13.2 제공하지 않는 정보

- 개별 사용자의 검색 이력
- 누가 지점을 저장했는지
- 리뷰어의 비공개 위험 점수
- 다른 음식점의 비공개 상세 수치
- 임계치 이하 작은 집단
- 민감한 위치·방문 패턴
- 점주가 사용자를 보복하거나 접촉할 수 있는 식별 정보

### 13.3 작은 수 억제

정확한 임계치는 재식별 위험 평가 후 정한다.

```text
if unique_users < threshold:
  hide metric or widen date/category bucket
```

여러 필터를 조합해 임계치를 우회하지 못하도록 쿼리 예산, 고정된 차원, 기간 제한을 둔다.

### 13.4 리뷰 주제 요약

점주에게 원문을 대량 분석해 개인을 추론시키지 않는다. 공개 리뷰만 사용하며 표본이 충분할 때 `음식`, `서비스`, `대기`, `분위기` 같은 집계 주제를 제공한다. 생성형 요약은 근거 리뷰 범위, 최신성, 오류 신고 방법을 갖춘다.

---

## 14. 데이터 파이프라인

### 14.1 계층

```text
application databases and domain events
  -> durable event/outbox ingestion
  -> immutable raw zone
  -> validated staging
  -> conformed models
  -> metric/semantic layer
  -> dashboards, notebooks, experiments, owner aggregates
```

### 14.2 소스 구분

| 소스 | 용도 |
|---|---|
| 서버 도메인 이벤트 | 거래·콘텐츠 상태의 최종 분석 사실 |
| 클라이언트 행동 이벤트 | 노출, 클릭, UI 흐름 |
| PostgreSQL CDC/스냅샷 | 상태 검산과 차원 정보 |
| 검색 로그 | 쿼리·랭킹 품질 |
| 공급자 데이터 | 결제·알림 전달 조정 |
| 운영 사건 | 품질·지원 결과 |

### 14.3 raw 데이터

- 수신 원문을 제한 기간 불변 저장한다.
- 수신일과 event time으로 파티셔닝한다.
- 스키마 버전과 생산자 버전을 보존한다.
- 개인정보 등급별 저장소와 접근을 분리한다.
- 삭제 요청을 전파할 수 있는 subject token을 유지한다.

### 14.4 변환

```text
deduplicate by eventId
validate schema/version
quarantine invalid records
normalize timestamps
classify bot/internal traffic
resolve allowed identity links
build facts and dimensions
compute metric definitions
```

### 14.5 지연 데이터

이벤트 발생 시각과 수신 시각을 둘 다 보존한다. 모바일 오프라인 전송, 웹훅 지연을 고려해 일별 지표를 일정 기간 재작성할 수 있게 한다. 재작성 완료 전 대시보드에 잠정 상태를 표시한다.

### 14.6 exactly-once 가정 금지

파이프라인은 적어도 한 번 전송을 전제로 event ID로 중복 제거한다. 같은 예약 상태 이벤트가 재전송되어도 전환 건수가 늘지 않게 한다.

---

## 15. 분석 데이터 모델

### 15.1 사실 테이블

```text
fact_search_request
fact_search_impression
fact_branch_view
fact_decision_action
fact_review_lifecycle
fact_reservation_lifecycle
fact_payment_movement
fact_owner_action
fact_operations_case
fact_experiment_exposure
```

### 15.2 차원

```text
dim_date
dim_branch_snapshot
dim_category
dim_geo_bucket
dim_user_cohort
dim_platform_version
dim_search_model_version
dim_rating_model_version
dim_policy_version
dim_experiment
```

### 15.3 slowly changing dimension

지점 카테고리, 지역, 점주 인증, 예약 가능 상태가 바뀌어도 과거 사건 당시 값을 재현할 수 있게 유효 기간이 있는 스냅샷 차원을 사용한다.

### 15.4 금전 원장

결제 분석은 금액 부호가 있는 movement로 구성한다.

```text
authorization
capture
void
refund
fee
chargeback
adjustment
```

`reservation.paymentStatus` 스냅샷만 합산하지 않는다.

---

## 16. 신원과 세션

### 16.1 식별자

```text
anonymous installation/session token
authenticated account token
merchant organization/member token
internal operator token
```

외부 도구에는 원본 내부 ID 대신 분석 전용 토큰을 사용한다.

### 16.2 익명-로그인 연결

로그인 전후 행동 연결은 명시된 분석 목적과 보존 범위 안에서만 한다. 로그아웃 후 다른 계정이 같은 기기를 쓰는 경우를 고려해 기기 전체의 영구 프로필을 만들지 않는다.

### 16.3 세션 규칙

플랫폼별 동일한 기본 비활성 기준을 사용하되 예약 결제처럼 외부 인증 대기가 있는 흐름은 journey ID로 연결한다. 세션 정의 변경은 metric version을 올린다.

### 16.4 사용자 삭제

사용자 요청 시 원본 분석 토큰과 연결을 삭제·격리하고, 법적·통계적 보존이 허용된 집계만 남긴다. 작은 집계에서 재식별되지 않는지 검토한다.

---

## 17. 데이터 계약

### 17.1 이벤트 스키마 소유

각 이벤트는 생산 도메인 팀이 소유하고 분석 담당과 공동 검토한다.

```text
event name/version
owner
business meaning
trigger timing
required/optional properties
allowed values
privacy class
retention class
sample payload
tests
deprecation plan
```

### 17.2 변경 규칙

- 선택 속성 추가: 호환 변경
- 필수 속성 추가: 새 이벤트 버전
- 의미 변경: 새 이벤트 또는 버전
- 열거형 값 추가: 소비자 fallback 확인
- 삭제: 사용량 확인과 유예 후

### 17.3 CI 검증

- 스키마 lint
- 샘플 validation
- 개인정보 금지 필드 탐지
- 앱·서버 이벤트 이름 등록 확인
- 이벤트 버전 호환성
- 필수 도메인 이벤트 계약 테스트

### 17.4 이벤트 생산 테스트

이벤트 함수가 호출됐는지만 테스트하지 않는다. 실제 사용자 행동당 정확히 어떤 이벤트가 몇 번, 어떤 시점, 어떤 값으로 발생하는지 검증한다.

---

## 18. 데이터 품질

### 18.1 품질 차원

- 완전성: 필수 이벤트·필드가 있는가
- 유일성: 중복 이벤트가 제거되는가
- 유효성: 스키마와 상태 전이를 따르는가
- 일관성: 원장 수치와 분석 수치가 맞는가
- 적시성: 목표 시간 안에 도착하는가
- 분포 안정성: 앱 버전·플랫폼별 급변이 없는가

### 18.2 핵심 검산

```text
confirmed reservations in warehouse
  vs PostgreSQL reservation status history

successful payment movements
  vs payment provider settlement/reconciliation

published rating-eligible reviews
  vs rating input snapshot

owner claims approved
  vs active organization permissions
```

### 18.3 격리

유효하지 않은 이벤트는 조용히 버리지 않고 quarantine에 보낸다. 생산자, 버전, 오류 사유, 최초·최근 발생, 건수를 대시보드화한다.

### 18.4 배포 모니터링

새 앱·서버 버전 배포 후 이벤트 총량만 보지 않고 플랫폼·버전별 필드 null률과 퍼널 단절을 확인한다.

---

## 19. 실험 설계

### 19.1 실험이 필요한 경우

- 둘 이상의 합리적인 UX가 있고 결과를 행동으로 평가할 수 있다.
- 위험이 통제 가능하고 사용자에게 기만적이지 않다.
- 충분한 표본과 기간을 확보할 수 있다.

정책 준수, 보안 통제, 개인정보 권리를 전환율 실험 대상으로 삼지 않는다.

### 19.2 사전 등록

```text
hypothesis
primary metric
guardrails
unit of randomization
target population
sample size and minimum detectable effect
planned duration
exclusion rules
stopping rules
segmentation plan
owner and approver
```

결과를 본 뒤 주 지표를 바꾸지 않는다.

### 19.3 무작위화 단위

| 실험 | 권고 단위 |
|---|---|
| 개인화 UI | 사용자 |
| 검색 랭킹 | 사용자 또는 검색 세션, 누출 검토 |
| 점주 예약 도구 | 지점/조직 |
| 지역 공급 정책 | 지역 클러스터 |
| 알림 | 사용자 또는 예약 |

같은 지점에서 점주 도구 변형을 섞어 운영 혼란을 만들지 않는다.

### 19.4 노출 시점

실험 할당과 실제 노출을 구분한다. 사용자가 변형 기능을 볼 수 있는 시점에 `experiment_exposed`를 서버 또는 클라이언트의 신뢰 가능한 위치에서 기록한다.

### 19.5 중단 기준

- 예약·결제 오류 증가
- 잘못된 정보 신고 증가
- 검색 latency/SLO 위반
- 접근성 또는 특정 플랫폼 회귀
- 콘텐츠 안전 문제
- 점주 취소·지원 문의 급증

### 19.6 해석

- 통계적 유의성과 실질적 효과를 함께 본다.
- 여러 지표·세그먼트 탐색의 오류를 인정한다.
- 신규성 효과와 요일·휴일을 고려한다.
- 승리 결과도 장기 유지·신뢰 표본으로 확인한다.
- 유의하지 않음은 동일함의 증명이 아니다.

---

## 20. 검색·평점 모델 실험

### 20.1 일반 UI 실험과 분리

검색·평점 모델은 오프라인 평가, shadow, 제한 트래픽, 온라인 실험, 운영 승인 순으로 진행한다.

### 20.2 검색 가드레일

- 지역·카테고리 coverage
- 신규·리뷰 적은 지점 노출
- 광고와 자연 구분
- 결과 다양성
- 잘못된 영업 상태 노출
- p95/p99 지연

### 20.3 평점 모델 가드레일

- 점수 대규모 급변
- 특정 지역·가격대 체계적 이동
- 소수 리뷰어 영향 집중
- 조작 군집 민감도
- 사용자 설명 가능성
- 점주 계약 여부와 독립성

평점 자체를 사용자마다 다르게 표시하는 실험은 신뢰를 해칠 수 있으므로 하지 않는다. 개인화는 추천·정렬에 적용하고 공개 대표 점수는 동일 버전을 보여 준다.

---

## 21. 마케팅과 어트리뷰션

### 21.1 채널 측정

```text
owned: 앱 알림, 이메일, 자체 콘텐츠
earned: 공유, 검색 엔진 자연 유입
paid: 광고 캠페인
partner: 지도, 예약, 제휴
```

### 21.2 어트리뷰션 한계

- 마지막 클릭만으로 실제 기여를 확정하지 않는다.
- iOS/브라우저 프라이버시 제한을 우회하려 하지 않는다.
- 확률적 fingerprinting을 기본 전략으로 쓰지 않는다.
- 채널별 측정 가능성 차이를 보고서에 표시한다.

### 21.3 프로모션

쿠폰·혜택이 리뷰 평가에 영향을 주면 이해관계 공개와 연결한다. 프로모션 참여 리뷰를 일반 자연 리뷰와 분석상 구분할 수 있어야 한다.

---

## 22. 대시보드

### 22.1 경영/제품 건강

- 북극성 및 가드레일
- 공급·신뢰·탐색·결정·거래·기여·유지
- 지역·카테고리 coverage
- 최근 정의 변경과 데이터 품질 상태

### 22.2 실시간 운영

- API/SLO
- 검색 오류와 결과 없음 급증
- 리뷰 게시·검수 적체
- 예약·결제 불변식
- 환불 지연
- 점주 승인 적체
- 사건 큐 연령

### 22.3 팀 대시보드

각 팀은 지표마다 다음을 볼 수 있어야 한다.

```text
definition link
owner
last successful refresh
data quality status
comparison period
known incident annotation
segment filters
```

### 22.4 숫자 공개 상태

대시보드 수치는 `provisional`, `final`, `backfilled`, `degraded` 상태를 가질 수 있다. 지연 데이터 재처리 중인 숫자를 확정값처럼 공유하지 않는다.

---

## 23. 셀프서비스와 접근 통제

### 23.1 데이터 역할

```text
product_aggregate_reader
merchant_aggregate_reader
trust_restricted_analyst
payment_restricted_analyst
privacy_admin
data_engineer
auditor
```

### 23.2 기본 셀프서비스

대부분 분석가는 개인정보가 제거된 semantic layer와 집계를 사용한다. raw 이벤트와 식별 연결 테이블은 별도 승인 대상이다.

### 23.3 쿼리 감사

민감 데이터셋 조회, 대량 결과, 내보내기에는 사용자, 목적, 쿼리, 결과 크기, 시각을 기록한다.

### 23.4 비프로덕션

실사용자 분석 원본을 개발·데모 환경에 복제하지 않는다. 합성 데이터 또는 승인된 비식별 샘플을 사용한다.

---

## 24. 프라이버시 기준

### 24.1 금지 또는 제한 필드

기본 분석 이벤트에서 금지:

- 이메일, 전화번호, 실명
- 정확한 주소와 GPS 원시 좌표
- 예약 자유 요청
- 리뷰 초안과 비공개 목록 메모
- 영수증 이미지와 결제수단
- 인증 토큰과 세션 비밀
- 운영 사건의 증거 원문

### 24.2 위치 버킷

검색 품질에 위치가 필요하면 목적에 따라 다음 중 가장 거친 수준을 사용한다.

- 행정구역 코드
- 격자 버킷
- 거리 구간
- 사용자 제공 탐색 지역

정확한 기기 위치를 장기 행동 프로필에 연결하지 않는다.

### 24.3 보존

```text
raw identifiable/linked events: shortest justified period
validated pseudonymous facts: purpose-based period
aggregates: longer if re-identification risk controlled
experiment assignments: analysis and audit period
financial aggregates: legal/accounting policy
```

정확한 기간은 [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)의 데이터 목록과 일치시킨다.

### 24.4 외부 분석 도구

- 전송 필드 allowlist
- 지역·재위탁자 확인
- 광고 목적 재사용 금지 계약
- 삭제 API와 사용자 요청 전파
- 세션 리플레이의 입력 마스킹
- URL과 DOM에 개인정보가 없는지 확인
- 공급자 장애 시 앱 핵심 기능 비의존

세션 리플레이는 기본 비활성으로 시작하고 별도 위험 검토 없이는 예약·점주·운영자 화면에 적용하지 않는다.

---

## 25. 데이터 비용 관리

### 25.1 비용 원인

- 과도한 화면·스크롤 이벤트
- 검색 노출 전수 수집
- 중복 실험 속성
- 장기 raw 보존
- 비효율 쿼리와 전체 재처리
- 점주 자유 차원 쿼리

### 25.2 통제

- 이벤트 예산과 owner
- 샘플링
- 속성 cardinality 제한
- 파티션과 증분 변환
- 집계 테이블과 semantic cache
- 미사용 이벤트·대시보드 정리
- 팀별 비용 표시

비용 절감을 이유로 예약·결제 감사 사실을 제거하지 않는다. 고용량 UX 분석부터 줄인다.

---

## 26. 출시 전 계측 검증

### 26.1 기능별 체크

- 이벤트가 성공과 실패를 구분한다.
- 서버 최종 사실과 클라이언트 의도를 구분한다.
- 멱등 재시도가 중복 전환을 만들지 않는다.
- 필수 속성의 null률이 허용 범위다.
- 개인정보 금지 필드가 없다.
- 앱 버전과 웹에서 의미가 같다.
- 오프라인·재전송 시 event time이 유지된다.
- 접근성 경로에서도 같은 의미 이벤트가 발생한다.

### 26.2 분석 승인

기능 출시 체크리스트에 다음 owner가 서명한다.

```text
product owner
engineering owner
analytics owner
privacy/security reviewer for sensitive features
operations owner for transactional features
```

---

## 27. 초기 구현 순서

### A0. 계약 기반

1. 이벤트 봉투와 스키마 저장소
2. 서버·앱 공용 tracking API
3. 금지 필드 검사
4. 개발·테스트 트래픽 분리
5. 원시 수집과 quarantine

### A1. 탐색

1. 검색 요청·결과·노출·선택
2. 음식점 상세
3. 저장·길찾기·전화
4. 검색 journey
5. 공급 coverage와 데이터 정확도

### A2. 리뷰와 신뢰

1. 리뷰 생명주기
2. 방문 인증
3. 신고·결정·이의 제기
4. 평점 모델 버전 모니터링
5. 신뢰 지표 표본

### A3. 점주와 예약

1. claim과 공식 정보
2. 예약 서버 이벤트
3. 결제 movement와 조정
4. 점주 예약 품질
5. 점주 집계 API

### A4. 실험과 고도화

1. 실험 할당·노출
2. 사전 등록과 분석 템플릿
3. 검색·추천 오프라인 평가
4. 장기 유지와 만족 조사
5. 비용·보존 최적화

---

## 28. v1 최소 이벤트

첫 탐색·리뷰 베타에 반드시 필요한 이벤트:

```text
session_started
search_submitted
search_results_returned
search_result_impression
search_result_selected
search_zero_result_shown
branch_viewed
branch_saved
branch_directions_requested
branch_phone_requested
review_draft_created
review_verification_completed
review_published
review_reported
branch_data_correction_submitted
```

그리고 다음 서버 사실:

```text
branch_assertion_decided
review_moderation_decided
rating_snapshot_published
search_index_version_deployed
```

핵심 의미가 없는 세부 UI 이벤트를 먼저 수백 개 만들지 않는다.

---

## 29. 미결정 사항

- 분석 저장소와 변환 도구의 구체 제품 선정
- 북극성에서 전화·길찾기·저장 행동을 같은 무게로 볼지
- 방문 만족을 어떤 표본과 주기로 조사할지
- 검색어 원문 품질 연구의 동의·보존·샘플링 방식
- anonymous와 account 행동 연결 기간
- 점주 지표의 작은 수 억제 임계치
- 점주 비교 벤치마크의 최소 지역·카테고리 표본
- 광고 어트리뷰션 창과 자체 예약 외 행동의 가치 측정
- 세션 리플레이 도입 여부
- 분석 웨어하우스 도입 시점과 초기 PostgreSQL 집계 범위

---

## 30. 완료 조건

- [ ] 북극성 지표와 가드레일이 제품팀·운영팀에 같은 정의로 적용된다.
- [ ] 모든 핵심 이벤트에 owner, version, privacy class가 있다.
- [ ] 예약·결제·리뷰 게시 수치는 서버 사실로 계산한다.
- [ ] 검색 자연 결과와 광고 성과가 분리된다.
- [ ] 이벤트 CI가 스키마와 금지 필드를 검증한다.
- [ ] 원장과 분석 수치의 일일 검산이 있다.
- [ ] 대시보드에 최신성·품질·정의 링크가 표시된다.
- [ ] 실험은 사전 등록과 중단 가드레일을 갖는다.
- [ ] 점주 분석에서 작은 수와 사용자 식별이 보호된다.
- [ ] 삭제·동의 철회가 분석 파이프라인에 전파된다.
- [ ] 미사용 이벤트와 보존 비용을 정기 검토한다.

---

## 31. 연관 문서

- [PRODUCT.md](./PRODUCT.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
