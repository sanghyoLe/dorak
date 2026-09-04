# 도락 개인화 추천·피드 설계

> 실행 우선순위 안내: 추천 원칙은 유지하되 초기 후보 생성과 정렬은 PostgreSQL에서 처리한다. OpenSearch·Redis·별도 ML serving은 실제 품질·부하 문제가 측정된 이후의 확장안이다.

> 상태: 초안 v0.1  
> 범위: 홈 추천, 비슷한 음식점, 저장 목록 추천, 리뷰어·리스트 피드, 탐색 개인화  
> 원칙: 공개 점수는 모두에게 같게 유지하고, 개인화는 후보와 순서·설명에만 적용한다.  
> 연관 문서: [PRODUCT.md](../product/PRODUCT.md), [SEARCH_SYSTEM.md](./SEARCH_SYSTEM.md), [RATING_SYSTEM.md](./RATING_SYSTEM.md), [ANALYTICS.md](../product/ANALYTICS.md)

---

## 1. 목적

도락 추천은 사용자의 클릭 시간을 늘리는 것이 아니라 아직 알지 못한 좋은 식당과 믿을 만한 기록을 발견하게 해야 한다.

목표:

- 장르·지역·가격·상황에 맞는 지점을 발견한다.
- 사용자가 저장·방문한 것만 반복하지 않고 새로운 선택지를 제공한다.
- 팔로우한 리뷰어와 목록의 새 기록을 놓치지 않게 한다.
- 추천 이유와 사용된 선호를 제한적으로 이해·통제할 수 있게 한다.
- 인기·광고·평점·개인화 신호가 서로의 의미를 오염시키지 않는다.
- 방문·위치 패턴으로 민감한 생활 정보를 노출하지 않는다.
- 신규 지점·신규 사용자·지역 다양성을 구조적으로 다룬다.

---

## 2. 비목표

- 사용자마다 다른 공개 도락 점수 표시
- 광고 구매 지점을 자연 추천으로 위장
- 정확한 위치·생활 패턴을 영구 프로필로 구축
- 클릭을 높이는 자극적 리뷰·사진 최적화
- 사용자가 싫다고 한 장르를 반복 노출
- ‘AI 추천’이라는 이름만 붙인 인기순
- 추천 모델이 콘텐츠 정책·영업 상태를 우회

---

## 3. 제품 표면

### 3.1 홈

모듈 예:

- 저장한 동네에서 새롭게 기록된 곳
- 최근 본 장르의 다른 선택
- 팔로우한 리뷰어가 좋게 기록한 곳
- 이번 주말 예약 가능한 후보
- 아직 가보지 않은 가까운 장르
- 편집자가 만든 공개 컬렉션

한 사용자의 홈 전체를 하나의 검은상자 score로 만들지 않고 모듈별 목적과 근거를 구분한다.

### 3.2 비슷한 음식점

현재 branch의 장르, 메뉴, 가격, 지역, 분위기·시설을 기반으로 대안을 제공한다.

### 3.3 검색 개인화

검색어의 명시적 의도를 가장 우선한다. 개인화는 동률 해소·보조 가중치에 제한하며 `강남 라멘`을 검색했는데 자주 간 성수 식당을 앞세우지 않는다.

### 3.4 피드

- 팔로우한 리뷰어의 새 공개 리뷰
- 저장한 공개 목록의 업데이트
- 도락 editorial
- 제한된 개인화 발견

피드는 시계열과 추천을 구분해 label할 수 있다.

### 3.5 저장 목록

목록의 지점들과 잘 어울리는 후보, 빠진 지역·장르를 제안한다. 개인 메모를 모델 입력으로 기본 사용하지 않는다.

### 3.6 예약

사용자가 선택한 날짜·시간·인원·지역에 예약 가능한 대안을 제공한다. 재고가 없는 인기 지점을 반복 추천하지 않는다.

---

## 4. 추천과 다른 순서의 구분

| 유형           | 목적                      | 개인화                  |
| -------------- | ------------------------- | ----------------------- |
| 공개 점수      | 지점 리뷰의 공통 집계     | 없음                    |
| 지역·장르 랭킹 | 공통 기준의 순위          | 없음, filter만          |
| 검색 관련도    | 명시 쿼리 충족            | 제한적                  |
| 홈 추천        | 사용자의 다음 발견        | 있음                    |
| 팔로우 피드    | 선택한 source의 새 콘텐츠 | 기본 시계열 + 제한 추천 |
| 광고           | 유료 placement            | 별도 targeting 정책     |

UI와 분석 event에 surface·algorithm type을 포함한다.

---

## 5. 원칙

### 5.1 명시적 의도가 암묵적 행동보다 우선한다

사용자가 `매운 음식 싫어요`라고 설정했다면 과거 클릭 몇 번으로 뒤집지 않는다.

### 5.2 관련성과 품질을 분리한다

취향에 맞아도 폐업·데이터 신뢰 낮음·정책 위반 지점은 추천할 수 없다. 공개 점수는 품질 신호 중 하나일 뿐 개인 취향 score가 아니다.

### 5.3 단조로운 확신보다 탐색

모델이 아는 장르만 보여 주면 사용자의 취향이 좁아지고 신규 지점이 기회를 얻지 못한다. 설명 가능한 탐색 예산을 둔다.

### 5.4 부정 피드백을 존중한다

`관심 없음`, `이미 다녀옴`, `너무 멀어요`, `이 장르 적게`를 제공하고 일정 기간·범위에 반영한다.

### 5.5 민감 추론을 억제한다

종교, 건강, 정치, 성적 지향, 사적 관계를 추론할 수 있는 방문·검색을 장기 추천 profile로 사용하지 않는다.

### 5.6 설명과 제어

모든 개별 score를 공개할 필요는 없지만 사용자가 추천의 큰 이유를 이해하고 선호를 수정할 수 있어야 한다.

---

## 6. 신호 분류

### 6.1 명시적 선호

- 선호·비선호 장르
- 가격대
- 자주 탐색할 지역
- 식이·접근성 filter, 민감도 별도 검토
- 개인화 on/off
- 관심 없음 사유
- 팔로우한 리뷰어·목록

### 6.2 고의도 행동

- 저장
- 목록 추가
- 길찾기
- 전화
- 예약
- 방문 기록
- 리뷰

### 6.3 중간 의도

- 음식점 상세를 의미 있게 읽음
- 메뉴·리뷰 확장
- 같은 지점 재방문
- 검색에서 선택

### 6.4 약한 신호

- 짧은 노출
- 스크롤
- 사진 한 장 열기
- 알림 click

약한 신호가 강한 선호를 덮지 못하게 가중치 상한을 둔다.

### 6.5 부정 신호

- 관심 없음
- 숨김
- 차단
- 즉시 뒤로가기의 반복
- 잘못된 지역/영업 상태 신고
- 취소·노쇼는 취향 부정으로 자동 해석하지 않음

### 6.6 사용 금지 또는 제한

- 비공개 목록 메모 원문
- 예약 자유 요청
- 정확한 GPS history
- 다른 사람과의 공동 방문 추론
- 결제수단·금액의 개인 재산 추정
- 모더레이션·fraud 내부 score
- 연락처·프로필의 민감 속성
- 광고 반응을 자연 선호로 자동 혼합

---

## 7. 사용자 선호 모델

### 7.1 구조

```text
user_preference_profile
  user_account_id
  profile_version
  explicit preferences
  derived category affinities
  region affinities at safe granularity
  price affinity
  novelty preference
  negative preferences
  updated_at
  model version
```

원시 행동을 profile row 하나에 무기한 누적하지 않는다.

### 7.2 시간 감쇠

최근 행동이 더 강할 수 있지만 장기 explicit preference를 빠르게 지우지 않는다.

```text
signal_weight = base_strength × recency_decay × confidence × context_match
```

### 7.3 문맥

같은 사용자의 평일 점심과 주말 저녁은 다르다.

문맥 후보:

- 사용자가 지정한 지역
- 날짜·시간·인원
- 검색 쿼리
- 예약 가능성
- 현재 surface

정확한 현재 위치를 장기 profile에 저장하지 않고 요청 문맥으로만 사용할 수 있다.

### 7.4 공동 계정·기기

하나의 계정을 여러 사람이 쓰거나 기기를 공유할 수 있다. 일시적인 관심을 영구 profile로 과도하게 반영하지 않고 명시적 초기화·수정 기능을 제공한다.

---

## 8. 음식점 특성 모델

```text
branch feature snapshot
  categories and dishes
  menu terms
  price band
  region/geo
  opening/reservation context
  ambience/amenity structured tags
  rating quality/uncertainty
  review topic aggregates
  data confidence
  freshness
  operational status
```

점주가 검색·추천 keyword를 자유 입력해 score를 조작하지 못하게 공개 사실과 검증된 구조화 정보를 사용한다.

리뷰 topic은 공개 리뷰의 충분한 집계만 쓰고 개인·민감 주제를 배제한다.

---

## 9. 후보 생성

여러 source에서 넓은 후보를 생성한 뒤 rank한다.

### 9.1 콘텐츠 기반

- 선호 category/menu
- 유사 branch
- 가격·분위기·시설
- 지역 문맥

### 9.2 협업 기반

비슷한 고의도 행동을 한 사용자 집단의 다른 지점. 사용자 ID 자체가 결과·설명에 노출되지 않는다.

### 9.3 그래프 기반

- 팔로우한 reviewer의 리뷰
- 저장한 list의 지점
- branch/list/reviewer 관계

### 9.4 인기·신규

- 지역·장르의 감쇠 인기
- 최근 열린 지점
- 최근 데이터가 풍부해진 지점

인기는 후보 source이며 품질 보증이 아니다.

### 9.5 editorial

도락 editor의 공개 컬렉션. 개인화 결과와 editorial 선정 이유를 구분한다.

### 9.6 예약 가용성

날짜·시간·인원이 명시된 surface에서 실시간 또는 근사 가용 후보를 생성한다. 검색 index의 배지를 최종 재고로 보지 않는다.

### 9.7 후보 provenance

각 후보는 source와 이유 code를 가진다.

```text
content_similar
collaborative
followed_reviewer
saved_list_related
local_trending
new_branch
editorial
reservation_available
exploration
```

---

## 10. hard filter

rank 전에 제외:

- closed/moved 기본 정책
- 숨김·법적 제한
- 심각한 데이터 identity conflict
- 사용자 차단 관계
- explicit negative preference, 제품 문맥에 따라
- 거리·지역 hard constraint
- 날짜·인원 예약 hard constraint
- 중복 branch
- 이미 같은 surface에서 반복 노출된 항목
- 광고를 자연 후보에 삽입하는 경로

사용자가 explicit query로 찾은 경우 비선호 장르를 무조건 숨기지 않고 쿼리 의도를 우선한다.

---

## 11. ranking

개념:

```text
recommendation_score =
  preference_match
  + context_match
  + source_affinity
  + quality_confidence
  + freshness
  + social_relevance
  + bounded_popularity
  + exploration_bonus
  - repetition_penalty
  - distance_cost
  - uncertainty_risk_when_context_requires
```

이후 slate 단계에서 다양성·중복·모듈 quota를 적용한다.

### 11.1 점수 상한

- 공개 score 영향 상한
- popularity 포화
- followed reviewer 한 명의 feed 독점 제한
- 같은 브랜드·장르·골목 반복 제한
- sponsored 신호는 자연 score 입력 금지

### 11.2 문맥별 목적

| surface     | 주 목적                       |
| ----------- | ----------------------------- |
| 홈          | 발견·다양성·고의도 결정       |
| 비슷한 지점 | 현재 branch와 대안 적합성     |
| 검색        | query 관련성 우선             |
| 피드        | 선택한 source의 최신성·관련성 |
| 예약 대안   | 실제 가용성과 조건            |

하나의 모델로 모든 surface를 억지로 통일하지 않는다.

---

## 12. 다양성·탐색

### 12.1 다양성 차원

- category/dish
- neighborhood
- price band
- chain/independent
- familiar/new
- reviewer source
- content type

사용자에게 무관한 다양성을 위해 관련성을 크게 희생하지 않는다.

### 12.2 slate re-ranking

```text
maximize total relevance
subject to:
  max same brand
  max same fine category
  minimum source variety
  exploration slots
  no duplicates
```

### 12.3 탐색 예산

신규·불확실 후보를 제한적으로 노출하고 결과를 학습한다. 리뷰가 적다는 이유만으로 영구 배제하지 않지만 데이터 신뢰·영업 상태 기준은 유지한다.

### 12.4 사용자 novelty

익숙한 곳을 좋아하는 사용자와 새로운 곳을 찾는 사용자의 명시·행동 차이를 반영하되 숨은 성격 label로 과장하지 않는다.

---

## 13. cold start

### 13.1 신규 사용자

선택 가능한 짧은 onboarding:

- 자주 찾는 지역
- 좋아하는 장르 몇 개
- 가격 범위
- 발견 성향

건너뛰기 가능. 초기에는 지역·시간·editorial·품질·다양성을 사용한다.

### 13.2 신규 branch

- 원장 데이터·메뉴·장르 기반 content 후보
- 신규 탐색 quota
- 점주 광고 구매와 분리
- 리뷰가 없으면 공개 score를 꾸미지 않음
- 사용자 노출 후 품질·신고 guardrail

### 13.3 신규 지역

데이터 coverage와 리뷰 밀도가 낮으면 개인화 모델보다 editorial·구조화 검색·품질 표시를 우선한다.

### 13.4 신규 reviewer

팔로워 수가 없더라도 검증 방문·장르 기여·리뷰 품질에 따라 콘텐츠가 후보가 될 수 있다. 유명도만으로 feed를 독점하지 않는다.

---

## 14. 피드

### 14.1 source

```text
followed reviewer review
followed/saved public list update
editorial collection
limited discovery recommendation
service announcement, separate module
```

광고는 별도 placement다.

### 14.2 순서

기본적으로 최신성과 source 선택을 존중한다. ranking은 반복 억제·관련성·품질을 보조한다.

### 14.3 읽음과 pagination

- stable cursor
- feed generation/version
- 이미 본 항목 반복 억제
- 새 항목 banner
- 삭제·제재 item 제거

### 14.4 권한 변화

list가 비공개로 바뀌거나 사용자가 차단되면 과거 feed cache에서도 접근이 제거된다.

### 14.5 infinite scroll

무한 소비를 제품 목표로 두지 않는다. 의미 있는 단위의 끝과 새로고침을 제공하고 저장·방문 같은 행동으로 연결한다.

---

## 15. 설명

### 15.1 이유 문구

```text
성수에서 저장한 라멘집과 비슷해요
팔로우한 민지님의 새 리뷰예요
자주 찾는 합정의 새로운 일식집이에요
토요일 7시에 2명 예약할 수 있어요
저장한 ‘조용한 저녁’ 목록과 잘 맞아요
```

`당신은 고급 식당을 선호합니다`처럼 민감·단정적인 profile label을 노출하지 않는다.

### 15.2 설명 provenance

랭킹 후 그럴듯한 이유를 생성하지 않는다. 후보·ranking이 실제 사용한 safe reason code 중 우선순위로 선택한다.

### 15.3 생성형 문구

초기에는 template 기반을 사용한다. 생성형 설명을 도입하면 입력 근거, hallucination, 민감 추론, locale 검토가 필요하다.

---

## 16. 사용자 제어

### 16.1 전체 제어

- 개인화 추천 끄기
- 추천 이력·선호 초기화
- 명시 선호 수정
- 추천에 사용되는 큰 범주 설명

개인화를 끄면 지역·시간·공통 품질·editorial 기반 비개인 결과를 제공한다.

### 16.2 항목 제어

```text
관심 없음
이미 다녀왔어요
너무 멀어요
이 장르 적게 보기
이 리뷰어 숨기기/언팔로우
이유가 맞지 않아요
신고
```

### 16.3 부정 피드백 범위

한 지점 관심 없음을 브랜드 전체 비선호로 확대하지 않는다. 사용자에게 영향 범위를 명확히 한다.

### 16.4 초기화

profile 파생값과 cache를 재계산하고 외부 모델 저장소까지 전파한다. 원시 이벤트 보존과 초기화 효과는 privacy 문서와 일치시킨다.

---

## 17. 광고와 수익

### 17.1 분리 pipeline

```text
organic candidate/ranker
ad eligibility/auction/ranker
placement composer
UI disclosure
separate analytics
```

### 17.2 광고 targeting

민감한 방문·검색, 리뷰 내용, 모더레이션 상태를 사용하지 않는다. 위치는 사용자가 탐색한 지역 같은 문맥 수준을 우선한다.

### 17.3 자연 결과 영향 금지

- 광고 클릭이 자연 preference에 자동 가중되지 않음
- 광고 계약이 공개 score/quality를 바꾸지 않음
- 광고를 구매하지 않은 점주가 공식 정보 권리를 잃지 않음
- 광고 품질 문제는 캠페인과 branch 정책 양쪽에서 처리

### 17.4 중복

같은 branch가 광고와 자연 결과에 동시에 자격이 있을 때 placement별 중복 억제·표시 규칙을 정한다.

---

## 18. 안전·무결성

### 18.1 콘텐츠 정책

숨김·제한·법적 보존 콘텐츠가 feed cache나 추천 snapshot에서 재노출되지 않게 한다.

### 18.2 부정행위

- 점주가 자기 지점을 저장·클릭하는 캠페인
- 계정 farm
- 리뷰어 팔로우 조작
- 알림 click 유도
- bot 노출·클릭
- 광고→자연 신호 세탁

행동 신호의 eligibility와 integrity weight를 둔다.

### 18.3 반복 노출 공격

점주·reviewer가 많은 유사 콘텐츠·list를 만들어 feed를 점유하지 못하게 entity·organization·content similarity quota를 둔다.

### 18.4 사용자 차단

차단 관계는 candidate, feed, notification, profile suggestion 모든 경로에 적용한다.

---

## 19. 개인정보

### 19.1 목적과 고지

추천에 사용하는 행동 범주와 제어를 개인정보 처리 문서에 설명한다. 개인화를 위한 새 민감 정보 수집을 기본값으로 만들지 않는다.

### 19.2 위치

- 요청 문맥 위치와 장기 선호 지역 분리
- 정확한 raw GPS의 짧은 처리
- profile은 행정구역·격자 등 더 거친 수준
- 집·직장 label 자동 추론 금지
- 개인화 off 시 위치 profile 사용 중지

### 19.3 보존

- 원시 노출·행동: 분석 목적 기간
- 파생 profile: 갱신·만료
- 부정 피드백: 사용자가 기대하는 억제 기간
- experiment assignment: 감사 기간
- 삭제·초기화 전파

### 19.4 작은 집단

협업 기반 이유로 `당신과 같은 3명이...`처럼 집단 규모를 노출하지 않는다. 모델 학습·집계의 k-anonymity/threshold를 위험에 맞게 적용한다.

### 19.5 외부 모델 공급자

사용자 이벤트·profile을 외부 생성형/추천 API로 보내기 전 목적·계약·지역·삭제·학습 재사용을 검토한다. 초기 자체 structured ranking에서는 불필요하다.

---

## 20. architecture

```text
domain + analytics events
  -> validated interaction facts
  -> feature pipelines
     ├─ user preference snapshot
     ├─ branch feature snapshot
     ├─ graph aggregates
     └─ popularity/freshness
  -> candidate generators
  -> online policy/filter
  -> ranker
  -> slate composer
  -> recommendation response + reason
  -> impression/decision outcomes
```

### 20.1 source of truth

- branch/review/status: PostgreSQL/domain
- search candidates: OpenSearch 가능
- feature snapshot: versioned derived store
- online cache: Redis, 최종 진실 아님
- offline training/evaluation: warehouse

### 20.2 초기 구현

별도 ML serving 없이 rules + batch affinities + OpenSearch candidate + API re-ranking으로 시작할 수 있다.

### 20.3 모델 고도화

label·traffic·평가 기반이 충분해지면 learning-to-rank, embedding candidate를 shadow로 추가한다. 규칙 기반 hard filter와 광고 분리는 유지한다.

---

## 21. 데이터 모델

### `recommendation_model_version`

```text
id
surface
algorithm/config hash
feature schema version
status: draft/shadow/active/retired
effective_at
approved_by
```

### `user_preference_snapshot`

```text
user token
model version
explicit/derived feature refs
input cutoff
expires_at
```

민감 원시 이벤트를 snapshot에 복제하지 않는다.

### `branch_feature_snapshot`

```text
branch id
feature version
canonical/rating/search input versions
features
calculated_at
```

### `recommendation_request`

```text
request id
surface/context
model version
candidate source counts
policy version
created_at
```

개인정보 최소화된 분석 record다.

### `recommendation_impression`

request, branch/content, position, source, reason, placement, qualified visibility를 기록한다.

---

## 22. API

```text
GET /v1/recommendations/home
GET /v1/branches/{branchId}/similar
GET /v1/me/feed
GET /v1/me/recommendation-preferences
PATCH /v1/me/recommendation-preferences
POST /v1/me/recommendation-feedback
POST /v1/me/recommendation-profile:reset
```

응답 예:

```json
{
  "requestId": "recq_01K...",
  "modelVersion": "home_rules_v1",
  "modules": [
    {
      "moduleId": "nearby_new",
      "title": "성수에서 새롭게 기록된 곳",
      "items": [
        {
          "branch": {},
          "reason": {
            "code": "EXPLICIT_REGION_AND_CATEGORY",
            "label": "자주 찾는 성수의 라멘집이에요"
          },
          "placement": "organic"
        }
      ]
    }
  ],
  "page": {
    "nextCursor": "opaque"
  }
}
```

내부 affinity·score·다른 사용자 정보는 공개하지 않는다.

---

## 23. 이벤트

```text
recommendation_requested
recommendation_returned
recommendation_impression
recommendation_selected
recommendation_feedback_submitted
recommendation_preference_updated
recommendation_profile_reset
feed_refreshed
feed_item_impression
```

결과 행동은 기존 `branch_saved`, `reservation_confirmed` 같은 서버·제품 이벤트와 requestId로 연결한다.

### 23.1 귀속

추천 선택 후 행동의 기여 창은 surface·행동별로 정의한다. 마지막 click만으로 전체 추천 가치를 확정하지 않는다.

### 23.2 위치 편향

상위 노출의 click을 relevance truth로 그대로 학습하지 않는다. 노출·position·policy와 실험을 사용해 편향을 평가한다.

---

## 24. 오프라인 평가

### 24.1 split

시간 기반 train/validation/test를 사용해 미래 행동 누출을 막는다. 사용자·branch cold-start split을 별도 둔다.

### 24.2 지표

- Precision/Recall@K
- NDCG@K
- MAP/MRR, surface에 따라
- coverage
- catalog/long-tail coverage
- intra-list diversity
- novelty
- calibration
- repeated exposure rate
- cold-start performance

### 24.3 단순 baseline

- 지역 인기
- 장르 인기
- 최근 저장 기반 콘텐츠 유사도
- 팔로우 시계열

복잡한 모델이 baseline보다 실질적으로 좋아야 한다.

### 24.4 정책 감사

- closed/hidden 노출 0
- blocked 관계 0
- sponsored contamination 0
- explicit negative 위반
- 지역·장르 coverage

---

## 25. 온라인 평가

### 주 지표

- 추천→상세
- 추천→저장·길찾기·예약 같은 신뢰 결정
- 새로운 branch의 의미 있는 발견
- 피드 source 소비
- 장기 재사용

### 가드레일

- 관심 없음·숨김·신고
- 알림 해제
- 검색으로 즉시 수정하는 비율
- 잘못된 영업·거리 신고
- 낮은 품질·폐업 노출
- 장르·브랜드 집중
- 성능 latency
- 점주·광고 편향

### 실험

- 사전 등록
- 사용자 단위 randomization 기본
- carryover와 novelty effect
- 신규/기존 사용자 분리
- 장기 holdout 고려

공개 점수 표시 자체를 사용자마다 다르게 실험하지 않는다.

---

## 26. 공정성과 생태계

### 26.1 공급 공정성

신규·독립·비광고 지점이 검증된 품질 기준 아래에서 탐색 기회를 얻는지 본다.

### 26.2 사용자 공정성

지역·언어·접근성 설정·가격 선호에 따라 품질 gap이 큰지 평가한다. 민감 속성을 무단 추론해 개인화하지 않는다.

### 26.3 reviewer 생태계

팔로워가 많은 reviewer만 feed를 독점하지 않게 content quality, relevance, source cap을 사용한다. 작은 reviewer의 공개 리뷰를 강제로 추천하지도 않는다.

### 26.4 가격대

예약·광고 conversion이 높은 고가 지점만 최적화하면 서비스가 편향된다. decision value와 사용자 explicit price를 우선한다.

---

## 27. 성능·SLO

초기 목표:

| 경로            |   p95 | 가용성 |
| --------------- | ----: | -----: |
| 홈 추천         | 500ms |  99.9% |
| 비슷한 지점     | 300ms |  99.9% |
| 피드 첫 페이지  | 400ms |  99.9% |
| preference 변경 | 500ms |  99.9% |

기능 저하:

- 개인 profile store 장애: 비개인 지역·editorial baseline
- candidate generator 일부 장애: source를 빼고 결과 provenance 표시
- ranking 장애: 승인된 deterministic fallback
- 안전 filter 장애: 자연 추천 전체를 안전하게 닫고 팔로우 시계열만 제한 제공 가능
- recommendation 장애가 검색·예약을 막지 않음

---

## 28. 모니터링

```text
request latency/errors
candidate count by source
filter exclusion reasons
empty recommendation rate
model/version distribution
profile freshness
closed/hidden/blocked policy violations
sponsored contamination
same-brand/category concentration
impression/select/decision by position
negative feedback
cold-start coverage
feature drift
```

민감한 user profile 값을 dashboard dimension으로 노출하지 않는다.

---

## 29. 테스트

### 규칙

- explicit preference 우선
- negative feedback
- closed/hidden/blocked
- duplicate branch
- ad separation
- reason provenance
- profile reset

### 후보

- 각 generator empty/failure
- new branch/user
- source quota
- stale features
- branch merge/move

### ranking

- deterministic fixed input
- score bounds
- popularity cap
- diversity constraint
- same brand
- exploration quota

### 개인정보

- exact location 미보존
- private note/request 미입력
- deletion/reset 전파
- blocked relation cache
- external provider payload

### E2E

- onboarding→home→feedback→changed results
- save→related recommendation
- follow→feed→unfollow/blocked removal
- reservation context→available alternative
- personalization off→nonpersonal baseline
- branch closure→cached recommendation removal

---

## 30. 모델 출시

```text
offline baseline comparison
 -> shadow candidate/ranking
 -> policy audit
 -> internal traffic
 -> small user canary
 -> experiment
 -> active
```

모델 artifact, feature schema, config, code, input cutoff, approval을 버전으로 묶는다.

### rollback

이전 active model/config 또는 deterministic baseline으로 돌아간다. profile schema 변경이 있으면 backward compatibility를 검증한다.

### kill switch

surface, user cohort, region, candidate source, model version별로 차단할 수 있다.

---

## 31. 구현 순서

### P0. 비개인 baseline

- 지역·장르·품질·editorial 모듈
- similar branch content rule
- 팔로우 시계열
- reason code
- 분석 계약

### P1. 명시 선호

- onboarding
- region/category/price
- 개인화 on/off
- 관심 없음
- profile reset

### P2. 행동 기반

- 고의도 signal
- batch affinity
- candidate mix
- diversity/repetition
- offline evaluation

### P3. 학습 ranking

- position-aware label
- LTR/embedding shadow
- experiment
- drift·fairness

### P4. 고도화

- 상황·예약 context
- multi-objective slate
- long-term value
- 다국어
- federated/privacy-enhancing 방법의 필요성 검토

---

## 32. 출시 체크리스트

- [ ] 공개 branch score가 사용자마다 달라지지 않는다.
- [ ] 검색 쿼리의 명시적 의도가 개인 profile보다 우선한다.
- [ ] 광고와 자연 추천 pipeline·표시·분석이 분리된다.
- [ ] closed/hidden/blocked branch/content가 추천되지 않는다.
- [ ] 추천 이유가 실제 사용된 safe signal에서 나온다.
- [ ] 사용자가 개인화를 끄고 선호를 수정·초기화할 수 있다.
- [ ] 정확한 위치, private note, 예약 요청사항이 profile 입력에 없다.
- [ ] popularity와 같은 브랜드·reviewer 반복에 상한이 있다.
- [ ] 신규 사용자·branch baseline과 탐색 기회가 있다.
- [ ] 오프라인 품질·coverage·diversity와 온라인 가드레일이 있다.
- [ ] branch merge/closure, account deletion, block이 cache에 전파된다.
- [ ] 모델·feature·config·reason version을 재현할 수 있다.
- [ ] 장애 시 비개인 deterministic fallback이 있다.

---

## 33. 미결정 사항

- 홈 모듈의 첫 구성과 순서
- 명시 선호 onboarding 질문 수
- region affinity의 최소 공간 단위
- 개인화 profile 원시 이벤트 보존기간
- recommendation model store/feature store 도입 시점
- collaborative filtering의 최소 사용자·지점 밀도
- 탐색 quota와 long-tail 목표
- 피드를 엄격 시계열/혼합 중 어떻게 표시할지
- 개인화 off 시 남길 문맥 기반 추천 범위
- 생성형 이유·리뷰 요약 도입 여부
- 광고 targeting 허용 문맥
- 장기 holdout 실험 규모

---

## 34. 연관 문서

- [PRODUCT.md](../product/PRODUCT.md)
- [SEARCH_SYSTEM.md](./SEARCH_SYSTEM.md)
- [RATING_SYSTEM.md](./RATING_SYSTEM.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [GLOSSARY.md](../product/GLOSSARY.md)
