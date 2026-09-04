# 도락 도메인 용어집과 상태값 기준

> 상태: 초안 v0.1  
> 역할: 설계 문서, 코드, API, 운영 도구에서 사용하는 용어와 공개/내부 상태의 단일 기준  
> 규칙: 다른 문서와 충돌하면 해당 도메인 전문 문서를 먼저 확인하고, 충돌을 이 문서의 결정 로그에 기록해 함께 수정한다.  
> 연관 문서: [DATA_MODEL.md](../architecture/DATA_MODEL.md), [API_DESIGN.md](../architecture/API_DESIGN.md), [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md), [OPERATIONS.md](../operations/OPERATIONS.md)

---

## 1. 사용 규칙

### 1.1 제품 문구와 내부 이름을 구분한다

내부 `branch`를 모든 사용자 화면에서 ‘지점’이라고 번역할 필요는 없다. 독립점 사용자 화면에서는 자연스럽게 ‘음식점’이라고 표시할 수 있지만 데이터·API·운영 문서에서는 `branch`를 사용한다.

### 1.2 같은 단어를 두 엔터티에 쓰지 않는다

- `restaurant`와 `branch`를 모두 ‘매장 레코드’라고 부르지 않는다.
- `rating`, `score`, `ranking`을 ‘평점’ 하나로 섞지 않는다.
- 예약 `hold`와 결제 `authorization`을 모두 ‘가승인’이라고 부르지 않는다.
- 콘텐츠 공개 상태와 평점 적격성을 모두 `status` 하나로 합치지 않는다.

### 1.3 ID는 엔터티 종류를 포함해 말한다

문서에서 `id`만 쓰기보다 `branchId`, `reviewId`, `reservationId`를 사용한다. 실제 ID 문자열은 불투명하며 외부 공급자 ID를 내부 ID로 쓰지 않는다.

### 1.4 상태 이름은 코드로, 문구는 별도로 관리한다

코드의 안정된 상태값은 영어 `snake_case`, 사용자 표시 문구는 locale별 템플릿을 사용한다. 사용자 문구를 DB enum으로 저장하지 않는다.

---

## 2. 핵심 제품 용어

### 도락 `DORAK`

한국 음식점을 탐색·평가·저장·예약하고 점주가 공식 정보와 예약을 운영하는 플랫폼의 브랜드명. 상표 사용 가능성은 별도 검토 중이다.

### 음식점 원장 `restaurant registry`

도락이 관리하는 음식점·지점·주소·영업 상태·출처·변경 이력의 기준 데이터 집합. 외부 지도 공급자의 장소 목록과 동일하지 않다.

### 신뢰 외식 결정 `trusted dining decision`

정확성과 신뢰 기준을 충족한 지점 정보를 본 뒤 저장, 길찾기, 전화, 예약, 방문 같은 고의도 행동을 수행한 것. 분석의 핵심 가치 단위다.

### 자연 결과 `organic result`

광고 구매와 독립적인 검색 관련도·거리·품질 규칙으로 표시되는 결과.

### 스폰서 결과 `sponsored result`

비용을 지불한 광고 placement. 자연 결과와 시각·분석·랭킹 파이프라인을 분리하고 광고임을 표시한다.

### 편집 큐레이션 `editorial curation`

공개된 주제·기간·편집 관점으로 사람이 검토한 음식점 목록. 공개 점수 순위, 개인 추천, 광고와 동일하지 않다.

### 어워드 `award`

고정된 기준 시점·대상·방법·독립성 기준을 거쳐 공식 선정된 branch 기록. 영구 보증이나 정부 인증이 아니며 연도와 program을 포함한다.

### 선정 마크 `award mark`

선정된 지점이 정해진 연도·지점·매체·기간에 사용할 수 있는 브랜드 asset. 브랜드 전체나 다른 지점으로 자동 승계되지 않는다.

---

## 3. 음식점 엔터티

### 브랜드 `brand`

여러 음식점·지점이 공유할 수 있는 상업 브랜드 정체성. 같은 상호 문자열만으로 브랜드를 만들지 않는다.

예:

```text
brand: 도락라멘
restaurant: 도락라멘이라는 음식점 콘셉트
branch: 도락라멘 성수점
```

### 음식점 `restaurant`

메뉴·브랜드·운영 콘셉트의 지속적인 정체성. 체인에서는 여러 branch를 묶을 수 있다. 독립점에서도 데이터 모델상 branch와 분리할 수 있으나 소비자 행동의 직접 대상은 아니다.

### 지점 `branch`

사용자가 실제로 방문하고 리뷰·저장·예약하는 물리적 또는 명시된 영업 단위. 공개 상세와 공개 점수의 기본 대상.

### 사업 인허가 `business_license`

공공 또는 검증 출처에서 관측된 법적 영업 허가·신고 단위. `branch`와 1:1이라고 가정하지 않는다.

### 위치 `location`

주소 참조와 좌표를 묶는 공간 개념. 같은 위치에 시간에 따라 다른 branch가 존재할 수 있다.

### 지점 위치 이력 `branch_location_history`

지점과 주소·좌표 관계의 유효 기간 기록. 단순 좌표 수정과 실제 이전을 구분한다.

### 지점 관계 `branch_relation`

지점 간 `moved_to`, `replaced_by`, `same_complex`, `possible_duplicate` 같은 관계. 병합과 동일하지 않다.

### 이전 `move`

음식점 정체성이 다른 장소로 옮겨 간 사건. 기본적으로 새 branch와 `moved_to` 관계를 만들며 과거 리뷰를 새 공개 점수에 자동 합산하지 않는다.

### 재개업 `reopening`

폐업·휴업 후 다시 영업하는 사건. 같은 정체성이 유지됐는지에 따라 기존 branch 상태 변경 또는 새 branch 생성으로 나뉜다.

### 리브랜딩 `rebranding`

상호·브랜드 표현 변경. 이름만 바뀐 연속성과 콘셉트가 단절된 새 음식점을 구분한다.

### 병합 `merge`

둘 이상의 branch 레코드가 실제로 같은 지점을 나타낼 때 기준 branch로 관계를 통합하고 redirect를 만드는 운영 행위.

### 분리 `split`

잘못 병합되었거나 하나의 레코드에 여러 실재 지점이 섞였을 때 관계를 검토해 별도 branch로 복구하는 행위. 단순 트랜잭션 rollback과 다르다.

---

## 4. 데이터 수집 용어

### 데이터 출처 `data_source`

공공 데이터, 공급자 API, 점주, 사용자, 파트너 등 관측의 출처와 이용 조건을 등록한 리소스.

### 스냅샷 `source_snapshot`

특정 출처를 특정 시점·범위에서 수집한 단위. 원본 레코드들의 manifest와 처리 상태를 갖는다.

### 원천 레코드 `raw_source_record`

출처에서 받은 수정되지 않은 관측. 내부 canonical 엔터티가 아니다.

### 정규화 `normalization`

원문을 보존하면서 상호, 주소, 전화, 좌표, 카테고리, 시간의 비교 가능한 표현을 만드는 과정.

### 엔터티 해소 `entity resolution`

원천 또는 후보 레코드가 기존 brand/restaurant/branch/license 중 무엇과 같은 실재 대상을 나타내는지 결정하는 과정.

### 후보 생성 `blocking`

비교할 가능성이 있는 레코드 쌍을 전화, 주소, 거리, 상호 등으로 제한하는 단계. 최종 병합 결정이 아니다.

### assertion

특정 엔터티의 특정 필드가 특정 값이라는 출처 있는 주장.

예:

```text
subject: branch br_123
field: regularHours.monday
value: 11:30-21:00
source: verified owner submission
observedAt: ...
status: accepted
```

한국어 문서에서는 ‘필드 주장’ 또는 ‘근거 값’이라고 설명할 수 있으나 코드·모델명은 `assertion`을 유지한다.

### provenance

공개·파생 값이 어느 source, raw record, assertion, 규칙 버전에서 왔는지 나타내는 계보.

### canonical value

유효 assertion 중 필드별 선택 정책으로 현재 공개·내부 기준값으로 채택된 값. 원본을 삭제하거나 다른 주장을 거짓으로 확정하는 의미는 아니다.

### 읽기 모델 `read model`

검색·상세·점주 예약대장처럼 특정 조회에 최적화한 파생 표현. 최종 진실이 아니며 원장과 이벤트에서 재생성할 수 있어야 한다.

### backfill

새 규칙·스키마·모델을 과거 데이터 범위에 다시 적용하는 통제된 대량 처리.

### quarantine

스키마 오류, 계약 문제, 위험 신호가 있는 입력을 공개 처리 흐름에서 격리한 상태 또는 저장 영역.

---

## 5. 계정과 신원

### 계정 `user_account`

도락 서비스의 인증·상태 기준 엔터티. 공개 프로필과 직접 식별정보를 분리한다.

### 신원 `user_identity`

이메일, 전화, 소셜 로그인, passkey처럼 계정에 로그인하거나 연락처를 검증하는 수단. 직접 식별정보 영역에 저장한다.

### 프로필 `user_profile`

공개 가능한 handle, 표시명, 소개, 아바타 등. 계정이나 예약 연락처와 동일하지 않다.

### 행위자 `actor`

시스템에서 행동한 주체의 일반 표현.

```text
anonymous
user account
owner organization member
operator
partner client
system service
```

감사 로그는 actor type과 ID, 권한 문맥을 함께 기록한다.

### 세션 `session`

인증된 로그인 또는 분석상 연속 사용 구간. 인증 세션과 분석 세션은 같은 엔터티가 아니다.

### 추가 인증 `step-up authentication`

로그인되어 있어도 owner 이전, 연락처 내보내기, 환불 등 고위험 행동 전에 최근 강한 인증을 다시 요구하는 것.

### 동의 `consent`

특정 목적·정책 버전·시각·채널에 대한 사용자 의사 기록. 제품 선호 설정과 동일하지 않다.

---

## 6. 방문과 인증

### 방문 `visit`

사용자가 특정 branch를 특정 시점에 방문했다고 기록한 엔터티. 그 자체로 검증된 사실은 아니다.

### 방문 인증 시도 `verification_attempt`

예약, 영수증, 매장 QR, 결제, 위치, 수동 검토 같은 수단으로 visit를 확인하려는 시도.

### 방문 인증 `visit_verification`

시도 결과를 종합한 현재 인증 판정. 공개 표시에 필요한 최소 범주와 내부 증거를 분리한다.

### 증빙 `evidence`

영수증 이미지, 예약 참조, 제한된 위치 신호 등 판정에 사용되는 자료. 공개 콘텐츠가 아니며 보존·접근을 최소화한다.

### 인증 리뷰 `verified review`

검증된 visit와 연결된 리뷰. 인증은 방문 가능성을 높일 뿐 리뷰 내용의 사실성·품질·평점 방향을 보증하지 않는다.

---

## 7. 리뷰와 콘텐츠

### 리뷰 `review`

사용자가 branch 방문 경험을 공개하는 논리적 콘텐츠 엔터티. 현재 revision과 공개 상태를 가진다.

### 리뷰 수정본 `review_revision`

리뷰 본문·구조화 평가의 불변 버전. 수정할 때 새 revision을 만들며 운영 감사와 이의 처리에 사용한다.

### 리뷰 평가 `review_rating`

종합, 음식, 서비스, 분위기, 가격 가치 등 구조화된 사용자 입력. 공개 branch score와 다르다.

### 경제적 이해관계 공개 `review_disclosure`

자비 결제, 할인, 초대, 협찬, 직원·점주 관계 등 리뷰 작성 조건의 선언.

### 공개 상태 `publication_status`

콘텐츠가 사용자에게 어떻게 보이는지 나타낸다. 평점 계산 포함 여부와 별도다.

### 적격성 `rating_eligibility`

리뷰가 공개 branch score 계산에 포함될 수 있는지 정책·무결성 기준으로 판정한 결과.

### 제한 공개 `limited`

콘텐츠를 완전히 삭제하지 않고 검색·추천·프로필 등 일부 표면에서 노출을 제한하는 상태. 구체 효과는 정책 결정에 기록한다.

### 숨김 `hidden`

일반 사용자에게 보이지 않지만 이의·감사·법적 보존을 위해 내부에 유지되는 상태.

### 삭제 `deleted`와 제거 `removed`

- `deleted`: 작성자 또는 계정 생명주기에 따른 삭제 행위
- `removed`: 정책 위반 결정에 따른 플랫폼 제거

공개 결과는 비슷할 수 있지만 사유와 이의 경로가 다르다.

### 신고 `report`

사용자·점주·시스템이 콘텐츠·계정·지점에 문제를 제기한 접수 리소스. 신고 수 자체가 위반 판정은 아니다.

### 모더레이션 사건 `moderation_case`

하나 이상의 신고·탐지·증거를 묶어 정책상 판단하는 사건.

### 결정 `moderation_decision`

정책 버전, 사실, 조치, 결정자가 기록된 사건 결과.

### 이의 제기 `appeal`

결정 대상자가 새 맥락·오류를 근거로 재검토를 요청하는 절차. 단순 재신고와 다르다.

---

## 8. 평점과 랭킹

### 사용자 평가값 `user rating`

리뷰 작성자가 입력한 1.0~5.0 값. 한 리뷰의 의견이며 공개 branch score가 아니다.

### 공개 점수 `branch_score`

적격 리뷰의 보정·가중·수축을 거쳐 branch에 발행되는 1.00~5.00 대표 값.

### 평가 차원 `rating dimension`

음식, 서비스, 분위기, 가격 가치처럼 리뷰 입력과 집계에 사용하는 축.

### 리뷰 가중치 `review weight`

방문 인증, 리뷰어 전문성, 최근성, 무결성, 이해관계, 반복 방문 상한을 결합한 모델 내부 기여 계수. 인기나 광고 구매가 아니다.

### 리뷰어 기준선 `reviewer baseline`

리뷰어가 대체로 후하거나 박하게 평가하는 성향을 추정해 개별 평가를 해석하는 기준.

### 리뷰어 전문성 `reviewer_expertise`

특정 장르·지역에서 일관된 방문·리뷰 품질·무결성으로 얻는 제한된 신뢰 신호. 팔로워 수나 유명도와 동일하지 않다.

### 유효 표본 수 `effective sample size`

리뷰 수를 단순 합산하지 않고 가중치 집중을 반영한 정보량 지표.

### 사전분포 `prior`

리뷰가 적은 branch 점수를 안정화하기 위한 장르·지역 기준 분포. 광고나 점주 계약과 무관하다.

### 사후 점수 `posterior score`

prior와 적격 리뷰 데이터를 결합한 모델 결과.

### 신뢰 구간 `uncertainty interval`

점수 추정의 불확실성 범위. 사용자 UI에서 반드시 통계 용어로만 표현할 필요는 없지만 신규·표본 부족 상태를 숨기지 않는다.

### 랭킹 `ranking`

특정 지역·장르·조건에서 branch를 순서화한 결과. 공개 점수만으로 정렬하지 않고 최소 표본·불확실성·영업 상태·필터를 반영한다.

### 평점 모델 버전 `rating_model_version`

입력 규칙, 가중치, prior, 발행 설정을 고정한 버전. `draft`, `shadow`, `active`, `retired` 생명주기를 갖는다.

---

## 9. 검색

### 검색 의도 `search intent`

상호, 장르, 메뉴, 지역, 속성, 자연어 상황 등 사용자가 찾는 목적의 분류.

### 자동완성 `autocomplete`

입력 중 상호·지역·카테고리·메뉴·최근 검색 후보를 제안하는 기능. 전체 검색과 인덱스·랭킹 목표가 다르다.

### 검색 문서 `branch_search_document`

branch의 검색용 파생 표현. canonical DB가 아니며 outbox 이벤트로 갱신한다.

### 관련도 `relevance`

쿼리 의도와 결과의 텍스트·구조적 적합성. 공개 점수와 인기도는 관련도에 제한된 보조 신호로만 들어간다.

### 인기도 `popularity`

최근의 정상적인 조회·저장·결정 행동을 포화·감쇠한 보조 신호. 품질이나 평점과 동일하지 않다.

### 지도 검색 영역 `viewport`

사용자가 현재 보는 지도 경계. 사용자 정확한 위치와 동일하지 않다.

### 검색 journey

쿼리 수정·필터·지도 이동을 포함한 하나의 음식점 탐색 의도 흐름. 인증 세션과 다르다.

### 의미 기반 검색 `semantic search`

임베딩 등으로 문장 의미를 비교하는 검색. v1의 한글 구조화 검색을 대체하는 기본 계층이 아니라 향후 후보 생성·재정렬 보조 기능이다.

---

## 10. 저장·소셜

### 저장 `saved_branch`

사용자가 branch를 나중에 보기 위해 저장한 비공개 기본 관계.

### 목록 `list`

여러 branch를 묶고 제목·설명·공개 범위를 가진 컬렉션. 기본 저장과 공개 큐레이션을 모두 지원할 수 있다.

### 팔로우 `follow`

한 사용자가 다른 공개 리뷰어의 콘텐츠를 피드에서 받는 관계.

### 차단 `block`

두 사용자 사이의 발견·상호작용·알림을 제한하는 안전 관계. 단순 unfollow가 아니다.

### 피드 `feed`

팔로우, 저장, 편집 콘텐츠, 추천을 조합한 개인화 읽기 모델. 공개 점수나 리뷰 원본이 아니다.

---

## 11. 점주

### 점주 조직 `owner_organization`

독립 점주, 회사, 프랜차이즈 본사, 가맹점, 대행사처럼 지점 권한을 갖는 법적·운영 단위.

### 조직 구성원 `organization_member`

개인 user account와 owner organization의 역할 관계. 구성원은 자신의 계정으로 로그인한다.

### 역할 `role`

권한의 기본 묶음. `owner`, `admin`, `editor`, `reservation_manager`, `analyst`, `billing`, `review_manager` 등이 있다.

### 권한 `permission`

`branch.hours.write`, `reservation.contact.reveal` 같은 실행 가능한 세부 행동.

### 지점 범위 `branch_scope`

구성원 역할이 효력을 갖는 지점 집합.

### 지점 권한 관계 `branch_authority`

검증된 조직이 특정 branch에서 특정 범위의 점주 기능을 수행할 수 있다는 관계. claim 신청 자체와 다르다.

### claim

조직이 branch 권한 관계를 새로 얻거나 이전받기 위해 신원·사업·위임 관계를 제출하고 검토받는 절차 및 리소스.

### 공식 정보 `official information`

검증된 점주 조직이 제출한 정보. 항상 절대 사실이라는 뜻은 아니며 `owner` 출처 assertion으로 추적한다.

### 공식 답글 `owner_response`

점주 조직이 리뷰에 공개하는 답변. 조직명으로 표시되며 실제 작성 구성원은 감사에 남는다.

### 소유권 이전 `authority transfer`

branch 정체성을 유지하면서 기존 조직의 권한을 새 조직으로 넘기는 절차. 음식점 데이터 자체의 병합·이전과 다르다.

---

## 12. 예약과 좌석

### 예약 정책 `booking_policy`

지점의 예약 기간, 사전 시간, 이용 시간, 승인 방식, hold 시간 등 운영 기본값.

### 서비스 구간 `service_period`

점심·저녁·심야처럼 예약 가능한 현지 영업 구간.

### 예약 자원 `bookable_resource`

테이블, 룸, 카운터, 용량 풀 등 예약이 점유하는 대상.

### 자원 조합 `resource_combination`

둘 이상의 테이블을 붙이는 등 점주가 허용한 예약 자원 조합.

### 가용성 규칙 `availability_rule`

요일·서비스 구간·인원·채널·코스별 정기 판매 규칙.

### 가용성 예외 `availability_exception`

특정 날짜의 휴무, 대관, 특별 영업, 재고 차단.

### 예약 슬롯 `reservation_slot`

사용자에게 보여 주는 시간·인원·코스별 판매 후보 read model. 최종 재고 원장이 아니다.

### hold `reservation_hold`

결제·입력 동안 잠시 예약 자원을 확보한 상태. 예약 확정이 아니며 서버 만료 시각이 기준이다.

### 자원 배정 `reservation_allocation`

확정 또는 정책상 점유 중인 예약이 실제 resource와 시간 범위를 점유하는 원장 관계.

### 예약 `reservation`

사용자와 branch 사이의 방문 약속·거래 애그리게이트. 예약 상태, 조건 스냅샷, 당사자, 배정, 결제 참조를 가진다.

### 즉시 확정 `instant`

재고·정책·결제 조건 충족 시 서버가 곧바로 `confirmed`로 만드는 예약 방식.

### 승인형 `request`

사용자가 `requested` 상태로 제출하고 점주가 기한 안에 승인·거절하는 방식.

### 변경 제안 `reservation_change_proposal`

기존 확정 조건을 유지한 채 한쪽이 새로운 시간·인원·코스·금액을 제안하는 별도 리소스.

### 예약 연락처 `reservation contact`

해당 거래 수행을 위해 수집한 이름·전화·이메일. 공개 프로필이나 마케팅 연락처와 동일하지 않다.

### 착석 `seated`

점주가 사용자의 실제 도착·착석을 기록한 상태. 최종 이용 완료는 아니다.

### 완료 `completed`

예약 이용이 끝난 것으로 기록한 상태. 강한 방문 후보지만 무결성 검사를 거친다.

### 노쇼 `no_show`

유예시간과 확인 절차 뒤 예약자가 방문하지 않은 것으로 판정한 상태. 이의와 정정이 가능하다.

### 웨이팅 `waitlist`

주로 당일 현장 순번 대기. 미래 취소 자리 알림과 다르다.

### 취소 자리 알림 `cancellation_alert`

미래 예약 재고가 생기면 알려 주거나 짧게 제안하는 기능. 알림 신청 자체는 예약이 아니다.

---

## 13. 결제

### 결제 의도 `payment_intent`

예약금·선결제·변경금·취소 수수료를 특정 금액·통화로 처리하려는 내부 리소스.

### 결제 시도 `payment_attempt`

결제 의도를 공급자에 한 번 제출하거나 사용자 인증을 시도한 기록.

### 인증 `authorization`

결제수단의 금액 사용 가능성을 확보하는 결제사 단계. 방문 인증 `verification`과 다르다.

### 매입 `capture`

인증된 금액을 실제 결제로 확정하는 결제 이동.

### 결제 `charge`

사용자에게 부과된 금전 이동. 공급자 모델에 따라 authorization/capture와 표현이 다를 수 있다.

### 환불 `refund`

완료된 결제의 전부 또는 일부를 반환하는 별도 상태 리소스. 예약 취소와 동시에 끝난다고 가정하지 않는다.

### 취소 수수료 `cancellation_fee`

예약 당시 동의한 취소 정책 버전과 취소 시각을 기반으로 계산된 금액.

### 조정 `reconciliation`

도락 원장과 결제·예약 공급자의 상태·금액을 비교해 불일치를 찾고 수렴시키는 과정.

### 결제 상태 불명 `payment unknown`

timeout 등으로 결제 결과를 현재 확정할 수 없는 상태. 실패로 간주해 새 결제를 즉시 유도하지 않는다.

---

## 14. 알림

### 알림 정책 `notification_policy`

어떤 도메인 이벤트를 누구에게 어떤 분류·채널·기한·fallback으로 알릴지 정의한 버전 있는 규칙.

### 알림 의도 `notification_intent`

특정 사건을 특정 수신자에게 전달해야 한다는 논리적 단위. 채널별 발송 시도와 분리한다.

### 전달 시도 `delivery_attempt`

푸시·문자·이메일 공급자에 실제 발송한 한 번의 시도.

### 앱 inbox

도락 내부에 지속되는 알림 기록과 현재 리소스 링크. 외부 채널 전달 성공과 별도다.

### 거래 알림 `transactional notification`

특정 예약·결제·환불 수행에 필요한 상태 알림. 마케팅 동의와 분리한다.

### 활동 알림 `activity notification`

리뷰 답글, 유용 반응, 팔로우 콘텐츠 등 사용자가 목적별로 조절할 수 있는 알림.

### 에스컬레이션 `escalation`

기한 내 필요한 행동이 없거나 채널 실패 시 다음 역할·채널·운영 사건으로 알림 책임을 올리는 절차.

---

## 15. 운영

### 신고 `report`와 운영 사건 `operations_case`

- report: 문제 제기의 접수
- operations_case: 조사·결정·실행·통지를 관리하는 업무 단위

모든 report가 별도 case를 만들 필요는 없고 중복 report가 한 case에 묶일 수 있다.

### 사건 owner

다음 행동과 기한을 책임지는 운영자 한 명. 대상 콘텐츠의 owner organization과 다르다.

### 우선순위 `P0–P4`

사용자 감정의 강도가 아니라 피해 범위, 긴급성, 안전·금전·권한·가역성으로 정하는 업무 순서.

### 장애 등급 `SEV-0–SEV-3`

프로덕션 서비스 장애의 기술·사업 영향 등급. 일반 운영 사건 우선순위와 별도지만 상호 연결될 수 있다.

### runbook

구체적인 장애·실패 상태를 탐지·완화·복구·검증하는 실행 절차.

### playbook

반복 사건에서 가능한 판단 경로와 선택 기준을 제공하는 운영 가이드.

### 감사 로그 `audit log`

누가 어떤 권한으로 무엇을 조회·변경했는지 남기는 보안·책임 기록. 일반 애플리케이션 디버그 로그와 다르다.

### 보상 작업 `compensating action`

이미 커밋된 분산 작업을 과거로 되돌리는 대신 새 반대 행위로 결과를 바로잡는 것. 예: 결제 성공 후 예약 실패의 환불 생성.

---

## 16. 분석

### 이벤트 `analytics event`

사용자·서버에서 발생한 버전 있는 사실 기록. metric 자체가 아니다.

### 도메인 이벤트 `domain event`

애그리게이트의 상태 변경을 다른 시스템에 알리는 신뢰 가능한 이벤트. 일부는 분석에도 사용되지만 분석 클릭 이벤트와 목적이 다르다.

### 지표 `metric`

이벤트·상태에 분자, 분모, 자격 조건, 시간, 신원 단위를 적용한 정의.

### 북극성 지표 `north-star metric`

도락의 핵심 사용자 가치를 나타내는 상위 지표. 현재 권고안은 주간 신뢰 외식 결정 `WTDD`다.

### 가드레일 `guardrail`

주 지표 개선이 안전, 신뢰, 성능, 접근성, 운영 부담을 악화시키지 않는지 확인하는 제한 지표.

### 노출 `impression`

콘텐츠가 실제로 사용자 viewport에 일정 비율·시간 보였다는 자격 있는 이벤트. 서버가 결과를 반환한 것과 다르다.

### 실험 할당 `assignment`

사용자·지점이 실험 변형에 배정된 사실.

### 실험 노출 `experiment exposure`

배정된 변형을 실제로 경험할 수 있었던 사실. 분석 분모는 목적에 따라 assignment 또는 exposure를 사용한다.

### 잠정값 `provisional`

지연 데이터·검산 때문에 아직 최종 확정되지 않은 분석 수치.

---

## 17. 기술 용어

### 모듈형 모놀리스 `modular monolith`

하나의 배포 가능한 API 안에서 도메인 모듈과 데이터 소유 경계를 명확히 나눈 구조. 무경계 단일 코드베이스나 마이크로서비스와 다르다.

### 애그리게이트 `aggregate`

한 트랜잭션에서 불변식을 지키는 도메인 변경 경계. 예약이 대표 예다.

### transactional outbox

도메인 데이터 변경과 이벤트 레코드를 같은 DB 트랜잭션에 저장하고 별도 게시자가 큐로 발행하는 패턴.

### 멱등성 `idempotency`

같은 논리 요청을 재시도해도 중복 리소스·결제·상태 전이가 생기지 않고 같은 결과로 수렴하는 성질.

### 낙관적 잠금 `optimistic concurrency`

리소스 버전을 비교해 다른 사용자의 최근 변경을 조용히 덮어쓰지 않는 제어.

### 강한 일관성 `strong consistency`

예약 재고·권한처럼 확정 시 최신 원장을 검사해 불변식을 지키는 요구. 검색 색인에는 같은 수준을 요구하지 않는다.

### 최종 일관성 `eventual consistency`

검색·캐시·분석 read model이 이벤트를 통해 일정 시간 후 원장과 수렴하는 성질.

### 기능 저하 `degraded mode`

일부 의존성이 실패했을 때 안전한 범위의 읽기·대체 기능만 유지하는 상태.

### kill switch

특정 기능, 공급자, 지점, 지역, 채널을 즉시 중지해 피해 확대를 막는 통제.

---

## 18. ID와 코드 규칙

### 18.1 내부 ID 접두사 권고

문서와 로그 가독성을 위한 예이며 실제 형식은 ADR로 확정한다.

| 엔터티 | 예 |
|---|---|
| branch | `br_...` |
| restaurant | `rst_...` |
| user account | `acct_...` |
| review | `rev_...` |
| visit | `vis_...` |
| reservation | `rsv_...` |
| reservation hold | `hold_...` |
| payment intent | `pi_...` |
| notification intent | `ntf_...` |
| operations case | `case_...` |
| event | `evt_...` |

ID 접두사로 권한을 판단하지 않는다.

### 18.2 외부 참조

```text
provider
external_type
external_id
internal_type
internal_id
scope
status
```

### 18.3 사유 코드

상태 전이와 결정에는 안정된 `reason_code`를 사용하고 사용자 문구는 별도 현지화한다.

---

## 19. 시간 규칙

### 절대 시각

DB와 API의 사건 시각은 UTC timestamp/RFC 3339를 사용한다.

### 현지 날짜·시간

영업시간·예약 UI는 branch IANA timezone의 `localDate`, `localTime`을 사용한다.

### 영업일 `local_service_date`

자정을 넘는 영업에서 달력 날짜와 별도로 점주의 영업 회차를 묶는 날짜.

### 발생 시각 `occurred_at`

사건이 실제 발생한 시각.

### 수신 시각 `received_at`

도락이 사건을 받은 시각.

### 효력 시각 `effective_at/from/to`

상태·정책·assertion이 실제 적용되는 시각.

### 생성·수정 시각

레코드 저장 시각. 실제 사건·효력 시각을 대신하지 않는다.

---

## 20. 금액 규칙

### 금액 `money`

```json
{
  "amount": 20000,
  "currency": "KRW"
}
```

통화 최소 단위 정수로 표현하며 부동소수점을 쓰지 않는다.

### 가격 `price`

상품·코스의 표시 금액. 예약 당시 스냅샷을 유지한다.

### 예약금 `deposit`

예약 보장을 위해 미리 결제하는 일부 금액.

### 선결제 `prepayment`

예정 상품·코스 금액의 전부 또는 정의된 금액을 이용 전에 결제하는 것.

### 수수료 `fee`

취소·서비스·결제 처리 등 명시된 사유의 금액. 가격과 분리해 표시·원장화한다.

---

## 21. 정식 상태 카탈로그

### 21.1 branch 운영 상태

```text
pre_open
open
temporarily_closed
closed
moved
unknown
```

`inactive`는 레코드 관리 상태에 사용할 수 있지만 소비자 영업 상태로 쓰지 않는다.

### 21.2 계정 상태

```text
pending
active
restricted
suspended
closed
```

- `restricted`: 일부 행동 제한
- `suspended`: 로그인 또는 대부분 기능 중지
- `closed`: 계정 종료 절차 완료 상태

### 21.3 assertion 상태

```text
pending
accepted
rejected
superseded
expired
withdrawn
```

`withdrawn`은 제출자가 검토 전후 정책상 제안을 철회한 상태다. 이미 공개된 과거 사실을 삭제한다는 뜻은 아니다.

### 21.4 방문 인증 상태

```text
pending
verified
rejected
revoked
expired
```

### 21.5 리뷰 공개 상태

```text
draft
pending
published
limited
hidden
removed
```

작성자 삭제는 별도 `deleted_at`, deletion reason 또는 생명주기 이벤트로 표현할 수 있으며 공개 API에 안정된 표현을 정한다.

### 21.6 평점 적격성

```text
pending
eligible
ineligible
excluded_integrity
excluded_policy
revoked
```

공개 리뷰가 `ineligible`일 수 있고 숨긴 리뷰가 과거 점수 스냅샷에는 포함됐을 수 있다. 점수 발행 버전을 재현한다.

### 21.7 평점 모델

```text
draft
shadow
active
retired
```

한 공개 대상 범위에 `active` 발행 버전은 하나여야 한다.

### 21.8 claim 공개 요약 상태

소비자·점주 API의 안정된 coarse 상태:

```text
draft
pending
approved
rejected
revoked
disputed
withdrawn
```

내부 workflow step:

```text
submitted
verifying_identity
verifying_authority
conflict_review
awaiting_evidence
awaiting_approval
transfer_pending
```

workflow step을 공개 상태 enum에 계속 추가하지 않는다.

### 21.9 조직 구성원 상태

```text
invited
active
suspended
expired
removed
```

### 21.10 예약 상태

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

`draft`와 `hold`는 reservation 상태가 아니다. 예약 제출 전 클라이언트 초안과 `reservation_hold`로 분리한다.

### 21.11 예약 hold 상태

```text
active
consumed
expired
released
```

### 21.12 변경 제안 상태

```text
pending
accepted
rejected
expired
withdrawn
```

### 21.13 결제 의도 상태

```text
requires_method
requires_action
processing
succeeded
failed
cancelled
unknown
```

### 21.14 환불 상태

```text
requested
processing
succeeded
failed
manual_review
```

### 21.15 웨이팅 상태

```text
waiting
notified
accepted
seated
completed
cancelled
expired
```

### 21.16 알림 intent 상태

```text
created
eligibility_pending
scheduled
dispatching
delivered
partially_delivered
failed
suppressed
cancelled
expired
```

### 21.17 운영 사건 상태

```text
new
triaged
assigned
investigating
awaiting_user
awaiting_merchant
awaiting_partner
awaiting_approval
decided
executing
resolved
closed
duplicate
invalid
reopened
```

### 21.18 비동기 작업 상태

```text
queued
running
succeeded
failed
partially_succeeded
cancellation_requested
cancelled
```

---

## 22. 외부 상태와 내부 상태

공개 API가 내부 운영 세부 단계를 그대로 노출하지 않는 예:

| 내부 | 공개 |
|---|---|
| `verifying_identity` | claim `pending` |
| `awaiting_approval` | claim `pending` |
| `payment reconciliation queued` | payment `processing` 또는 `unknown` |
| `moderation investigator assigned` | report `under_review` 같은 공개 요약 |
| notification provider accepted | 사용자에게 별도 상태 미표시 |

공개 상태는 안정성과 사용자 행동 가능성을 기준으로 설계한다. 내부 팀 구조가 바뀌어도 API enum을 바꾸지 않는다.

---

## 23. 사용하지 않을 모호한 표현

| 피할 표현 | 대신 사용할 표현 |
|---|---|
| 매장 ID | `branchId` 또는 명시적 외부 장소 ID |
| 인증됨 | 방문 인증, 점주 인증, 연락처 인증 등 대상 명시 |
| 승인 | claim 승인, 예약 승인, 콘텐츠 승인 등 대상 명시 |
| 삭제 | 작성자 삭제, 정책 제거, soft delete, 파기 구분 |
| 평점 | 사용자 평가값, 공개 점수, 평가 차원 구분 |
| 랭킹 점수 | 검색 관련도, 공개 점수, 랭킹 함수 구분 |
| 예약 가능 | 자체 즉시, 승인형, 외부 링크, 전화 구분 |
| 결제 완료 | authorization, capture, payment intent succeeded 구분 |
| 알림 성공 | provider accepted, delivered, opened 구분 |
| 사용자 | 소비자, 리뷰 작성자, 예약자, 점주 구성원, 운영자 구분 |
| 공식 | 점주 제출, 공공 출처, 도락 운영 확인 구분 |

---

## 24. 문서 우선순위

충돌 시 해당 개념의 상세 계약은 다음 문서를 우선 검토한다.

| 영역 | 기준 문서 |
|---|---|
| 제품 범위 | [PRODUCT.md](./PRODUCT.md) |
| 엔터티·저장 | [DATA_MODEL.md](../architecture/DATA_MODEL.md) |
| 수집·매칭 | [DATA_INGESTION.md](../architecture/DATA_INGESTION.md) |
| 평점 | [RATING_SYSTEM.md](../features/RATING_SYSTEM.md) |
| 검색 | [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md) |
| API 표현 | [API_DESIGN.md](../architecture/API_DESIGN.md) |
| 점주 | [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md) |
| 예약·결제 | [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md) |
| 알림 | [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md) |
| 콘텐츠 정책 | [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md) |
| 개인정보·보안 | [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md) |
| 운영 | [OPERATIONS.md](../operations/OPERATIONS.md) |
| 분석 | [ANALYTICS.md](./ANALYTICS.md) |
| 기술 | [TECH_STACK.md](../architecture/TECH_STACK.md) |
| 단계 | [ROADMAP.md](./ROADMAP.md) |

기준 문서가 우선이라는 말은 충돌을 방치해도 된다는 뜻이 아니다. 충돌 발견 시 관련 문서와 OpenAPI/schema를 같은 변경에서 정합화한다.

---

## 25. 현재 결정이 필요한 용어

- 독립점에서도 `restaurant`와 `branch`를 항상 둘 다 생성할지
- 사용자 UI에서 `도락 점수`, `평점`, `별점` 중 대표 명칭
- 방문 인증 표시 수준: `예약 확인`, `영수증 확인`, 통합 `방문 확인`
- `limited` 리뷰의 사용자 표시와 직접 링크 동작
- 점주 claim의 공식 한국어: `매장 인증`, `점주 인증`, `관리 권한 요청`
- `waitlist`의 한국어를 `웨이팅`, `대기 등록`, `현장 대기` 중 어디로 통일할지
- 승인형 예약에서 `요청됨`과 `접수됨`의 표시
- cancellation alert의 사용자 명칭
- 공개 불확실성 표시 문구

---

## 26. 변경 기록 규칙

용어 또는 상태를 바꿀 때 다음을 기록한다.

```text
term/status
previous meaning
new meaning
reason
effective version/date
affected database fields
affected API schemas
affected events
affected UI copy
migration/backfill
compatibility window
owner
```

상태 이름 변경은 텍스트 치환이 아니라 데이터·API·분석·운영 runbook의 마이그레이션이다.

---

## 27. 연관 문서

- [README.md](../../README.md)
- [PRODUCT.md](./PRODUCT.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [ANALYTICS.md](./ANALYTICS.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [ROADMAP.md](./ROADMAP.md)
