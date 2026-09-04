# 도락 광고·수익화 시스템 설계

| 항목 | 내용 |
| --- | --- |
| 문서 상태 | Draft |
| 문서 버전 | 0.1.0 |
| 기준 제품 | [PRODUCT.md](../product/PRODUCT.md) |
| 주요 독자 | 제품, 광고, 점주, 예약, 결제, 데이터, 운영, 법무, 재무 |
| 핵심 원칙 | 돈이 공개 점수·자연 검색·리뷰 판정을 바꾸지 않는다 |

## 1. 목적

이 문서는 도락이 사용자 신뢰를 훼손하지 않으면서 지속 가능한 매출을 만드는 방식을 정의한다. 단순한 광고 화면이 아니라 다음 전체 경계를 다룬다.

- 어떤 상품을 누구에게 판매하는가
- 무료 점주 권리와 유료 기능의 경계는 어디인가
- 광고가 자연 검색·추천·공개 점수와 어떻게 분리되는가
- 광고 자격, 예산, 입찰, 노출, 클릭, 귀속을 어떻게 계산하는가
- 예약·구독·광고 과금을 어떻게 원장화하고 정정하는가
- 경제적 이해관계를 사용자가 즉시 알아볼 수 있게 어떻게 표시하는가
- 허위 광고, 자기 클릭, 계정 farm, 매출 신호 세탁을 어떻게 방지하는가
- 영업, 운영, 재무 담당자 권한을 어떻게 제한하고 감사하는가

이 문서는 법률 자문이 아니다. 출시 지역, 상품, 표시 문구와 계약 구조가 확정되면 한국 법률·세무·결제 전문가의 검토를 거친다.

---

## 2. 비목표

초기 설계에서 다음을 하지 않는다.

- 돈을 내면 공개 점수나 리뷰 수를 올려 주는 상품
- 부정적 리뷰 삭제·숨김을 보장하는 상품
- 광고 구매 여부에 따라 점주 claim이나 기본 정보 수정 권리를 차별하는 것
- 광고를 자연 검색 결과처럼 위장하는 것
- 사용자별 민감 추론을 활용한 광고 targeting
- 광고 클릭을 자연 추천 선호로 자동 전환하는 것
- 검증되지 않은 예상 방문자 수·매출 증대를 확정적으로 약속하는 것
- 사용자 개인정보나 개별 행동 원장을 점주에게 판매하는 것
- 실시간 복잡한 exchange·제3자 광고망을 첫 버전에 도입하는 것

---

## 3. 수익화 헌장

### M-P01. 점수 독립성

공개 점수, 리뷰 점수 포함 여부, 리뷰어 전문성, 장르·지역 랭킹은 광고·구독·예약 계약을 입력으로 사용하지 않는다.

### M-P02. 자연 결과 독립성

자연 검색과 organic 추천은 광고 구매 여부를 ranking feature로 사용하지 않는다. 광고는 별도 후보·정책·순위 pipeline에서 계산한 뒤 명시된 placement에만 합성한다.

### M-P03. 기본 점주 권리는 무료

claim, 기본 정보 수정 제안, 영업시간·휴무 관리, 공식 답글, 보안 설정, 개인정보 요청, 이의 제기처럼 원장의 정확성과 권리 보호에 필요한 기능은 유료벽 뒤에 두지 않는다.

### M-P04. 경제적 이해관계의 근접 표시

광고·협찬·무상 제공·수수료 관계는 사용자가 콘텐츠를 판단하는 시점에 명확하고 쉽게 인식할 수 있게 표시한다. 약관이나 화면 아래에만 숨기지 않는다.

### M-P05. 지불은 측정 가능한 권리와 연결

과금은 계약된 구독 기간, 유효한 광고 노출·클릭, 완료된 예약 등 명시된 billable event에만 연결한다. 추정치를 원장에 직접 청구하지 않는다.

### M-P06. 정정 가능한 재무 원장

금액을 덮어쓰지 않는다. 청구, 결제, credit, 환불, chargeback, 세금 문서를 별도 불변 기록으로 연결한다.

### M-P07. 판매 조직의 정책 우회 금지

영업 담당자는 광고 승인, 리뷰 판정, 점수 모델, 청구 원장을 직접 수정할 수 없다. 매출 목표가 정책 결정을 덮지 못하게 역할과 승인을 분리한다.

### M-P08. 최소한의 targeting

초기 광고는 검색어, 탐색 지역, 시간, 인원, 장르처럼 사용자가 현재 요청한 문맥을 우선한다. 정확한 장기 위치 이력, 리뷰 본문에서 추론한 민감 특성, 제재·복구 상태는 사용하지 않는다.

---

## 4. 매출 포트폴리오

### 4.1 우선순위

| 상품 | 구매자 | 과금 단위 | 초기 우선순위 | 신뢰 위험 |
| --- | --- | --- | --- | --- |
| 점주 운영 구독 | 점주 조직 | 월·연 구독 | P1 | 낮음~중간 |
| 예약 SaaS | 예약 사용 지점 | 월 구독 또는 기능 tier | P1 | 낮음 |
| 예약 성과 수수료 | 예약 사용 지점 | seated/completed cover 또는 예약 | P2 | 중간 |
| 검색·지도 광고 | 승인된 점주 | 유효 클릭 또는 노출 | P2 | 높음 |
| 추천 surface 광고 | 승인된 점주 | 유효 노출·클릭 | P3 | 높음 |
| 프로모션·쿠폰 | 점주 조직 | 캠페인·성과 | P3 | 중간~높음 |
| 집계 insight | 점주 조직 | 구독 tier | P2 | 개인정보 위험 |
| 데이터 라이선스 | 기업 | 계약 | 보류 | 매우 높음 |

광고보다 점주 운영·예약 도구를 먼저 수익화하면 자연 결과의 독립성을 지키면서 실제 운영 가치를 검증할 수 있다.

### 4.2 수익으로 만들지 않는 영역

- 공개 점수 상승
- 리뷰 판정 결과
- 신고 우선 처리 결과
- 원장 오류 정정의 승인 결과
- 검색 색인 등록 자체
- 사용자 데이터 삭제·내보내기
- 점주 claim의 결과
- 보안 복구 결과

지원 응답 시간 tier는 판매할 수 있어도 판정 결과와 법정·정책상 기한을 판매하지 않는다.

---

## 5. 무료 점주 기능과 유료 기능

### 5.1 무료 기준선

- 조직·지점 claim과 권한 관리
- 상호·주소·전화·영업시간·휴무 수정 제안
- 기본 메뉴·가격 정보 관리
- 대표 사진·공식 사진 제출
- 리뷰 공식 답글과 신고·이의 제기
- 기본 예약 상태 확인, 도입된 경우
- 계정·MFA·구성원 보안
- 핵심 정책·청구 내역·데이터 권리 접근

### 5.2 유료 후보

- 고급 메뉴 일괄 편집·예약 재고 자동화
- 추가 사용자·지점 단위 운영 workflow
- 세분화된 집계 insight와 비교 기간
- CRM이 아닌 제한된 재방문 운영 도구
- 예약 rule·deposit·waitlist 고급 기능
- 외부 POS·예약 파트너 integration
- 공식 프로모션 module
- 광고 캠페인 관리
- 더 긴 비식별 집계 history와 export

### 5.3 feature entitlement

구독 결제 상태를 화면 곳곳에서 직접 검사하지 않는다. `entitlement` 읽기 모델을 사용한다.

```text
plan/contract
 -> subscription state
 -> entitlement grant
 -> organization/branch scoped authorization
 -> feature usage quota
```

결제 실패 즉시 모든 운영 데이터를 잠그지 않는다. grace, 읽기 전용, export, 해지 후 보존 정책을 상품별로 정의한다.

---

## 6. 광고 상품

### 6.1 placement 후보

```text
search_top_slot
search_inline_slot
map_sponsored_pin
branch_detail_related_slot
home_module_slot
recommendation_inline_slot
editorial_sponsor_slot
```

각 placement는 별도 정책·최대 개수·표시·측정 조건을 가진다. 하나의 캠페인이 자동으로 모든 surface에 노출되지 않는다.

### 6.2 검색 광고

- 검색어·장르·지역 문맥에 관련된 지점만 자격을 얻는다.
- 영업 상태와 실제 서비스 지역을 확인한다.
- 자연 결과 순위를 밀어 올리는 값이 아니라 별도 슬롯을 사용한다.
- 결과가 광고만으로 첫 화면을 점유하지 않게 density 상한을 둔다.
- 같은 지점이 광고와 자연 결과에 함께 있으면 placement별 중복 억제 규칙을 적용한다.

### 6.3 지도 광고

- 일반 핀과 모양·label을 구분하되 지도를 방해할 정도로 과장하지 않는다.
- viewport 밖 지점을 억지로 노출하지 않는다.
- 지도 이동 시 재요청·노출 조건과 빈도를 제한한다.
- 광고 핀 탭은 광고 interaction이며 자연 검색 click과 분리한다.

### 6.4 홈·추천 광고

- organic 추천 모듈과 광고 모듈의 제목·배경·label을 구분한다.
- 개인화 추천 이유를 광고 문구처럼 재사용하지 않는다.
- 자연 추천에서 제외된 정책 위반 지점은 광고로 우회하지 못한다.
- frequency cap과 반복 브랜드 억제를 적용한다.

### 6.5 editorial sponsorship

편집 콘텐츠 제작비를 받은 경우 sponsor와 편집 독립성을 근접 표시한다. 구매 가능한 award, 숨은 best 목록, 점수처럼 보이는 sponsor badge는 허용하지 않는다.

---

## 7. 광고와 organic의 구조적 분리

```text
organic request
 -> organic candidates
 -> organic policy/ranker
 -> organic slate

ad opportunity
 -> campaign eligibility
 -> ad policy/review
 -> budget/pacing
 -> auction/ranker
 -> sponsored slate

organic slate + sponsored slate
 -> placement composer
 -> explicit disclosure
 -> separate impression/click events
```

### 7.1 금지된 데이터 흐름

```text
campaign spend -X-> branch_score
subscription tier -X-> review eligibility
ad CTR -X-> organic user preference
sales request -X-> moderation decision
owner payment -X-> canonical data confidence
```

### 7.2 허용되는 공통 신호

영업 상태, 지점 위치, 카테고리, 안전·정책 상태처럼 광고와 organic 모두에 필요한 원장 사실은 공유할 수 있다. 공유 값이 바뀌어 두 pipeline 모두에서 제외되는 것은 유료 차별이 아니다.

### 7.3 코드·권한 경계

- 광고 feature namespace와 organic feature namespace 분리
- 광고 배포 설정과 평점 모델 승인 권한 분리
- 광고 index 또는 필드의 명시적 분리
- 응답의 `placement: sponsored|organic` 필수
- 분석 dataset과 dashboard 분리
- 광고 제거 kill switch가 organic을 중단시키지 않음

---

## 8. 캠페인 구조

```text
advertiser organization
 -> billing account
 -> campaign
    -> ad group
       -> target rule
       -> creative
       -> promoted branch
       -> bid/budget
 -> placement delivery
```

### 8.1 campaign

```text
objective
start/end
total/daily budget
currency
status
owner organization
billing account
policy version
```

### 8.2 ad group

```text
placements
context targets
schedule
bid strategy
frequency cap
branch set
audience exclusions
```

### 8.3 creative

```text
headline
body
media asset
destination
offer and conditions
disclosure label
language
review status/version
```

지점 원장 사진을 광고에 사용해도 creative snapshot과 권리 근거를 별도로 남긴다. 점주가 사진을 바꾸었다고 이미 승인된 광고가 설명 없이 바뀌면 안 된다.

---

## 9. 캠페인 상태 머신

```text
draft
 -> submitted
 -> under_review
 -> approved
 -> scheduled
 -> active
 -> paused
 -> ended

under_review -> changes_required | rejected
approved/active -> suspended
any non-terminal -> cancelled
```

예산 소진은 캠페인의 정책 상태와 분리된 delivery state다.

```text
eligible
budget_limited
daily_budget_exhausted
total_budget_exhausted
payment_hold
inventory_limited
```

캠페인 수정 시 검토가 필요한 필드는 새 revision을 만들고 이전 승인본은 명시적 전환 전까지 유지한다.

---

## 10. 광고 자격

### 10.1 advertiser

- 승인된 owner organization과 branch authority
- 활성 billing account
- 필요한 사업자·계약 확인
- 제재·미납·보안 hold 없음
- 캠페인 생성 권한과 최근 인증

### 10.2 branch

- 실제 영업 또는 허용된 사전 오픈 상태
- 주소·카테고리·기본 정보의 최소 신뢰도
- 심각한 안전·사칭·폐업 분쟁 없음
- placement 지역·검색 문맥과 관련성
- 예약 광고면 실제 예약 가능 상태

### 10.3 creative

- 표시 문구와 offer 조건 일치
- 가격·기간·재고·제외 조건 명시
- 거짓·과장·기만·부당 비교 위험 검수
- 권리 확인된 미디어
- 도락 award·점수·사용자 리뷰의 오인 인용 금지
- 사용자 리뷰 인용 시 별도 권리·문맥·경제 관계 검토
- destination이 앱 안 지점·예약 화면과 일치

### 10.4 실시간 재검사

승인된 캠페인도 delivery 시 다음을 다시 검사한다.

- branch가 폐업·정지·숨김 상태가 아닌가
- creative·offer가 만료되지 않았는가
- 예약 재고가 주장과 모순되지 않는가
- 예산·계약·결제가 유효한가
- frequency cap과 사용자 차단을 지키는가

---

## 11. targeting 정책

### 11.1 초기 허용

- 현재 검색어와 정규화된 query category
- 사용자가 탐색 중인 지도 viewport·행정구역
- 날짜·요일·식사 시간대
- 인원수·예약 날짜처럼 사용자가 직접 입력한 문맥
- 기기 locale와 앱 surface
- 넓은 가격대·음식 장르

### 11.2 제한 또는 금지

- 집·직장으로 추론한 위치
- 정확한 장기 이동 history
- 건강·종교·정치·성적 지향 등 민감 추론
- 리뷰 본문에서 추출한 개인 민감 특성
- 계정 복구·제재·신고·분쟁 정보
- 비공개 예약 연락처
- 다른 사용자의 방문 인증 증빙
- 매우 작은 cohort의 식별 가능한 targeting

### 11.3 사용자 제어

- 광고임을 항상 인지
- 반복 광고 숨기기 또는 신고
- 가능한 경우 “왜 이 광고인가” 설명
- 개인화 광고 선택권과 organic 개인화 선택권 분리
- 동의 철회 후 delivery cache 전파

---

## 12. 예산·입찰·pacing

### 12.1 초기 단순 모델

복잡한 실시간 경매보다 placement별 정액 CPC 또는 기간·지역별 sponsor 상품으로 시작할 수 있다. inventory와 부정행위 데이터를 확보하기 전 정밀 입찰 최적화를 과장하지 않는다.

### 12.2 auction 후보

```text
ad_rank = bid × predicted_valid_action × quality × relevance × policy_multiplier
```

- `bid`: 허용 범위와 화폐 단위가 검증된 입찰
- `predicted_valid_action`: bot·오클릭이 아닌 예측
- `quality`: destination·정보 완성도·사용자 부정 피드백
- `relevance`: 현재 문맥과의 관련성
- `policy_multiplier`: 제재 우회용 임의 수치가 아닌 명시 정책

공개 점수 자체를 광고 구매 장벽으로 사용하지 않는다. 다만 영업·안전·정책 상태와 사용자의 현재 의도 관련성은 자격에 쓸 수 있다.

### 12.3 가격

- first-price, second-price 유사 방식 또는 정액을 상품별로 명시
- 광고주에게 실제 청구 단위와 상한 설명
- 소수·비활성 시장에서 과도한 가격 변동 방지
- 내부 테스트·보상 노출은 billable 제외

### 12.4 pacing

- 일 예산을 하루 초반에 모두 쓰지 않게 분산
- traffic forecast 오류 시 보수적 사용
- 예산 갱신과 delivery의 race를 원자적으로 처리
- 지연 이벤트를 고려한 spend reserve
- campaign pause 후 짧은 in-flight를 정산 규칙에 명시

### 12.5 frequency와 density

- 사용자·세션·지점·브랜드별 cap
- 한 화면 광고 개수 상한
- 연속 광고 방지
- 동일 지점의 sponsored/organic 중복 규칙
- 작은 지역에서 같은 advertiser 독점 방지

---

## 13. 노출 측정

### 13.1 opportunity와 impression 분리

```text
ad_opportunity_created
ad_selected
ad_response_served
ad_rendered
ad_viewable_impression
ad_clicked
destination_opened
reservation_started/completed
```

서버 응답만으로 viewable impression을 청구하지 않는다. client event를 무조건 신뢰하지도 않는다.

### 13.2 qualified visibility

placement별 화면 비율·최소 시간·foreground 조건을 버전화한다. 숫자는 실제 UI와 업계·법률 검토 후 확정한다.

### 13.3 중복

하나의 render lifecycle에서 retry·recompose·scroll 왕복으로 같은 impression을 여러 번 과금하지 않는다. `opportunity_id`, `decision_id`, `render_id`, `impression_id`를 연결한다.

### 13.4 오프라인·지연

- client event는 event time과 receive time을 모두 가짐
- 서명·session·sequence 검증
- 귀속 window가 닫힌 뒤 들어온 event 처리 정책
- offline queue 중복 제거
- 앱 clock을 청구의 단독 기준으로 사용하지 않음

---

## 14. 유효 클릭과 부정행위

### 14.1 무효 후보

- advertiser·같은 조직 구성원의 자기 클릭
- 자동화·headless·비정상 반복
- 화면 렌더 전에 발생한 click
- 거의 즉시 반복되는 오클릭
- 비정상 ASN·기기·계정 군집
- click farm과 incentive traffic
- 앱·API 내부 synthetic monitor
- 운영자·QA 명시 test traffic

### 14.2 판정 계층

```text
raw event
 -> syntax/device/session validation
 -> deterministic invalid rules
 -> near-real-time risk scoring
 -> billable provisional event
 -> delayed fraud reconciliation
 -> final billable event or credit
```

### 14.3 오탐과 이의 제기

광고주에게 개인 사용자 정보나 탐지 규칙을 노출하지 않고 날짜·placement·무효 사유 범주의 집계를 제공한다. 이의 제기는 원 event와 model/rule version을 보존해 재검토한다.

### 14.4 신호 세탁 방지

광고 클릭·예약을 organic popularity로 그대로 사용하지 않는다. 장기적으로 실제 방문 같은 공통 성과를 쓸 경우에도 acquisition source를 유지하고 인과·조작 위험을 검증한다.

---

## 15. 귀속

### 15.1 목적

광고가 검색·상세·예약 행동에 기여했는지 측정하되, 과도한 사용자 추적을 만들지 않는다.

### 15.2 초기 모델

- 도락 내부 first-party interaction만 사용
- click-through와 view-through 구분
- surface·상품별 귀속 window 버전
- last ad touch와 organic 경로를 함께 보존
- 한 전환을 여러 캠페인에 중복 청구하지 않음
- 취소·노쇼·환불에 따라 성과 상태 조정

### 15.3 cross-device

로그인 계정이라는 이유만으로 모든 광고 접촉을 무제한 결합하지 않는다. 목적, 고지, 보존기간과 사용자의 기대를 검토한다. 초기에는 동일 로그인·짧은 기간·도락 내부에 제한한다.

### 15.4 보고

광고주에게 제공 가능한 집계:

```text
qualified impressions
valid clicks
branch detail opens
direction/reservation starts
confirmed/completed reservations, thresholded
spend and effective rate
invalid traffic credits
```

개별 사용자의 검색·방문·리뷰·연락처를 제공하지 않는다. 작은 셀은 threshold·기간 합산·억제를 적용한다.

---

## 16. 광고 표시 UI

### 16.1 label

한국어 기본 후보는 `광고` 또는 법무 검토된 동등한 명확한 단어다. `추천`, `파트너`, `프로모션`만으로 경제적 관계를 모호하게 만들지 않는다.

### 16.2 위치

- 카드 또는 핀 자체에 근접
- 첫 노출에서 보임
- 스크롤·펼치기·hover 뒤에 숨기지 않음
- 색만으로 구분하지 않음
- screen reader 이름에 포함
- 작은 화면에서도 생략하지 않음

### 16.3 시각

- organic 카드와 기본 정보 비교는 가능
- label은 충분한 대비·크기·여백
- 점수와 혼동되는 sponsor badge 금지
- 지도 legend와 핀의 일관된 구분
- dark mode, 확대, 고대비에서도 유지

### 16.4 offer

할인·무료 제공 광고에는 적용 기간, 대상, 최소 주문·예약, 수량·시간 제한처럼 판단에 중요한 조건을 destination 근처에 제공한다.

### 16.5 협찬 리뷰·콘텐츠

사용자 또는 editorial 콘텐츠가 금전·무료 식사·할인·향후 성과 보상과 연결되면 관계 유형을 콘텐츠 판단 지점에 표시한다. 리뷰의 `disclosure_state`와 광고 캠페인의 sponsor record를 연결하되, 돈을 받은 리뷰를 일반 광고 creative로 자동 전환하지 않는다.

---

## 17. 점주 구독

### 17.1 계획 구조

```text
product catalog
 -> plan version
 -> price version
 -> subscription contract
 -> entitlement grants
 -> metered usage if any
 -> invoice
```

가격과 포함 기능을 기존 계약 행에 덮어쓰지 않는다. plan·price version과 효력일을 보존한다.

### 17.2 상태

```text
trialing
active
past_due
grace
suspended
cancel_at_period_end
cancelled
expired
```

subscription 상태와 organization 자체의 claim·권한 상태를 합치지 않는다.

### 17.3 변경

- upgrade 즉시 또는 다음 주기 정책
- downgrade 시 데이터·quota 영향 사전 표시
- prorating 규칙
- 무료 체험 중복·abuse 통제
- 가격 변경 고지와 동의
- 해지 경로를 가입보다 부당하게 어렵게 만들지 않음

### 17.4 지점·조직 범위

구독이 조직 전체인지 지점별인지 명시한다. 지점 이전·폐업·소유권 분쟁 시 entitlement를 새 owner에게 자동 이전하지 않는다.

---

## 18. 예약 수익

### 18.1 과금 후보

- 고정 SaaS
- confirmed reservation
- seated/completed cover
- deposit/payment 처리 fee
- 혼합형

### 18.2 권고 기준

초기에는 청구 근거를 설명하기 쉬운 고정 SaaS 또는 명확한 completed cover를 우선 검토한다. 단순 confirmed 과금은 취소·노쇼 분쟁이 많다.

### 18.3 billable 상태

예약 canonical 상태를 사용하되 청구 eligibility는 별도 record로 계산한다.

```text
reservation completed
AND not test/staff
AND branch contract active at service time
AND within reconciliation window
AND not duplicate/import exclusion
```

점주가 예약 상태를 임의 조작해 수수료를 회피하거나, 도락이 수수료를 위해 no-show를 completed로 바꾸지 못하게 감사·분쟁 흐름을 둔다.

### 18.4 사용자 가격

도락 수수료가 메뉴·예약 가격에 포함되는 방식, 사용자 부담 여부, 취소·환불 조건을 checkout 전에 명확히 표시한다. 지점별 hidden fee를 허용하지 않는다.

---

## 19. 청구·결제 원장

### 19.1 원칙

- amount는 minor unit 정수
- 통화 명시
- 모든 billable event는 유일 id
- invoice line은 계약·가격·event 근거 참조
- 결제 공급자 ID는 외부 참조, 내부 기본 키 아님
- 결제 원문·카드 정보 직접 저장 최소화
- 금액 정정은 reversal·credit note

### 19.2 흐름

```text
usage/billable event
 -> rating with price version
 -> invoice draft
 -> reconciliation
 -> invoice finalized
 -> payment attempt
 -> paid / past_due
 -> refund/credit/chargeback if needed
```

### 19.3 데이터 모델

```text
billing_account
commercial_contract
product_plan_version
price_version
subscription
entitlement_grant
usage_record
invoice
invoice_line
payment_attempt
payment_transaction
credit_note
refund
tax_document_reference
```

### 19.4 멱등성

결제 생성·환불·webhook 처리에는 멱등성 key를 사용한다. 공급자 webhook은 서명·timestamp·event ID를 검증하고 중복 적용하지 않는다.

### 19.5 조정

일 단위 자동 대조:

- 도락 invoice와 PG 결제
- 결제와 은행 정산
- 광고 provisional/final spend
- 예약 완료와 청구 usage
- 환불·chargeback
- 세금 문서 발행 상태

차이는 `billing_reconciliation_case`로 보낸다.

---

## 20. 환불·credit·분쟁

### 20.1 광고

- 무효 트래픽 확정
- 승인과 다른 creative/destination delivery
- 잘못된 지역·시간·placement
- 도락 장애로 인한 측정 오류
- duplicate billing

### 20.2 구독

- 중복 결제
- 약속한 entitlement 미제공
- 취소 효력일 오류
- 법정·계약상 환불 사유

### 20.3 예약

- 취소·노쇼 상태 분쟁
- imported 예약 중복
- 서비스 완료 인원 오류
- 지점 폐업·권한 이전

### 20.4 절차

```text
dispute opened
 -> evidence snapshot
 -> provisional hold if needed
 -> review
 -> accepted/partially accepted/rejected
 -> credit/refund
 -> notification and audit
```

영업 담당자 단독으로 credit 한도를 넘겨 승인하지 못한다. 금액·이해관계에 따른 이중 승인을 둔다.

---

## 21. 광고 정책과 검토

### 21.1 금지·제한 후보

- 폐업·사칭 지점
- 사실과 다른 가격·원산지·award·예약 가능 주장
- 소비자 위해 가능성이 있는 표현
- 경쟁점 비방·근거 없는 비교
- 리뷰 작성 대가를 숨긴 프로모션
- 도락 운영자·점수 시스템과 특별 관계가 있는 듯한 표현
- 타인의 상표·사진·리뷰 무단 사용
- 이용자를 속이는 countdown·재고·버튼

### 21.2 검토 결과

```text
approved
changes_required
rejected
suspended
expired
```

결과에는 정책 version, reason code, 검토자, 적용 범위, 이의 제기 경로가 있다.

### 21.3 자동·사람 검토

자동 검사:

- 금지 표현·URL·malware
- creative와 destination branch 불일치
- 만료된 offer
- 이미지 안전·권리 signal
- 가격·기간 필드 누락

고위험·경계 사례와 이의 제기는 사람이 검토한다. 자동 모델 점수만으로 법적 결론을 표현하지 않는다.

---

## 22. 법률·정책 기준

현재 기준으로 인터넷도 광고 방법에 포함되며, 거짓·과장, 기만, 부당 비교, 비방 광고 기준을 검토해야 한다. 경제적 이해관계가 추천·보증의 신뢰도에 영향을 줄 수 있다면 사용자가 쉽게 인식할 수 있게 공개하는 방향으로 설계한다.

제품 적용:

- 광고 label을 근접·명확하게 표시
- 무료 식사·할인·미래 성과 보상까지 disclosure 입력에서 다룸
- offer의 중요한 제한을 축소·은폐하지 않음
- 객관적 근거 없는 `1위`, `최고`, 비교 표현 금지
- creative revision과 근거 snapshot 보존
- 표시 문구·계약·운영 절차를 출시 전 법률 검토
- 법령·지침 변경을 분기별로 확인

참고:

- [표시·광고의 공정화에 관한 법률](https://law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=002011)
- [표시·광고의 공정화에 관한 법률 시행령](https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=005361)
- [공정거래위원회 추천·보증 등에 관한 표시·광고 심사지침 개정 안내](https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=6&key=20&nttSn=9048&pageIndex=3&pageUnit=10&searchCnd=all)
- [공정거래위원회 2024년 개정 보도자료](https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=3&key=12&nttSn=43669&pageIndex=25&pageUnit=10&searchCnd=all&searchCtgry=01%2C02)

---

## 23. 데이터 모델

### 23.1 광고

```text
advertiser_account
ad_campaign
ad_campaign_revision
ad_group
ad_target_rule
ad_creative
ad_creative_revision
ad_policy_review
ad_budget
ad_spend_reservation
ad_opportunity
ad_decision
ad_impression
ad_click
ad_conversion
ad_invalid_traffic_decision
ad_attribution
```

### 23.2 상거래

```text
commercial_contract
billing_account
product_plan_version
price_version
subscription
entitlement_grant
usage_record
invoice / invoice_line
payment_attempt / payment_transaction
credit_note / refund
billing_dispute
billing_reconciliation_case
```

### 23.3 공통 필드

- organization·branch scope
- immutable public/internal IDs
- status와 reason 분리
- policy·price·creative version
- `occurred_at`, `received_at`, `finalized_at`
- actor와 audit reference
- idempotency·source event ID
- 통화와 minor amount

---

## 24. API 경계

### 점주 광고

```text
POST   /v1/owner/ad-campaigns
GET    /v1/owner/ad-campaigns
GET    /v1/owner/ad-campaigns/{campaignId}
PATCH  /v1/owner/ad-campaigns/{campaignId}
POST   /v1/owner/ad-campaigns/{campaignId}:submit
POST   /v1/owner/ad-campaigns/{campaignId}:pause
POST   /v1/owner/ad-campaigns/{campaignId}:resume
GET    /v1/owner/ad-campaigns/{campaignId}/performance
```

### 구독·청구

```text
GET    /v1/owner/plans
POST   /v1/owner/subscriptions
GET    /v1/owner/subscriptions/current
POST   /v1/owner/subscriptions/{id}:change
POST   /v1/owner/subscriptions/{id}:cancel
GET    /v1/owner/invoices
GET    /v1/owner/invoices/{invoiceId}
POST   /v1/owner/billing-disputes
```

### 내부 delivery

```text
POST /internal/ad-opportunities
POST /internal/ad-decisions/{id}:rendered
POST /internal/ad-impressions
POST /internal/ad-clicks
POST /internal/ad-conversions
```

광고주 write는 organization role·branch authority·recent authentication·resource version을 검사한다. 공개 client가 청구 확정 API를 호출하지 않는다.

---

## 25. 이벤트

```text
AdCampaignSubmitted
AdCampaignApproved
AdCampaignRejected
AdCampaignActivated
AdCampaignPaused
AdCreativeSuspended
AdBudgetReserved
AdBudgetReleased
AdImpressionQualified
AdClickValidated
AdTrafficInvalidated
AdConversionAttributed
SubscriptionActivated
SubscriptionChanged
SubscriptionCancelled
EntitlementGranted
EntitlementRevoked
UsageFinalized
InvoiceFinalized
PaymentSucceeded
PaymentFailed
CreditIssued
RefundCompleted
BillingDisputeOpened
```

재무·delivery 이벤트는 schema version, idempotency, 원인 actor, correlation ID를 가진다. analytics event를 결제 원장으로 사용하지 않는다.

---

## 26. 역할과 승인

| 역할 | 허용 | 금지 |
| --- | --- | --- |
| 점주 campaign manager | draft·예산·성과 | billing owner 변경, 정책 승인 |
| 점주 billing | 결제수단·invoice·계약 | creative 정책 우회 |
| 광고 검토자 | creative·정책 판정 | 가격·청구 원장 수정 |
| 영업 | 제안·계약 workflow | 점수·리뷰·검토 결과 수정 |
| 재무 운영 | invoice·조정·refund workflow | 광고 content 승인 |
| trust 운영 | branch·content 제재 | 매출 목표에 따른 예외 |
| 엔지니어 | 시스템 운영 | 사유 없는 production 금액 변경 |

고액 refund, 수동 campaign override, advertiser suspension 해제, 계약 외 credit은 maker-checker와 감사 로그를 요구한다.

---

## 27. 분석 지표

### 27.1 사업

```text
MRR / ARR
gross and net revenue
active paying organizations/branches
trial conversion
logo and revenue churn
ARPA
reservation take rate
ad fill and eCPM/eCPC
contribution margin
```

### 27.2 광고주 가치

```text
valid CTR
qualified detail open rate
reservation start/completion
cost per valid action
budget utilization
time to approval
credit/refund rate
```

### 27.3 사용자·신뢰 가드레일

```text
ad hide/report rate
organic result engagement change
search reformulation/abandonment
ad density by surface
repeat advertiser exposure
mislabel or disclosure incidents
score/review policy exception correlation with spend
```

### 27.4 시장 건강

- 지역·장르별 광고주 집중도
- 신규·소규모 점주의 자격과 delivery 기회
- 상위 광고주 매출 의존도
- organic 지점 노출 분포 변화
- 광고 없는 세션 품질

---

## 28. 실험 원칙

- label 가시성을 낮추는 실험 금지
- 광고 density 실험은 검색 성공·이탈·신고를 가드레일로 사용
- 가격 실험은 계약·고지·공정성 검토
- advertiser별 숨은 차등보다 명시된 cohort·상품 기준
- shadow auction은 청구하지 않음
- holdout으로 organic과 장기 사용자 만족 영향 측정
- 실험 assignment가 invoice 근거와 모순되지 않게 version 기록
- stop condition과 사전 분석 계획

매출 상승만으로 실험을 성공 판정하지 않는다.

---

## 29. SLO와 기능 저하

### SLO 후보

- 캠페인 읽기·쓰기 API 가용성
- ad decision latency
- 예산 초과 방지 정확성
- billable event 중복률
- 청구·PG 일치율
- invoice 생성 기한
- pause·suspension 전파 시간
- 정책 위반 광고 제거 시간

### ad decision 장애

- fail closed: 광고 슬롯을 비우고 organic을 정상 제공
- stale campaign cache로 무리하게 과금하지 않음
- 광고 장애가 검색·예약을 막지 않음

### budget service 장애

- 새 spend reservation 중단
- 기존 reserve의 짧은 수명 만료
- overspend보다 underdelivery 선택

### 측정 장애

- 관측되지 않은 event를 추정 청구하지 않음
- raw safe event를 보존해 재처리
- advertiser dashboard에 지연 표시
- invoice finalization hold

### PG 장애

- 결제 결과 unknown을 실패로 덮어쓰지 않음
- webhook·조회 대조
- grace 내 entitlement 정책
- 중복 결제 방지

---

## 30. 운영 콘솔

### 광고 검토

- advertiser·branch·권한 상태
- creative revision과 destination snapshot
- offer 근거·유효기간
- 자동 signal과 이전 판정
- 정책 version·reason code
- 승인·수정 요청·거절·suspend

### delivery 조사

- campaign/ad group/creative 상태
- budget reserve와 spend timeline
- decision→impression→click→conversion lineage
- invalid traffic 판정과 version
- 사용자 식별정보를 가린 집계

### 청구 조사

- contract·price version
- invoice line→usage event
- PG transaction·정산
- credit·refund·dispute
- 모든 수동 조정의 승인·사유

운영 콘솔에서 공개 점수나 리뷰 판정을 광고 화면 옆에서 변경하지 못하게 한다.

---

## 31. 보안·개인정보

- billing과 광고 targeting 데이터를 일반 점주 데이터에서 권한 분리
- 결제수단은 토큰화된 공급자 참조 중심
- invoice·사업자·담당자 연락처 암호화와 field access audit
- creative upload는 [MEDIA_PIPELINE.md](./MEDIA_PIPELINE.md)의 격리·권리 검사 적용
- 광고 event의 IP·device는 무효 트래픽 목적 최소 범위·기간
- 점주 report는 threshold와 비식별 집계
- support export에 사용자 단위 event 기본 제외
- 로그·trace에 결제 token, 연락처, creative 원본 URL 금지
- 계약 종료·계정 종료·법적 보존을 구분

---

## 32. 테스트

### 불변식

- 광고 spend가 공개 점수 입력에 들어가지 않는다.
- 구독 해지로 claim·기본 정보 수정 권리가 사라지지 않는다.
- `sponsored` item에는 모든 client에서 광고 label이 있다.
- 광고 서비스 장애가 organic 응답을 실패시키지 않는다.
- 하나의 billable event는 한 invoice line에 한 번만 반영된다.
- 금액 정정은 원본을 덮어쓰지 않는다.

### campaign

- 권한 없는 branch 광고
- 폐업·분쟁 branch
- revision 중 active 승인본 유지
- pause/suspend propagation
- schedule timezone·DST
- budget boundary race

### delivery

- organic/sponsored 중복
- frequency cap
- viewport 이동
- stale branch status
- empty inventory
- auction tie·결정 재현
- shadow가 청구되지 않음

### 측정·fraud

- 중복 render/click
- offline replay
- clock skew
- self-click
- bot burst와 분산 저속 공격
- provisional→credit
- 이의 제기 재현

### billing

- price version 경계
- prorating
- webhook duplicate/out-of-order
- unknown payment state
- partial refund·chargeback
- invoice currency·rounding
- reconciliation 차이

### 접근성·표시

- 작은 화면·dark mode·200% 확대
- screen reader label
- 색 없이 광고 구분
- 한국어·다국어 offer 조건
- map pin과 legend

---

## 33. 구현 순서

### R0. 수익 헌장과 계측

- 무료·유료 경계 승인
- organic/광고 code·event 분리
- placement disclosure prototype
- contract·billing 기초 모델
- 법률·세무 검토 목록

### R1. 점주 구독

- plan/price version
- subscription·entitlement
- invoice·PG·reconciliation
- 해지·grace·refund
- 점주 billing 역할

### R2. 제한된 검색 광고 pilot

- claim된 소수 지점
- 고정 placement·단순 정액/CPC
- 수동 creative 검토
- 명확한 광고 label
- 보수적 budget reserve
- 유효 traffic와 credit

### R3. 예약 성과 과금

- completed cover 정의
- 계약·가격 version
- reservation reconciliation
- 점주 dispute
- 취소·노쇼 조정

### R4. 광고 자동화

- advertiser self-service
- policy automation
- pacing·auction
- 집계 성과 dashboard
- fraud 고도화

### R5. 추천·프로모션 확장

- home/recommendation placement
- coupon·offer inventory
- 다양성·frequency 고도화
- 장기 holdout과 시장 건강 감사

---

## 34. 출시 게이트

### 구독

- [ ] 무료 claim·기본 정보 권리가 보존된다.
- [ ] plan·price·계약 version이 고정된다.
- [ ] invoice와 PG 대조가 성공한다.
- [ ] 해지·환불·past-due UX가 검증된다.
- [ ] billing 역할과 step-up 인증이 적용된다.

### 광고

- [ ] organic과 광고 pipeline·event가 분리된다.
- [ ] 모든 surface의 `광고` 표시가 접근성 검수를 통과한다.
- [ ] branch·creative·offer 자격이 delivery 때 재검사된다.
- [ ] pause·suspend kill switch가 시험된다.
- [ ] budget race와 overspend 상한이 시험된다.
- [ ] 자기 클릭·bot·중복 event가 청구 제외된다.
- [ ] 광고주 report가 개인정보 threshold를 지킨다.
- [ ] 표시광고·추천보증 지침을 법률 검토한다.

### 예약 수수료

- [ ] billable 상태와 상태 정정 window가 계약에 일치한다.
- [ ] 테스트·직원·중복 예약이 제외된다.
- [ ] 취소·노쇼·인원 분쟁 절차가 있다.
- [ ] 청구 line에서 예약 근거를 재현할 수 있다.

---

## 35. 미결정 사항

- 첫 유료 상품이 점주 구독인지 예약 SaaS인지
- 구독을 organization·branch 중 어느 단위로 과금할지
- 첫 광고 상품을 정액·CPC·기간 sponsor 중 무엇으로 할지
- 광고 density와 frequency의 초기 상한
- qualified impression의 placement별 정확한 기준
- 예약 성과 수수료의 completed 상태와 정정 기간
- PG·세금계산서·정기결제 공급자
- 무료 체험과 grace 기간
- 집계 insight의 최소 cohort threshold
- 협찬 리뷰 허용 범위와 표시 문구
- 광고주 업종·지점 확인 수준
- map sponsored pin의 접근성 표현
- 매출·정책 독립성 감사의 주기와 담당 조직

---

## 36. 연관 문서

- [PRODUCT.md](../product/PRODUCT.md)
- [OWNER_PLATFORM.md](./OWNER_PLATFORM.md)
- [RATING_SYSTEM.md](./RATING_SYSTEM.md)
- [SEARCH_SYSTEM.md](./SEARCH_SYSTEM.md)
- [RECOMMENDATION_SYSTEM.md](./RECOMMENDATION_SYSTEM.md)
- [RESERVATION_SYSTEM.md](./RESERVATION_SYSTEM.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [AUTH_IDENTITY.md](../architecture/AUTH_IDENTITY.md)
- [MEDIA_PIPELINE.md](./MEDIA_PIPELINE.md)
- [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
