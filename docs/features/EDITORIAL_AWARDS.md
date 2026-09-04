# 도락 편집·큐레이션·어워드 설계

| 항목 | 내용 |
| --- | --- |
| 문서 상태 | Draft |
| 문서 버전 | 0.1.0 |
| 기준 제품 | [PRODUCT.md](../product/PRODUCT.md) |
| 주요 독자 | 제품, editorial, 평점, 데이터, trust, 광고, 법무, 점주, 디자인 |
| 핵심 원칙 | 선정, 공개 점수, 인기, 광고를 서로 다른 판단으로 보여준다 |

## 1. 목적

도락의 편집·큐레이션·어워드는 사용자가 `지금 어디를 갈지`부터 `한국의 중요한 식당이 어디인지`까지 더 풍부하게 탐색하도록 돕는다. 그러나 선정 badge는 음식점의 매출과 평판에 큰 영향을 줄 수 있으므로 단순 콘텐츠 기능보다 높은 독립성과 감사 가능성이 필요하다.

이 문서는 다음을 정의한다.

- 알고리즘 점수, 인기, 편집 추천, 연간 어워드, 광고의 차이
- 어떤 선정을 언제 시작하고 무엇을 근거로 하는가
- 지역·장르·가격대·신규점의 기회를 어떻게 다루는가
- 편집자·평가자·광고주·점주의 이해충돌을 어떻게 통제하는가
- 선정 snapshot을 어떻게 재현하고 정정·보류·회수하는가
- 사용자가 badge의 의미와 한계를 어떻게 이해하는가
- 점주가 선정 mark를 어떤 범위에서 사용할 수 있는가

어워드는 초기 데이터 부족을 가리는 마케팅 수단이 아니다. coverage, 점수 안정성, 운영 독립성이 gate를 통과한 뒤에만 시작한다.

---

## 2. 비목표

- 돈을 내면 받을 수 있는 award
- 공개 점수 순위를 그대로 복사한 badge
- 모든 지역·장르에 억지로 같은 수의 수상점 배정
- 한 번 선정되면 영구적으로 `검증된 맛집`이라 보증
- 광고 creative와 editorial recommendation을 혼합
- 개인 편집자의 비공개 취향만으로 전국 순위를 확정
- 점주의 서비스·협찬 제공을 숨긴 평가
- 아직 데이터가 적은 지점을 낮은 품질로 단정
- 법적·안전성 판단을 `맛` 선정 기준으로 대체
- 선정 결과를 근거로 부정 리뷰를 약화하거나 삭제

---

## 3. 용어와 제품 표면

### 3.1 공개 점수

도락의 평점 모델이 방문·리뷰·전문성·불확실성을 반영해 산출한 동일한 공개 값이다. 돈이나 editorial 선택에 따라 변하지 않는다.

### 3.2 랭킹

특정 지역·장르·조건과 기준 시점에서 공개 점수·신뢰도·eligibility를 사용한 정렬이다. 개인화되지 않은 공통 결과다.

### 3.3 인기

조회·저장·길찾기·예약 등 관심 행동을 집계한 별도 지표다. 품질·점수와 동일하지 않으며 광고 traffic을 분리한다.

### 3.4 개인 추천

사용자 취향·문맥과 지점 특성의 관련성이다. 공개 점수는 모두에게 같고 후보·순서만 개인화된다.

### 3.5 편집 큐레이션

설명 가능한 주제와 기간을 가진 사람이 검토한 목록이다. 예: `늦은 밤 혼자 먹기 좋은 서울의 국밥`, `비 오는 날 찾고 싶은 칼국수`.

### 3.6 어워드

공개된 선정 기간·대상·방법·독립성 기준을 통과한 공식 선정이다. 편집 목록보다 더 높은 검토·snapshot·브랜드 사용 통제가 필요하다.

### 3.7 광고

경제적 대가로 확보한 sponsored placement다. `광고`로 표시하고 편집 선정·공개 점수와 분리한다.

---

## 4. 선정 taxonomy

초기 후보 체계:

| 유형 | 목적 | 주기 | 입력 | badge |
| --- | --- | --- | --- | --- |
| 설명형 리스트 | 상황·주제 탐색 | 수시·기간형 | 편집 research | 약한 label |
| 지금 주목할 곳 | 신규·변화 발견 | 월·분기 | 데이터+편집 | 기간 label |
| 지역·장르 셀렉트 | 검증된 범주 추천 | 반기·연간 | eligibility+편집 | 중간 badge |
| 도락 어워드 | 연간 대표 선정 | 연간 | 고정 snapshot+독립 심사 | 공식 mark |
| 레거시 기록 | 역사·문화적 의미 | 비정기 | 별도 research | editorial label |

정확한 공개 이름은 브랜드·상표·사용자 조사 후 확정한다. 내부 enum은 마케팅 이름 변경과 분리한다.

---

## 5. 원칙

### AWD-P01. 광고와 선정의 완전 분리

광고 구매, 구독 tier, 예약 계약, 점주 매출 기여는 후보·심사·수상·유지에 영향을 주지 않는다.

### AWD-P02. 점수와 선정의 구분

공개 점수는 입력 후보 중 하나일 수 있지만 어워드가 점수 자체를 바꾸지 않는다. 수상 badge를 점수 옆에 배치할 때도 동일 척도처럼 보이지 않게 한다.

### AWD-P03. 기준 시점 고정

선정은 종료되지 않는 live 데이터가 아니라 명시된 cutoff와 version snapshot을 사용한다. 발표 후 결과를 몰래 바꾸지 않는다.

### AWD-P04. 적은 데이터는 낮은 품질이 아니다

최소 evidence가 부족하면 `미선정`이지 `낮은 평가`가 아니다. 신규·지역 coverage가 낮은 식당에 별도 발견 경로를 제공한다.

### AWD-P05. 설명 가능한 선정

사용자가 선정의 주제, 기간, 기본 자격, 편집 관점을 이해할 수 있어야 한다. 영업 비밀·부정행위 방어를 해치지 않는 범위에서 공개한다.

### AWD-P06. 이해충돌 사전 통제

나중에 disclosure만 붙이는 것으로 충분하지 않다. 심사 배제, gift 거절, 역할 분리, audit를 적용한다.

### AWD-P07. 정정과 회수 가능

폐업, 안전 위험, 사칭, 데이터 오류, 이해충돌, 선정 절차 위반이 발견되면 정정·보류·회수할 수 있다. 역사 기록과 현재 사용 가능성을 구분한다.

### AWD-P08. 평가가 운영 정책을 우회하지 않는다

수상점도 리뷰·사진·광고·예약·점주 정책을 동일하게 적용받는다.

---

## 6. 시작 gate

연간 어워드는 다음이 충족되기 전 출시하지 않는다.

### 데이터

- 대상 지역·장르의 branch coverage가 측정됨
- 폐업·이전·중복 error rate가 허용 수준
- 리뷰·방문 인증 분포가 특정 acquisition source에 과도하게 치우치지 않음
- 점수 model version이 충분한 기간 안정
- 후보 선정 snapshot을 재현 가능

### 신뢰

- 리뷰 조작·점주 이해관계 탐지와 appeal 운영
- 점수와 게시 eligibility 분리
- 광고·구독 데이터 차단 test
- 이해충돌 registry와 gift policy
- 외부 압력·법적 요청 escalation

### 운영

- independent editorial owner
- 최소 2인 검토와 maker-checker
- 정정·회수·공지 runbook
- 발표 embargo와 access 통제
- 점주 mark license·침해 대응

### 사용자

- 점수·인기·선정·광고의 label 이해도 조사
- badge가 공식 정부 인증처럼 오인되지 않음
- 선정 방법 페이지와 접근성
- 미선정 점주에게 `낮은 점수`로 오인되지 않는 문구

---

## 7. 선정 단위

### 7.1 지점 기준

기본 선정 대상은 `branch`다. 같은 브랜드라도 지점별 팀·메뉴·서비스·운영이 다를 수 있다.

### 7.2 restaurant·brand

역사·브랜드 영향력을 다루는 별도 editorial은 가능하지만 지점 award와 혼동하지 않는다. franchise 전체가 한 지점 수상을 승격 사용하지 못한다.

### 7.3 이전

- 동일 정체성의 단순 위치 이전
- 새로운 owner·chef·concept의 재개업
- 기존 branch 폐업과 새 branch

관계에 따라 수상 이력을 옮길지 새 대상으로 볼지 편집·원장 기준을 함께 적용한다. 자동 승계하지 않는다.

### 7.4 복합 공간

호텔 restaurant, food hall stall, department branch처럼 운영 단위를 정확히 식별한다. 건물 전체가 개별 restaurant 수상을 사용하지 못한다.

---

## 8. eligibility

### 8.1 기본

선정 종류별로 다음을 versioning한다.

```text
geographic scope
category scope
operating status
minimum operating period
minimum evidence/review threshold
minimum confidence
integrity eligibility
policy status
cutoff time
```

### 8.2 제외 후보

- cutoff 시점 폐업·장기 미확인
- 지점 정체성 중대한 분쟁
- 심각한 조작 조사 중
- 중대한 안전·사칭·권리 위험으로 공개 제한
- 데이터 오류로 score·entity가 신뢰 불가
- 심사자 이해충돌을 해소할 수 없음

제외는 영구 제재가 아니다. reason, 적용 기간, 재검토를 둔다.

### 8.3 조사 중

발표 전에 해결되지 않은 중대한 integrity case는 `on_hold`로 둔다. 조사를 서둘러 임의 결론내리거나 수상 후 숨기지 않는다.

### 8.4 예약·광고 여부

도락 예약을 받지 않거나 광고를 구매하지 않아도 동일 자격이다. point owner claim이 없어도 원장 신뢰도가 충분하면 후보가 될 수 있다.

---

## 9. 후보 생성

한 ranking 하나로 후보를 만들지 않는다.

```text
stable high-score candidates
high-confidence category leaders
expert-reviewer agreement
repeat-visit strength
new and rising candidates
undercovered region/category discovery
editorial research nominations
user/merchant suggestions, non-voting
```

### 9.1 데이터 후보

- rating snapshot과 불확실성
- eligible review 수·분포
- 반복 방문·기간 안정성
- reviewer expertise의 다양성
- 비정상 campaign 제거 후 관심
- 최근 급변·drift

### 9.2 편집 후보

- 음식 문화적 맥락
- 특정 요리의 대표성·독창성
- 일관성
- 재료·조리·서비스의 실제 경험
- 지역성
- 접근성·가격을 포함한 주제 적합성

### 9.3 nomination

사용자·점주·편집자가 후보를 제안할 수 있으나 nomination 수는 표가 아니다. paid nomination·submission fee를 받지 않는다.

### 9.4 longlist 편향 점검

- 특정 지역·가격대·요리 독점
- 도락 초기 seed reviewer의 취향
- 예약 가능한 지점 편향
- 점주 claim 완료 지점 편향
- 광고주 편향
- 언어·관광지 편향
- 신규점 배제

편향 발견은 무조건 quota로 바꾸는 것이 아니라 coverage·후보 source·기준 적합성을 조사하는 trigger다.

---

## 10. 평가 framework

### 10.1 dimension 후보

```text
food/craft
consistency
distinctiveness
hospitality/service where relevant
value in context
place/occasion fit
cultural or regional significance
evidence confidence
```

모든 award에서 같은 가중치를 쓰지 않는다. `혼밥`, `파인다이닝`, `지역 향토음식`의 목적이 다르다.

### 10.2 구조화 rubric

각 dimension에:

- 정의
- 관찰 가능한 근거
- 포함·제외 예시
- 점수 또는 ordinal scale
- `not observed` 허용
- reviewer confidence
- conflict flag

를 둔다.

### 10.3 점수 합산의 한계

rubric total을 수학적으로 정렬해 자동 수상시키지 않는다. 합산은 discussion aid이며 선정 결과는 기준·근거·불확실성을 기록한 editorial decision이다.

### 10.4 서비스·분위기

음식 품질과 accessibility, hospitality, 분위기를 섞어 특정 운영 형식을 보편적 우수성으로 만들지 않는다. 선정 주제에 관련된 정도를 명시한다.

### 10.5 가격

비싼 곳이 더 높은 기준이라는 전제를 두지 않는다. `value`는 가격대·목적·지역 문맥에서 해석하며 가격 정확도와 시점을 기록한다.

---

## 11. 현장 평가

현장 평가를 도입하는 award에만 적용한다.

### 11.1 방문 방식

- 일반 사용자와 유사한 예약·결제
- 가능한 경우 익명 방문
- 동일인 반복만으로 확정하지 않음
- 평가 기간·횟수 기준
- 동행자와 비용 정책
- receipt·방문 증빙의 제한 보관

### 11.2 비용

평가자는 원칙적으로 도락 budget으로 정상 가격을 지불한다. 점주 무상 제공·할인·특별 대우가 발생하면 기록하고 해당 visit의 사용 여부를 검토한다.

### 11.3 공개 신분

익명성이 불가능하거나 편집 취재가 필요한 경우 목적을 분리한다. 공식 취재 경험을 일반 손님 경험처럼 사용하지 않는다.

### 11.4 기록

- 방문 date/time slot
- 지점 identity
- 주문 범주, 개인정보 최소화
- 비용과 제공 관계
- 관찰 note
- rubric
- media rights
- reviewer conflict attestation

평가 note는 공개 리뷰와 다르며 개인 직원에 대한 불필요한 신상 기록을 피한다.

---

## 12. 평가자 구성

### 12.1 역할

```text
program owner
research editor
data analyst
field evaluator
category advisor
trust reviewer
independent decision panel
legal/brand observer when needed
```

### 12.2 자격

- category·지역 지식
- rubric calibration
- 이해충돌 교육
- 차별·접근성·개인정보 교육
- 기록 품질
- 보안·embargo 준수

follower 수나 유명세만으로 심사 권한을 주지 않는다.

### 12.3 panel

- 최소 quorum
- 서로 다른 역할·관점
- 후보와 conflict가 있는 사람 배제
- 광고·영업 담당자의 투표권 금지
- tie·abstain·minority note 정책
- final approver와 운영 검수 분리

### 12.4 calibration

공통 sample과 과거 사례를 사용해 기준 해석 차이를 점검한다. 평가자별 유난히 높거나 낮은 score를 자동 보정해 개성을 지우기보다 discussion과 training에 사용한다.

---

## 13. 이해충돌

### 13.1 신고 대상

- 현재·과거 고용·소유·투자
- 가족·친밀 관계
- 광고·컨설팅·콘텐츠 계약
- 무상 식사·선물·여행
- 점주·chef와 지속적 개인 관계
- 경쟁 음식점 이해관계
- 공개적 캠페인·분쟁
- 투자 portfolio·agency 관계

### 13.2 수준

```text
no_conflict
disclosed_observer_only
recusal_required
candidate_excluded_if_unresolvable
investigation_required
```

### 13.3 gift policy

- 소액도 기록 기준
- 식사·행사 초대·travel
- 반송·기부·비용 상환
- 평가 기간 cooling
- editorial과 영업의 별도 contact

### 13.4 사후 발견

선정 후 숨은 이해충돌이 드러나면 영향 분석, 재심, 정정 또는 회수, 공개 설명을 수행한다. 개인 징계와 선정 유효성 판단을 분리한다.

---

## 14. 광고·영업 방화벽

```text
sales/ads data
     -X-> candidate eligibility
     -X-> reviewer assignment
     -X-> final decision

editorial shortlist
     -X-> sales prospecting before publication
```

통제:

- 별도 IAM role·workspace
- 광고주 여부가 숨겨진 candidate packet 후보
- 매출·계약 field를 선정 dataset에서 제외
- shortlist access logging
- 광고·영업의 선정 결과 문의는 표준 channel
- 결과와 광고 bundle 판매 금지
- 수상 이후 `수상점 전용 광고`를 팔더라도 수상 자체와 계약 분리·명확 표시
- 독립성 위반 whistleblowing

---

## 15. 데이터 snapshot

### 15.1 포함

```text
award program/version
eligibility policy version
rating model/version
rating cutoff and snapshot ids
branch/entity versions
review eligibility snapshot
integrity exclusions
candidate source/provenance
rubric version
reviewer assignments/conflict state
decision record
```

### 15.2 재현

발표 후 live score가 바뀌어도 당시 후보·판정을 재현할 수 있어야 한다. 사용자의 삭제·법적 권리로 원문이 제거된 경우 최소한의 비식별 decision lineage만 법적·정책 범위에서 유지한다.

### 15.3 접근

- shortlist는 embargo 정보
- 사용자 리뷰 원문은 필요한 범위
- 방문 증빙·점주 증빙은 editorial에서 원칙적 비접근
- integrity 세부 signal은 최소 공유
- 결과 export watermark·audit

### 15.4 freeze

cutoff 뒤 데이터 수정이 중대한 원장 오류를 고친 경우:

1. 변경 사유 확인
2. 영향 후보 식별
3. freeze exception 승인
4. snapshot 새 revision
5. 모든 affected 결정 재검토
6. audit note

---

## 16. 결정 상태

### candidate

```text
identified
eligible
in_review
additional_evidence_needed
on_hold
not_selected
selected_provisional
selected_final
```

### award publication

```text
draft
approved
embargoed
published
corrected
suspended
withdrawn
archived
```

### 의미

- `not_selected`: 공개 제재·낮은 품질 label이 아님
- `on_hold`: 해결되지 않은 integrity·identity·evidence 이슈
- `suspended`: 현재 mark 사용을 일시 중단, 조사 중
- `withdrawn`: 해당 연도 선정 효력이 철회됨
- `archived`: 역사 record이며 현재 수상 claim이 아님

---

## 17. 최종 결정

### 17.1 packet

panel에 제공:

- 지점 identity와 변경 이력
- eligibility 결과
- data snapshot 요약과 불확실성
- 편집 research·현장 평가
- diversity/coverage context
- conflict·policy clearance
- 이전 선정·중대한 변화

광고 spend·구독·영업 관계는 제공하지 않는다. 불가피한 conflict 정보는 투표 배제를 위해 별도 관리자만 처리한다.

### 17.2 기록

```text
decision
award/tier
reason codes
editorial rationale
evidence references
votes/abstentions under internal policy
conditions
approved_by
decided_at
policy version
```

### 17.3 수 제한

미리 정한 마케팅 숫자를 채우기 위해 기준 미달 후보를 선정하지 않는다. 반대로 불필요하게 희소성을 과장해 arbitrary cutoff를 만들지 않는다. award별 최대·최소 정책과 이유를 공개 가능한 수준으로 정한다.

### 17.4 동점

숫자 하나의 동점을 억지로 깨기보다 공동 선정, tier, 추가 evidence, 미선정 중 어떤 정책인지 사전 정의한다.

---

## 18. 공정성과 coverage

### 18.1 감사 dimension

- 지역·도시 규모
- 장르·식문화
- 가격대
- 개업 연차
- 독립점·chain
- 예약 가능 여부
- 점주 claim 여부
- 관광지·생활권
- reviewer·source coverage

민감한 owner 개인 특성을 추론해 quota를 운영하지 않는다.

### 18.2 coverage floor

coverage가 낮은 지역에서 전국 award를 무리하게 발표하지 않는다.

선택지:

- 해당 지역 선정 보류
- `데이터 수집 중` 명시
- 별도 discovery editorial
- 지역 전문가 research 확대
- 다음 주기로 이월

### 18.3 신규점

연간 최고 선정은 최소 운영 기간을 요구할 수 있다. 대신 신규·변화 발견 목록은 별도 목적으로 운용하고 영구 품질 award처럼 표시하지 않는다.

### 18.4 chain

chain을 자동 배제·우대하지 않는다. 지점별 경험과 선정 주제를 적용한다. 여러 지점이 선정되어도 franchise 전체 광고 문구로 확대하지 못한다.

---

## 19. 사용자 공개

### 19.1 선정 페이지

반드시 제공:

```text
선정 이름·연도·기간
선정 목적
대상 지역·장르
기준 시점
선정 방법 요약
광고와 독립성
현재 영업·정보 갱신일
정정·신고 경로
```

### 19.2 지점 badge

- 연도 포함
- award/tier 명확
- 광고·예약 badge와 다른 형태
- 공개 점수와 다른 위치·설명
- 누르면 방법 페이지
- screen reader accessible name
- 만료·withdrawn이면 현재 badge 제거

### 19.3 문구

허용 후보:

```text
2027 도락 어워드 선정
도락 편집팀이 2027년 기준으로 선정
```

피해야 할 후보:

```text
도락이 보증한 안전한 식당
한국 공식 1위
실패 없는 맛집
평생 인증
```

### 19.4 미선정

음식점 상세에 `수상 실패`를 표시하지 않는다. 후보 여부도 기본 비공개다. 점주에게 유료 개선 consulting을 연계하지 않는다.

---

## 20. 발표와 embargo

### 20.1 순서

```text
final approval
 -> legal/trust clearance
 -> branch identity recheck
 -> assets generated
 -> owner notice, if policy allows
 -> embargo window
 -> atomic publish
 -> search/cache/index propagation
 -> public method and corrections channel
```

### 20.2 점주 사전 통지

mark asset·상호 확인을 위한 짧은 통지는 가능하나 결과 변경 협상 기회가 아니다. 점주가 발표 전 광고를 구매하거나 press를 유출해도 선정 결과를 판매 관계로 바꾸지 않는다.

### 20.3 보안

- least privilege
- export 제한·watermark
- publish token·2인 승인
- scheduled job 재실행 멱등성
- CDN/search embargo leak test
- 내부 preview robots/noindex
- 유출 incident 대응

### 20.4 동시 공개

일부 점주·광고주에게 먼저 badge를 노출하지 않는다. locale·앱·웹·검색의 시간 차를 최소화하고 문제가 생기면 전체 publish를 중단할 kill switch를 둔다.

---

## 21. 정정·보류·회수

### 21.1 정정

- 지점명·주소·사진 오류
- category·지역 표기
- 선정 방법 설명 오류
- 누락·잘못 연결된 branch

결과 본질이 변하지 않는 정정도 revision·시각·사유를 남긴다.

### 21.2 보류

- 안전·법적·조작 조사
- 지점 identity conflict
- 중대한 선정 절차 의심
- 폐업 여부 불명

보류 중 현재 badge·mark 사용 범위를 정하고 과도한 유죄 암시를 피한다.

### 21.3 회수

후보:

- snapshot 데이터 중대한 오류로 eligibility 불충족
- 조작·사칭이 선정에 실질 영향
- 심사 이해충돌 은폐
- 지점이 실제 대상과 다름
- 선정 절차의 중대한 위반

일반적인 낮은 리뷰 몇 건이나 점수의 자연 변동만으로 과거 선정 기록을 지우지 않는다.

### 21.4 폐업

과거 수상 이력은 역사 record로 남길 수 있지만 현재 badge·검색 필터에서 active award처럼 표시하지 않는다. 폐업 상태와 수상 당시 기간을 함께 보여준다.

### 21.5 공지

- 무엇이 바뀌었는지
- 언제부터인지
- 이전 발표에 미치는 영향
- 점주 mark 사용 상태
- 필요한 사용자 조치
- 문의·appeal

법적·개인정보상 공개할 수 없는 조사 세부는 안전한 범주로 설명한다.

---

## 22. 이의 제기

### 대상

- 잘못된 지점 identity
- eligibility 사실 오류
- 이해충돌·절차 위반
- badge·mark 오사용 판정
- 정정·회수

`선정되지 않아 기분이 나쁨`을 panel 재투표 사유로 만들지 않는다. 사실·절차 오류와 편집 판단 불일치를 구분한다.

### 흐름

```text
appeal submitted
 -> standing/scope check
 -> evidence freeze
 -> independent reviewer
 -> correction/reconsideration/upheld
 -> notice
 -> final escalation under policy
```

원 결정자 단독으로 자신의 결정을 재검토하지 않는다. advertiser·구독 고객에게 더 빠른 판정 결과를 판매하지 않는다.

---

## 23. 점주 mark 사용

### 23.1 license

```text
award program/year/tier
licensed organization and branch
asset versions
allowed media/territory/language
start/end
required wording
prohibited alteration
suspension/termination
approval if needed
```

### 23.2 허용 후보

- 해당 지점의 웹사이트·매장·메뉴
- 정확한 연도·award 이름
- 제공된 asset과 brand guide
- 실제 선정 지점만

### 23.3 금지 후보

- 다른 지점·브랜드 전체로 확대
- 별 개수·점수처럼 변형
- `도락 공식 인증`, 정부 인증으로 오인
- 연도 제거
- withdrawn·expired mark 사용
- 경쟁점 비교·비방
- 도락과 partnership·투자 관계 암시

### 23.4 monitoring

- 점주 self-report와 자동 web signal
- 사용자 신고
- 경고·수정 기한
- 심각·반복 오사용의 license 종료
- 광고 creative에도 동일 검수

상표권과 mark license의 구체 조건은 법률 검토한다.

---

## 24. 편집 리스트

어워드보다 가벼운 큐레이션도 provenance가 필요하다.

### list 유형

```text
evergreen guide
seasonal guide
occasion guide
neighborhood walk
dish deep-dive
new opening watch
historical/editorial feature
sponsored editorial, explicitly labeled
```

### list metadata

- title·dek·locale
- editorial owner
- theme·inclusion criteria
- source·research cutoff
- branch item rationale
- sort policy
- sponsor 관계
- published·updated·expires
- stale branch handling

### 순서

목록 순서가 rank인지 단순 동선·가나다·editorial narrative인지 명시한다. 광고를 중간에 합성하면 별도 광고 card·label과 analytics를 사용한다.

### freshness

영업시간·가격·폐업·메뉴 변경을 감시하고 일정 기간 검증되지 않으면 stale 표시·재검토한다. 시즌 목록은 자동 만료한다.

---

## 25. 데이터 모델

### `editorial_program`

```text
id
program_type
public/internal name
year/period
scope
methodology version
status
cutoff/publish/archive dates
owner
```

### `editorial_eligibility_policy`

```text
program id/version
geo/category scope
minimum evidence/operating period
allowed/excluded statuses
integrity policy
effective time
approved by
```

### `award_candidate`

```text
program/branch
candidate source
snapshot ids
eligibility result/reasons
review status
hold reason
version
```

### `editorial_evaluation`

```text
candidate
evaluator token
rubric version
dimension observations
confidence
evidence refs
conflict attestation
submitted/revised
```

### `editorial_conflict_record`

```text
program/evaluator/candidate or organization
conflict type
disclosure
resolution/recusal
reviewer
valid period
```

### `award_decision`

```text
candidate
decision/tier
reason codes/rationale
panel/quorum
conditions
approved at/by
decision version
```

### `award_publication`

```text
program/branch/decision
public title/rationale
locale versions
publication status
published/corrected/suspended/withdrawn
public revision
```

### `award_mark_license`

```text
publication
organization/branch
asset version
scope
valid period
status/reason
```

### `editorial_correction`, `award_appeal`

원 결과를 덮어쓰지 않고 정정·이의·재심의 연결된 이력을 보존한다.

---

## 26. API

### 공개

```text
GET /v1/editorial-programs
GET /v1/editorial-programs/{programId}
GET /v1/editorial-programs/{programId}/selections
GET /v1/branches/{branchId}/awards
GET /v1/editorial-lists/{listId}
POST /v1/editorial-corrections
```

### 점주

```text
GET  /v1/owner/branches/{branchId}/award-marks
POST /v1/owner/award-mark-issues
POST /v1/owner/editorial-appeals
```

### 내부

```text
POST /internal/editorial-programs
POST /internal/editorial-programs/{id}:freeze
POST /internal/editorial-programs/{id}/candidates
POST /internal/editorial-candidates/{id}/evaluations
POST /internal/editorial-candidates/{id}:decide
POST /internal/editorial-programs/{id}:approve-publication
POST /internal/editorial-programs/{id}:publish
POST /internal/award-publications/{id}:suspend
POST /internal/award-publications/{id}:withdraw
```

final decision, publish, suspend·withdraw에는 권한·recent auth·사유·resource version·2인 승인을 적용한다.

---

## 27. 이벤트

```text
EditorialProgramCreated
EditorialProgramFrozen
AwardCandidateIdentified
AwardCandidateEligibilityEvaluated
EditorialConflictDeclared
EditorialEvaluationSubmitted
AwardCandidatePlacedOnHold
AwardDecisionRecorded
AwardPublicationApproved
AwardPublished
AwardCorrected
AwardSuspended
AwardWithdrawn
AwardAppealSubmitted
AwardAppealResolved
AwardMarkLicenseGranted
AwardMarkLicenseSuspended
```

공개 이벤트와 embargo 내부 이벤트를 topic·권한에서 분리한다. analytics warehouse가 publish 전에 결과를 노출하지 않게 한다.

---

## 28. 검색·추천·평점 연동

### 평점

- award가 score 계산 입력이 아님
- award page에는 현재 score를 별도 표시 가능
- 과거 선정 당시 score를 live score로 오인하지 않게 함
- score 변화로 award를 자동 회수하지 않음

### 검색

- `award:2027` 같은 명시 filter 후보
- active와 historical 구분
- award filter 내부 정렬이 반드시 award rank는 아님
- award 자체가 일반 검색 relevance에 주는 boost는 제품·공정성 검토
- sponsored item은 별도

### 추천

- award는 safe candidate feature가 될 수 있음
- 사용자가 같은 수상점만 반복 보지 않게 다양성
- 개인화 이유에 정확한 연도·program
- award popularity가 작은 지점을 영구 배제하지 않게 exploration

### 데이터 변경

publication 변경은 outbox를 통해 search, cache, recommendation feature, owner portal, CDN asset에 전파한다.

---

## 29. 접근성·국제화

- badge 색만으로 tier·상태 구분 금지
- screen reader에 program·year·selection 상태
- mark image 대체 텍스트
- 방법론 표의 keyboard·mobile 지원
- 긴 rationale과 쉬운 요약
- locale별 공식 프로그램명과 원문
- 음식점 한국 이름을 외국어 화면에서 보조 표시
- 기계 번역된 rationale에는 label·원문
- award mark의 언어 variant도 동일 의미
- RTL·확대·dark mode 시험

번역된 선정 설명이 원래 평가보다 강한 `best`, `certified` 의미로 바뀌지 않게 editorial translation review를 거친다.

---

## 30. 분석

### 사용자 가치

```text
methodology page comprehension
award list -> branch detail
save/direction/reservation
new-region/category exploration
repeat visit intent
badge meaning survey
correction report quality
```

### 독립성·공정성

```text
selected vs advertiser/subscriber correlation, controlled audit
claim/booking availability selection share
region/category/price coverage
reviewer conflict/recusal rate
selection reversal/correction
pre-publication access anomalies
mark misuse
```

### 생태계 위험

- 수상 직후 리뷰 조작·campaign 증가
- 수상점 가격·예약 정책 급변
- 과도한 traffic 집중
- 인근 음식점의 review bombing
- 점주가 award를 이용해 false scarcity 생성
- 수상점 직원·개인의 괴롭힘

상관관계를 정책 위반의 증거로 자동 판단하지 않는다.

---

## 31. 관측성과 경보

- shortlist 접근·export
- freeze 뒤 snapshot 변경
- conflict 미제출 evaluator
- quorum·approval 부족
- publish 대상·asset 수 불일치
- embargo URL 접근·indexing
- search/CDN/app publish divergence
- suspended award가 active로 노출
- mark license 만료 후 사용
- 광고주 상태 field가 candidate dataset에 들어온 schema change

critical alert:

- 승인되지 않은 조기 publish
- 잘못된 program/year 전체 공개
- 광고 spend가 candidate feature에 유입
- withdrawn award가 대량 재노출
- shortlist 개인정보 export

---

## 32. 테스트

### eligibility

- cutoff 전후 review·폐업
- 이전·재개업·중복 branch
- under-investigation
- 신규점 minimum period
- claim·예약·광고 여부 무관
- region/category boundary

### 독립성

- 광고·구독 field schema 접근 차단
- 영업 role shortlist 접근 거절
- paid advertiser와 비광고주 동일 rule
- 수상 이후 광고 계약이 decision을 수정하지 않음
- 점수 model과 award write 경로 분리

### 결정

- quorum 부족
- evaluator conflict recusal
- duplicate vote
- stale rubric
- snapshot revision
- tie·abstain
- maker-checker

### 발표

- scheduled job 중복
- 일부 locale asset 실패
- CDN/search propagation 지연
- app old version
- embargo leak
- rollback·kill switch

### lifecycle

- branch 폐업·이전
- correction
- suspend·withdraw
- appeal 결과
- mark license 만료
- historical archive

### UI

- 점수·광고·award badge 오인 test
- screen reader·200% 확대
- dark mode
- 긴 program name
- offline/stale cache
- 외국어 rationale

---

## 33. 운영 runbook

### 잘못된 지점 발표

1. publication suspend
2. 검색·cache·mark 중지
3. branch identity·snapshot 확인
4. 영향 점주·사용자 통지
5. 올바른 decision·asset 재승인
6. correction 공개
7. 원인·재발 방지

### embargo 유출

1. 접근·범위·유출자 조사
2. link·credential revoke
3. 법무·보안·program owner
4. 공정성 영향 판단
5. 발표 시점 변경 또는 전체 공개
6. 광고·거래 이상 모니터링

### 이해충돌 발견

1. evaluator·candidate 영향 범위
2. 관련 평가 격리
3. 독립 panel 재검토
4. 결과 유지·정정·회수
5. 공개·내부 통지
6. 권한·정책 개선

### 광고 영향 의심

1. sales·campaign·decision audit 보존
2. 역할 접근 중지
3. 독립 조사
4. affected program hold
5. 결과·계약 분리 remediation
6. 신뢰 보고

---

## 34. 구현 순서

### E0. 편집 리스트 기반

- list taxonomy·provenance
- sponsor 표시
- freshness·branch 상태 sync
- 편집 role·workflow
- 정정 channel

### E1. 데이터 기반 발견

- candidate source 다양화
- coverage dashboard
- snapshot prototype
- 공개 점수·인기·광고 label user test

### E2. 제한된 지역·장르 셀렉트

- eligibility policy
- rubric·panel·conflict registry
- 소규모 pilot, 공식 mark 없음 또는 제한
- 정정·appeal rehearsal

### E3. 공식 연간 어워드

- 독립성 감사
- 현장 평가, 사용하는 경우
- embargo·atomic publish
- owner mark license
- 법률·상표 검토

### E4. 확장

- 지역·장르 coverage 확대
- 다국어
- historical archive
- 외부 advisor governance
- 연간 독립성 report

---

## 35. 출시 체크리스트

### governance

- [ ] 선정 program·방법·cutoff·scope가 versioning된다.
- [ ] 광고·영업·구독 데이터가 후보 dataset에서 차단된다.
- [ ] panel quorum·recusal·2인 승인이 동작한다.
- [ ] gift·conflict policy 교육과 attestation이 완료된다.
- [ ] 법무·brand·trust review owner가 지정된다.

### 데이터

- [ ] 지역·장르 coverage와 제외 편향이 측정된다.
- [ ] 후보·score·branch·policy snapshot을 재현할 수 있다.
- [ ] branch 이전·폐업·중복 회귀가 통과한다.
- [ ] 낮은 evidence가 낮은 품질로 표시되지 않는다.
- [ ] user deletion과 decision lineage 보존이 privacy 검토됐다.

### 공개

- [ ] 점수·랭킹·인기·추천·광고·award label 이해도 test를 통과한다.
- [ ] 방법론과 기준 시점이 공개된다.
- [ ] 모든 badge에 program·year·상세 link가 있다.
- [ ] 접근성·locale·SEO가 시험된다.
- [ ] embargo·atomic publish·rollback rehearsal이 완료된다.

### lifecycle

- [ ] 정정·보류·회수 상태와 통지 template이 있다.
- [ ] appeal이 원 decision maker와 분리된다.
- [ ] 폐업·이전·조사 발생 시 자동 alert가 있다.
- [ ] mark license·brand guide·오사용 대응이 법률 검토됐다.
- [ ] 독립성·공정성 사후 감사 일정이 있다.

---

## 36. 미결정 사항

- 공식 프로그램 이름과 상표 가능성
- 첫 pilot 지역·장르
- 데이터 cutoff와 발표 시기
- 최소 운영 기간·evidence 기준
- 현장 평가를 어떤 선정부터 사용하는지
- 익명 방문·비용·동행 정책
- panel 내부 구성과 외부 advisor 비율
- award tier 수와 수상점 수 정책
- 공개 방법론의 상세 수준
- 선정이 일반 검색 relevance에 줄 수 있는 boost 범위
- 점주 사전 통지 여부와 기간
- mark license의 기간·매체·승인 방식
- 과거 수상점 폐업·이전 시 badge 표현
- 연간 독립성 report 공개 범위

---

## 37. 연관 문서

- [PRODUCT.md](../product/PRODUCT.md)
- [RATING_SYSTEM.md](./RATING_SYSTEM.md)
- [SEARCH_SYSTEM.md](./SEARCH_SYSTEM.md)
- [RECOMMENDATION_SYSTEM.md](./RECOMMENDATION_SYSTEM.md)
- [ADVERTISING_MONETIZATION.md](./ADVERTISING_MONETIZATION.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [OWNER_PLATFORM.md](./OWNER_PLATFORM.md)
- [MEDIA_PIPELINE.md](./MEDIA_PIPELINE.md)
- [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)
- [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [LEGAL_COMPLIANCE_CHECKLIST.md](../policies/LEGAL_COMPLIANCE_CHECKLIST.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
