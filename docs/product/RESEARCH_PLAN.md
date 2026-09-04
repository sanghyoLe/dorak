# 도락 사용자·점주·운영 리서치 계획

| 항목 | 내용 |
| --- | --- |
| 문서 상태 | Draft |
| 문서 버전 | 0.1.0 |
| 연구 범위 | 문제 탐색, 개념 검증, usability, 현장 운영, 정량 검증 |
| 첫 시장 | 대한민국 |
| 주요 독자 | 창업자, 제품, 디자인, 데이터, 리서치, 점주, 운영, trust |

## 1. 목적

도락은 기능이 많다고 성공하는 서비스가 아니다. 사용자가 기존 지도·SNS·블로그·예약 앱 사이에서 실제로 겪는 불신과 탐색 비용을 줄이고, 점주와 운영자가 유지 가능한 구조여야 한다.

이 문서는 다음을 정의한다.

- 무엇을 사실로 가정하고 무엇을 검증해야 하는가
- 소비자, 리뷰어, 점주, 운영자를 어떻게 구분해 조사하는가
- 인터뷰·관찰·prototype test·survey·실험을 언제 사용하는가
- 참가자 모집·보상·개인정보·동의를 어떻게 관리하는가
- 결과를 feature 요청 목록이 아니라 제품 결정으로 어떻게 바꾸는가
- 어떤 결과면 우선순위를 낮추거나 방향을 바꾸는가

리서치는 출시를 정당화하기 위한 인용문 수집이 아니다. 잘못된 가정을 조기에 버리는 의사결정 시스템이다.

---

## 2. 원칙

### RES-P01. 행동을 먼저 묻는다

`이 기능을 쓰시겠어요?`보다 최근 실제 외식 결정, 사용한 앱, 검색어, 실패, 예약, 리뷰 작성 행동을 재구성한다.

### RES-P02. 해결책보다 문제의 강도를 검증한다

사용자가 별점 보정 공식을 좋아하는지보다 현재 평가를 왜 믿거나 의심하는지, 그 불신 때문에 무엇을 추가 확인하는지 본다.

### RES-P03. 말과 행동의 차이를 기록한다

`리뷰를 꼼꼼히 본다`는 응답과 실제 화면에서 사진·최신 리뷰·메뉴만 보는 행동이 다를 수 있다. think-aloud, 화면 과제, diary로 보완한다.

### RES-P04. 평균 사용자만 만들지 않는다

혼밥, 가족, 예약형, 외국인, 지역 생활권, 저빈도 외식, 리뷰 기여자, 점주처럼 의도와 위험이 다른 집단을 분리한다.

### RES-P05. 점주 요구와 사용자 신뢰를 함께 검증한다

점주가 원하는 노출·리뷰 삭제 기능을 그대로 만들지 않는다. 원장의 정확성, 반론권, 예약 운영, 개인정보와 사용자 표현권의 균형을 연구한다.

### RES-P06. 참가자 안전과 개인정보를 제품보다 우선한다

정확한 집·직장, 건강·종교 식이, 영수증, 사업자 서류, 개인 리뷰 계정을 불필요하게 요구하지 않는다.

### RES-P07. 반증 조건을 먼저 쓴다

연구 시작 전에 어떤 관찰이면 가설을 약화·기각할지 기록한다. 결과를 본 뒤 성공 기준을 바꾸지 않는다.

### RES-P08. 작은 표본을 시장 비율로 표현하지 않는다

정성 연구는 문제와 패턴을 발견하는 데 사용한다. 비율·시장 크기는 적절한 표본과 정량 설계로 별도 검증한다.

---

## 3. 현재 핵심 가설

### H1. 신뢰 문제

사용자는 별점 숫자 하나보다 최근성, 사진, 자신과 비슷한 취향, 방문 맥락, 광고 여부를 조합해 신뢰를 판단한다.

반증 신호:

- 기존 지도 앱 점수만으로 대부분의 고의도 결정을 충분히 완료
- 추가 근거가 있어도 확인하지 않음
- 설명이 선택 confidence를 높이지 않고 오히려 복잡성만 증가

### H2. 한국형 지점 원장의 가치

폐업·이전·영업시간·메뉴·지점 구분의 정확성이 좋은 리뷰만큼 중요하다.

반증 신호:

- 데이터 오류가 실제 결정 실패에 거의 영향을 주지 않음
- 사용자에게 기존 공급자 대비 차이를 느끼게 할 수 없음
- 정확성 유지 비용이 가치보다 지속적으로 큼

### H3. 리뷰 맥락

방문 시점, 주문 메뉴, 인원·목적, 가격, 방문 인증을 구조화하면 리뷰의 유용성이 높아진다.

반증 신호:

- 작성 부담으로 완료율이 크게 떨어짐
- 읽는 사용자가 맥락을 거의 사용하지 않음
- 민감·사생활 위험이 효용보다 큼

### H4. 점수 보정 설명

리뷰 수가 적은 극단 점수와 조작을 그대로 평균내지 않는다는 짧은 설명은 신뢰를 높일 수 있다.

반증 신호:

- 보정이 `플랫폼이 마음대로 바꾼 점수`로 강하게 인식
- 사용자에게 필요한 의사결정 정보보다 수학 설명이 앞섬
- 공개 평균과 보정 점수의 혼동을 해결할 표현이 없음

### H5. 저장과 개인 기록

공개 reviewer가 아니어도 `가고 싶은 곳`, `다녀온 곳`, private note가 재방문 가치를 만든다.

반증 신호:

- 사용자가 기존 지도·메모·SNS 저장을 옮길 이유가 없음
- 초기 빈 목록·데이터 이식 비용 때문에 가치 도달이 늦음
- private 기록과 공개 review 경계가 혼란

### H6. 점주 가치

점주는 광고보다 정확한 기본 정보, 리뷰 반론권, 예약 운영, 통합된 변경 workflow에 먼저 가치를 느낀다.

반증 신호:

- 점주가 claim·정보 관리에 시간을 쓸 의향이 거의 없음
- 이미 사용하는 도구 대비 중복 작업만 늘어남
- 리뷰 platform 자체에 대한 불신으로 참여 거부

### H7. 예약

사용자는 신뢰 가능한 탐색과 실제 예약 가능성이 한 흐름에 있을 때 전환한다. 점주는 oversell 없이 기존 전화·외부 예약과 공존할 수 있어야 한다.

반증 신호:

- 사용자는 음식점 발견 후 익숙한 외부 예약 채널로 항상 이동
- 점주가 재고 동기화 없이 새 채널을 운영할 수 없음
- 취소·노쇼·수수료 부담이 확보 가능한 수요보다 큼

### H8. 도락 브랜드

`도락`과 `좋은 식당을 찾는 즐거움`은 품격은 있으나 경직되지 않고, 한국 음식 탐색 서비스로 기억될 수 있다.

반증 신호:

- 뜻을 이해하지 못하거나 다른 업종으로 인식
- 발음·검색·영문 표기 recall이 낮음
- 젊은 사용자에게 지나치게 오래되거나 고가 식당 전용으로 보임

---

## 4. 연구 질문 지도

| 결정 | 알아야 할 것 | 적합한 방법 |
| --- | --- | --- |
| 첫 지역 | 외식 빈도, 공급 coverage, 점주 접근, 탐색 실패 | desk data + 인터뷰 + field audit |
| 홈 구조 | 재방문 목적, 현재 진행 중인 intent | diary + concept test |
| 검색 결과 | 신뢰 판단 단서, 필터, 지도/list 전환 | task observation + prototype |
| 지점 상세 | 점수·리뷰·메뉴·영업·예약 우선순위 | first-click + think-aloud |
| 리뷰 작성 | 부담, 민감성, 사진·메뉴·인증 | contextual test + diary |
| 점수 설명 | 이해·공정성·confidence | comprehension interview + survey |
| 저장·리스트 | 기존 습관·migration·privacy | interview + longitudinal diary |
| 점주 claim | 동기·증빙·역할·보안 | owner interview + service blueprint |
| 리뷰 분쟁 | 반론권·안전·운영 처리 | owner/user interview + case simulation |
| 예약 | 재고·변경·취소·연락처 workflow | field study + tabletop |
| 광고 | label 인식·organic 혼동 | unmoderated comprehension + accessibility |
| 어워드 | badge 의미·독립성·오인 | concept comparison + survey |
| 외국인 | 주소·메뉴·번역·예약 장애 | journey interview + field task |

---

## 5. 대상 세그먼트

### 5.1 소비자 행동 기준

나이·성별만으로 나누지 않는다.

```text
저빈도 실용 탐색자
생활권 반복 탐색자
새로운 식당 발견형
목적형 예약 사용자
혼밥·즉시 방문 사용자
그룹 결정 주도자
가족·접근성·식이 제약 고려자
국내 여행자
한국 방문 외국인
```

### 5.2 리뷰 기여자

```text
리뷰를 거의 쓰지 않음
사진·짧은 평만 남김
지도 앱 상위 기여자
블로그·SNS 장문 작성자
특정 장르 집중 reviewer
부정 경험 후에만 작성
초대·협찬 경험이 있음
```

### 5.3 점주·직원

```text
독립 1개 지점 owner
소규모 다지점 운영자
franchisee
본사·관리회사
예약 담당 manager
홀 직원·전화 예약 담당
마케팅·대행사
신규 개업·폐업·이전 경험
리뷰 분쟁 경험
```

### 5.4 운영자

```text
음식점 원장 검수
점주 claim 심사
리뷰 moderation
고객지원·예약 분쟁
fraud·평점 integrity
광고 심사
```

실제 운영팀이 아직 없다면 유사 업무 경험자를 인터뷰하고 설계팀이 case simulation을 수행하되, 그것을 production 검증으로 과장하지 않는다.

---

## 6. 표본 전략

### 6.1 정성 연구

한 round 후보:

```text
핵심 세그먼트당 5~8명에서 반복 패턴 탐색
희귀·고위험 세그먼트는 목적 표집
새로운 패턴이 계속 나오면 추가 모집
```

이 숫자는 통계 대표성을 뜻하지 않는다. 문제 발견 포화와 결정 위험으로 조정한다.

### 6.2 정량 연구

표본 수는 다음을 바탕으로 사전 계산한다.

- 검정할 effect size
- baseline
- confidence·power
- segment 비교 수
- multiple comparison
- 예상 응답 품질·탈락

`100명 정도` 같은 관행적 숫자로 시장 비율을 확정하지 않는다.

### 6.3 다양성

- 서울 중심·미식 관심자만 과대표집하지 않음
- 수도권 외 지역
- 가격대·장르·외식 빈도
- Android/iOS·웹 사용
- 시각·운동·인지 접근성 요구
- 한국어가 주언어가 아닌 사용자
- 플랫폼 리뷰에 부정적 경험이 있는 점주·사용자

민감 특성은 연구 목적에 필요한 경우에만 선택적으로 수집한다.

---

## 7. 모집

### 채널

- 리서치 panel
- 지역 커뮤니티
- 음식점 업계 단체·소개
- 기존 제품 waitlist, 있을 경우
- 현장 intercept, 장소 허가 후
- reviewer 공개 연락보다 opt-in 모집

### screener 원칙

- 연구 목적을 숨기는 deception 최소화
- 정답이 보이는 leading question 금지
- 최근 행동 기준
- 점주 권한·역할 확인
- 광고·플랫폼 종사자 quota 또는 제외
- 개인정보 최소화

### 예시 소비자 screener

```text
최근 4주 외식 횟수 범주
최근 식당을 찾은 상황
사용한 서비스 종류
예약 경험
리뷰 작성 빈도
주로 찾는 지역 범주
접근성·언어 지원 필요, 선택
리서치·외식 플랫폼 종사 여부
```

### 예시 점주 screener

```text
업종·지점 수·운영 기간
본인의 역할
정보·리뷰·예약 관리 도구
전화/현장/외부 예약 비중 범주
리뷰 분쟁 경험
광고·구독 사용 경험
의사결정 권한
```

사업자등록증을 일반 인터뷰 참가 확인용으로 요구하지 않는다.

---

## 8. 동의·보상·개인정보

### 8.1 참가자 동의

연구 전 설명:

- 주최자와 목적
- 진행 내용·시간
- 녹음·화면·사진 여부
- 수집 정보와 사용
- 내부 공유·외부 공급자
- 보존·파기
- 익명화의 한계
- 질문 거절·중단 권리
- 보상 조건
- 문의·삭제 요청 경로

제품 약관 동의와 연구 참여 동의를 합치지 않는다.

### 8.2 녹음

- 녹음 필수 여부와 대안
- 회의 도구 cloud 저장 위치
- transcript 공급자와 국외 이전
- 관찰자 이름·역할
- 화면에 알림·연락처가 보이면 pause
- 자동 요약·AI 학습 사용 여부

### 8.3 보상

- 시간·부담·전문성에 합리적
- 연구 결과나 긍정 의견과 무관
- 중도 중단에도 참여 시간 기준 지급
- 점주에게 광고 credit을 보상으로 주지 않음
- 세무·지급 개인정보 최소화

### 8.4 민감 상황

영수증·예약·리뷰 분쟁·사업 매출 화면 공유를 요구할 때 sample·redaction·가상 data를 우선한다. 실제 직원·고객 개인정보가 노출되면 연구 기록에서 제거한다.

### 8.5 보존

```text
연락처/모집: scheduling 후 짧은 기간
동의 기록: 필요한 증빙 기간
원본 녹음: 분석 완료 후 제한 기간
transcript: 비식별화 후 연구 목적 기간
highlight clip: 별도 동의·접근
insight: 개인과 분리된 장기 지식
```

정확한 기간은 privacy·법률 검토 후 research registry에 기록한다.

---

## 9. 연구 repository

### 9.1 study record

```text
study_id
decision owner
research questions
hypotheses and disconfirming evidence
method
participant criteria
plan and script version
consent version
dates
raw data locations/retention
findings
limitations
decisions and follow-ups
```

### 9.2 participant 분리

연락처·지급 정보와 transcript·research ID를 분리한다. 제품 account ID를 기본 연구 식별자로 사용하지 않는다.

### 9.3 접근

- raw recording: research core
- transcript: 승인된 team
- clips: 목적별 제한
- finding report: 넓은 내부 공유 가능
- 점주 경쟁정보·예약자 정보: 별도 고도 제한

### 9.4 인용문

인용문은 편집 과정에서 의미를 바꾸지 않는다. 직접 식별자·희귀 업종·지역 조합을 일반화하고, 외부 마케팅 사용에는 별도 동의를 검토한다.

---

## 10. 탐색 인터뷰

### 10.1 소비자 인터뷰 흐름

1. 최근 기억나는 외식 결정
2. trigger와 함께한 사람
3. 첫 검색어·앱·채널
4. 후보를 만든 과정
5. 탈락시킨 이유
6. 신뢰·불신 단서
7. 메뉴·가격·영업·거리 확인
8. 예약·전화·길찾기
9. 방문 결과와 기대 차이
10. 저장·리뷰·공유 행동

### 피해야 할 질문

```text
별점이 조작된 것 같죠?
더 공정한 점수가 있으면 좋겠죠?
이 앱을 월 몇 번 쓰실 것 같나요?
```

### 좋은 follow-up

```text
그때 실제로 어떤 화면을 보셨나요?
무엇 때문에 이 후보를 제외했나요?
그 정보가 없었다면 어떻게 했을까요?
마지막으로 점수를 믿지 않았던 때는 언제인가요?
```

### 10.2 artifact elicitation

참가자의 최근 저장 목록·검색 history·공유 대화를 보여 달라고 강요하지 않는다. 원하면 개인정보를 가리고 본인이 설명하게 하거나 가상 reconstruction을 사용한다.

---

## 11. 점주 현장 연구

### 11.1 service blueprint

하루 흐름을 관찰한다.

```text
오픈 준비
영업시간·휴무 변경
전화·메시지·외부 앱 예약
좌석 배정
메뉴·품절·가격 변경
리뷰 확인·답변
노쇼·취소·환불
마감·정산
직원 교대·권한
```

### 11.2 관찰 원칙

- 매장·직원 동의와 고객 privacy
- peak hour 운영 방해 최소화
- 고객 화면·전화번호·결제 정보 촬영 금지
- 직원 개인 performance 평가로 사용하지 않음
- 시스템 오류와 workaround를 실제 순서로 기록

### 11.3 확인할 위험

- 공유 계정과 퇴사자 접근
- 종이·전화 예약의 동기화
- 임시 휴무·품절 반영 시간
- 지점·본사·대행사 권한 충돌
- 리뷰 답글 승인
- 고객 연락처 bulk view
- deposit·환불 책임
- 여러 태블릿·불안정 네트워크

---

## 12. 운영자 simulation

실제 운영 UI 구현 전에도 realistic case packet으로 검증한다.

### case 후보

- 동일 상호의 다른 지점 merge 후보
- 이전 vs 재개업
- 점주 claim 충돌
- 리뷰 개인정보 신고
- 명예훼손 주장과 작성자 소명
- 협찬 미표시 리뷰
- 영수증 중복 방문 인증
- 예약 중복·결제 unknown
- 광고 creative와 실제 혜택 불일치
- award 선정 후 폐업

### 측정

```text
correct decision
time to decision
required context found
unnecessary personal data viewed
handoff count
reason-code consistency
confidence
appeal reproducibility
```

### 결과

정책 ambiguity, 데이터 누락, UI 문제, 교육 문제, 인력 capacity를 분리한다. 운영자가 workaround로 해결했다고 설계 성공으로 보지 않는다.

---

## 13. concept test

### 13.1 목적

시각 완성도보다 가치 proposition과 mental model을 비교한다.

후보 concept:

```text
A. 신뢰 가능한 점수와 리뷰 맥락
B. 정확한 한국 음식점 원장과 검색
C. 개인 식도락 기록과 발견
D. 탐색부터 예약까지 한 흐름
```

### 13.2 방법

- concept 순서 무작위
- 같은 fidelity
- 설명 전 첫인상
- `무엇을 할 수 있는 서비스인지` teach-back
- 최근 실제 상황에 적용
- 장점·우려·대체재
- 강제 ranking 후 이유

### 13.3 성공 판단

`좋아요` 수가 아니라:

- 해결하는 문제를 정확히 설명
- 최근 행동에 연결
- 기존 대체재보다 바뀌는 행동
- 신뢰 우려
- 가장 먼저 써볼 과제
- 지불·기여·재방문의 현실성

---

## 14. 브랜드 연구

### 14.1 자극물

- `도락 / DORAK`
- `좋은 식당을 찾는 즐거움`
- wordmark 방향
- clay·paper·forest 시각 tone
- 실제 검색·상세 screen 문맥

### 14.2 질문

- 무엇을 하는 서비스로 보이는가
- 발음·철자·기억
- 기대하는 가격대·음식 범위
- 오래됨·젊음·권위·친근함
- 신뢰와 광고성 인식
- 해외 사용자 발음·검색
- 유사 브랜드 혼동

### 14.3 함정

로고만 보여주고 선호도를 묻지 않는다. 서비스 과제 속에서 이름과 tone이 내용 이해·신뢰를 돕는지 본다. 상표 가능성은 사용자 선호와 별도 법률 조사다.

---

## 15. usability test 공통

### 15.1 과제 원칙

기능 이름을 과제에 넣지 않는다.

나쁜 예:

```text
필터를 눌러 2만원대 라멘을 찾으세요.
```

좋은 예:

```text
금요일 저녁 합정에서 친구 한 명과 먹을 곳을 고르려 합니다.
1인당 약 2만원이고 웨이팅이 너무 긴 곳은 피하고 싶습니다.
```

### 15.2 측정

- task completion
- critical error
- first click
- time on task, 보조
- backtrack·reformulation
- confidence
- 도움 요청
- 이해 설명
- accessibility blocker

### 15.3 moderator

- 설명하거나 가르치기 전에 관찰
- 참가자 탓으로 표현하지 않음
- 침묵을 성급히 채우지 않음
- 한 과제 실패 후 다른 과제에 답을 누설하지 않음
- 관찰자 질문은 moderator를 통해

---

## 16. 탐색·검색 test

### task set

```text
정확한 상호 검색
동네+장르 탐색
초성·오탈자
지도 이동 후 이 지역 검색
현재 영업·늦은 밤
가격·인원·예약 가능
동명 지점 구분
폐업·이전 확인
외국어/로마자 query
```

### 비교할 UI

- list first vs map first
- 공개 점수+confidence 정보 수준
- 리뷰 수·최근성·방문 인증 표현
- 광고 label·placement
- 필터 chip·active state
- zero result·query correction

### 성공 기준 후보

- 사용자가 올바른 branch를 선택
- 광고를 광고로 식별
- 현재 영업과 예약 가능을 혼동하지 않음
- score와 review count의 의미를 설명
- 지도 이동이 검색 scope를 어떻게 바꿨는지 이해

정확한 threshold는 pilot baseline 후 정한다.

---

## 17. 지점 상세 test

### 시나리오

- 처음 가는 데이트 식당
- 지금 근처 혼밥
- 가족과 예약
- 알레르기 정보 확인
- 높은 점수지만 리뷰가 적은 곳
- 낮지는 않지만 논쟁적인 리뷰가 많은 곳
- 임시 휴무 가능성

### 관찰

- 첫 시선과 scroll
- 상호·지점·주소 확인
- 점수·분포·리뷰 최근성
- 메뉴·가격·사진
- 점주 공식 정보와 사용자 정보 구분
- 광고·award·예약 badge 구분
- 전화·길찾기·저장·예약

### teach-back

```text
이 점수는 무엇을 뜻한다고 생각하셨나요?
이 정보 중 누가 제공한 것은 무엇인가요?
오늘 실제로 갈 수 있다는 확신은 어느 정도인가요?
광고나 유료 관계가 있다고 느낀 부분은 어디인가요?
```

---

## 18. 리뷰 작성 test

### 흐름

```text
branch 선택
visit date/context
ordered items
rating
text/photo
visit verification optional
relationship disclosure
preview/publish
edit/delete
```

### 질문

- 필수·선택으로 느끼는 항목
- 민감하거나 기억하기 어려운 항목
- 리뷰를 중단하는 지점
- 별점과 재방문 의사의 관계
- 사진 권리·인물·영수증 이해
- 협찬·초대 disclosure 이해
- 공개 profile과 private visit의 경계

### instrument

- step별 completion·drop
- 평균 입력 길이만 품질로 보지 않음
- skipped context
- privacy hesitation
- upload failure recovery
- edit 후 번역·점수 영향 이해

### diary

실제 방문 직후와 며칠 뒤 작성 의향·기억 차이를 비교할 수 있다. 참가자에게 리뷰를 긍정적으로 작성하도록 요구하지 않는다.

---

## 19. 점수·랭킹 comprehension

### 비교 설명

```text
A. 별점 평균만 표시
B. 도락 점수 + 리뷰 수
C. 도락 점수 + "리뷰 수와 신뢰도를 반영"
D. 점수 + 분포·confidence 보조
```

### 질문

- 4.8/리뷰 3개와 4.3/리뷰 200개 선택
- 점수 차이가 얼마나 의미 있다고 보는지
- `보정`을 어떻게 이해하는지
- 광고 구매가 영향을 준다고 의심하는지
- 새 식당이 불리하다고 느끼는지
- 자기 리뷰가 왜 즉시 점수를 움직이지 않는지

### 평가

- factual comprehension
- perceived fairness
- trust
- decision confidence
- explanation burden
- manipulation suspicion

설명이 신뢰를 높이지 않더라도 투명성에 필요한 최소 정보는 유지할 수 있다. 선호도 하나로 정책을 결정하지 않는다.

---

## 20. 저장·리스트 longitudinal study

2~4주 후보 diary:

- 새 식당을 발견한 순간
- 어떤 앱에 저장했는지
- 저장 이유와 note
- 다시 찾은 계기
- 실제 방문·삭제·공유
- 목록 정리 부담
- partner/friend와 공동 결정

prototype은 participants가 real planning에 쓰되 개인 연락처·정확한 집 위치를 연구팀에 공유하지 않도록 한다.

검증할 것:

- 빈 상태에서 첫 가치까지 시간
- quick save vs detailed list
- private 기본값
- import 욕구와 공급자 제한
- reminder·notification의 가치와 피로
- 방문 후 상태 전환

---

## 21. 점주 claim test

### 과제

- 지점 찾기·claim 시작
- 조직 생성·구성원 초대
- 증빙 제출
- 분쟁·추가 자료
- 승인 후 영업시간 변경
- 퇴사자 제거·owner 이전

### 핵심 질문

- 왜 claim할 것인가
- 어떤 증빙을 안전하다고 보는가
- 본사·가맹점·대행사 중 권한
- 공개·비공개 정보 구분
- 처리 기간 기대
- 유료 기능으로 오인하는지
- 거절·분쟁 설명의 이해

### 안전

실제 사업자등록증 대신 redacted sample을 사용한다. production-like prototype이 실제 서류를 업로드받지 않게 한다.

---

## 22. 예약 연구

### 소비자 journey

```text
탐색 -> availability -> slot -> party/contact
 -> deposit/policy -> confirmation
 -> change/cancel -> arrival -> completion/review
```

### 점주 journey

```text
service period/resource setup
 -> phone/external inventory
 -> request/confirm/change
 -> seating/no-show/completion
 -> refund/reconciliation
```

### tabletop cases

- 두 사용자가 마지막 테이블 동시 hold
- 결제 성공 callback 지연
- 점주가 다른 시간 제안
- 인원 증가
- 영업일 임시 휴무
- 사용자·점주 취소 주장 충돌
- no-show와 실제 방문 분쟁
- 연락처를 직원이 export

### 성공 기준

- 양쪽이 현재 상태와 다음 행동을 설명
- 금액·deadline·환불을 checkout 전에 이해
- 변경 제안이 확정으로 오인되지 않음
- 연락처 사용 범위 이해
- 시스템 unknown에서 중복 결제·예약을 만들지 않음

---

## 23. 광고·구독 연구

### 사용자

- 광고 label을 첫 노출에서 식별
- organic 점수와 광고 관계를 설명
- 지도 pin·추천 module에서도 인식
- 반복 숨기기·신고 발견
- sponsor editorial 이해

### 점주

- 무료 claim과 유료 feature 경계
- campaign objective·예산·유효 click
- 보고서 해석
- 무효 traffic credit
- 구독 해지·grace·data access
- `돈을 내면 평점이 오름` 기대 여부

### 금지된 유도

점주 인터뷰 중 선정·리뷰 삭제·점수 영향 가능성을 sales benefit처럼 암시하지 않는다.

---

## 24. 외국인 journey 연구

현지 field task 후보:

- 로마자 상호로 검색
- 한국 주소를 택시·지도에 사용
- 메뉴·가격·알레르기 확인
- 영업시간·브레이크타임 이해
- 전화 없이 예약
- 취소 정책·시간대·통화
- 리뷰 번역과 원문 확인

참가자의 국적을 언어 능력과 동일시하지 않는다. 한국 거주 기간·한국어 사용·여행 상황을 행동 문맥으로 본다.

---

## 25. 접근성 연구

### 포함할 사용자

- screen reader 사용자
- 확대·저시력
- keyboard/switch 입력
- 색각 다양성
- 인지·읽기 부담
- 청각 정보가 필요한 flow, 향후 영상

### 핵심 과제

- 검색·filter·지도 대체 목록
- 점수·광고·award 이해
- 사진 carousel·alt
- 리뷰 작성·오류 복구
- 예약 slot·결제·취소
- 개인정보·동의·권리 행사
- 언어 전환

자동 accessibility audit를 실제 사용자 연구 대체로 사용하지 않는다. 참가자에게 보조기기 setup을 바꾸도록 요구하기보다 익숙한 환경에서 진행한다.

---

## 26. survey 설계

### 목적

정성 연구에서 발견한 패턴의 규모, segment 차이, 우선순위를 확인한다.

### 규칙

- 하나의 문항에 하나의 개념
- 양방향 균형 척도
- `모름/해당 없음` 허용
- 무작위화 가능한 항목 순서
- leading·이중 부정 금지
- 과거 구체 기간
- 응답 시간·straight-lining·attention 품질
- mobile preview
- 한국어 인지 interview와 번역 검수

### 예시 측정

```text
최근 외식 탐색 빈도
결정 실패 유형
사용 정보의 중요도와 실제 확인
점수 신뢰
리뷰 작성 행동
저장·예약 방식
점주 platform 사용·비용
브랜드 recall
```

### 금지 해석

`있으면 좋다` 응답을 retention·지불 의향으로 직접 전환하지 않는다. conjoint·가격 민감도·실제 행동 실험이 필요한 결정은 별도 설계한다.

---

## 27. analytics와 리서치 결합

### triangulation

```text
interview says users want X
prototype shows whether X is found/understood
analytics shows actual use/drop-off
support cases reveal failure severity
field research reveals operational cost
```

### 연결 원칙

- 참가자의 개별 제품 행동을 동의 없이 광범위하게 연결하지 않음
- qualitative finding에 aggregate funnel을 연결
- event schema가 사용자 intent를 완전히 대표한다고 가정하지 않음
- 숫자와 인용문이 충돌하면 원인을 조사
- experiment metric과 long-term trust guardrail

### 핵심 journey funnel 후보

```text
search_started
 -> result_considered
 -> branch_detail_viewed
 -> trusted_dining_decision
 -> reservation/direction/save
 -> visit evidence
 -> review or revisit
```

`trusted_dining_decision` 정의는 [ANALYTICS.md](./ANALYTICS.md)와 일치시킨다.

---

## 28. finding 작성

### 구조

```text
finding statement
observed evidence
segments/context
frequency within this sample, not population
severity
confidence
counterevidence
limitations
affected decisions
recommendation/options
```

### severity

```text
critical: 거래·권리·안전·핵심 task 불가
high: 다수 또는 핵심 segment의 task 실패
medium: 우회 가능하지만 신뢰·효율 저하
low: polish·선호 차이
```

### confidence

표본 크기만으로 정하지 않는다.

- 여러 방법·segment에서 반복
- 행동과 발언 일치
- 반대 증거
- 질문·prototype bias
- 실제 문맥과 fidelity

### evidence hygiene

기억에 남는 한 명의 강한 의견이 전체 finding이 되지 않게 원 note와 counterexample을 함께 본다.

---

## 29. 결정 기록

각 연구 후 제품 owner는 다음을 기록한다.

```text
decision
evidence used
alternatives
what changed
what did not change and why
risks
next validation
owner/date
```

결정 유형:

```text
proceed
proceed with conditions
prototype again
narrow scope
defer
stop
needs quantitative validation
needs legal/security/operations review
```

리서치가 자동으로 제품 결정을 내리지 않는다. 결정자가 evidence를 무시할 수는 있지만 이유를 명시한다.

---

## 30. 첫 12주 연구 프로그램

### 1~2주: setup

- 가설·decision map 정리
- consent·retention·repository
- 소비자·점주 screener
- 최근 외식 journey interview pilot
- 브랜드·concept stimulus

### 3~4주: 문제 탐색

- 소비자 3~4개 행동 segment
- reviewer 기여자
- 독립점·다지점 점주
- 실제 음식점 정보 field audit
- initial synthesis

### 5~6주: 검색·상세 prototype

- 정확 상호·동네·지도·필터 task
- 점수·리뷰 맥락 comprehension
- 광고·점주 공식 정보 label
- accessibility early session
- prototype revision

### 7~8주: 리뷰·저장

- review writing/context/disclosure
- private save/list concept
- 2주 mini diary 시작
- moderation case simulation

### 9~10주: 점주·운영

- claim·정보 수정 prototype
- 현장 예약 workflow
- 조직·권한 test
- 원장·분쟁 운영 tabletop

### 11~12주: 수렴

- concept·brand comparison
- diary 종료
- risk·opportunity map
- Foundation MVP 범위 결정
- 정량 survey 필요성·표본 계획
- 다음 quarter research backlog

실제 일정은 recruitment와 prototype 준비를 반영해 조정하되, 결과를 기다리지 않고 이미 정한 출시를 정당화하는 형식으로 만들지 않는다.

---

## 31. 단계별 research gate

### Foundation

필수:

- 외식 탐색 journey와 신뢰 단서
- 원장 오류의 실제 severity
- 검색·상세 핵심 과제
- 점주 정보 수정·claim 동기
- 브랜드 기본 이해

### Trust

- 리뷰 작성 부담·맥락 가치
- 점수·보정 이해
- 방문 인증 privacy
- 신고·appeal expectation
- reviewer contribution motivation

### Transaction

- 사용자·점주 예약 service blueprint
- checkout·취소·변경 comprehension
- 연락처·deposit 신뢰
- failure tabletop

### Growth

- 추천 제어·설명
- 광고 label과 점주 광고 value
- 구독 가격·entitlement
- notification 피로
- market별 expansion

### Awards

- 점수·인기·추천·광고·선정 차이
- 선정 방법 이해
- 독립성 신뢰
- badge·mark 오인
- 미선정의 의미

---

## 32. 리서치 운영 지표

연구팀 생산량보다 의사결정 품질을 본다.

```text
critical decisions with evidence before commitment
research-to-decision cycle time
repeated issue escape rate
participant segment coverage
privacy/consent incident
findings later contradicted and why
operational issues found pre-launch
accessibility blockers closed
```

인터뷰 수·report 수를 성과의 주 지표로 사용하지 않는다.

---

## 33. research debt

시간 때문에 검증하지 못한 가정을 숨기지 않는다.

```text
assumption
risk if wrong
evidence currently available
temporary safeguard
owner
deadline/trigger
planned method
```

예:

- 영어 관광객 예약 flow 미검증 → 영어 예약 출시 제한
- 점주 multi-branch 권한 미검증 → 소수 pilot·수동 승인
- 광고 map pin 인식 미검증 → 광고 surface 미출시
- 점수 설명 정량 미검증 → 제한 cohort·feedback

---

## 34. 테스트 환경과 prototype 데이터

- 실제 사용자·점주 개인정보를 production에서 복사하지 않음
- 합성 branch·review·reservation fixture
- 실제 상호를 쓰면 공개 사실과 허구 데이터 혼합을 명시
- 결제는 sandbox
- upload는 가짜 영수증·서류
- 지도 위치는 참가자 집이 아닌 공공 장소
- prototype analytics는 별도 consent·retention
- test 계정과 production 계정 분리
- research build expiration

prototype이 실제 예약·리뷰 게시·점주 claim을 수행하는 것으로 오인되지 않게 표시한다.

---

## 35. 연구 보안·윤리 incident

### 후보

- 녹음 link 오공유
- 참가자 실제 예약·결제·영수증 노출
- 점주가 경쟁점 confidential 정보를 공유
- moderator가 법률·평점 결과를 약속
- 연구 참가자 harassment
- 미성년 참가자 동의 문제
- AI transcript가 승인되지 않은 학습에 사용

### 대응

1. 수집·접근 중단
2. research owner·privacy/security 통지
3. 영향 자료와 참가자 확인
4. 삭제·회수·vendor 요청
5. 필요한 참가자 통지
6. 원인·프로세스 수정
7. 연구 재개 승인

---

## 36. 출시 체크리스트

### study 준비

- [ ] 질문이 실제 제품 결정을 연결한다.
- [ ] 가설과 반증 조건이 기록됐다.
- [ ] 참가자 기준과 제외 이유가 적절하다.
- [ ] script가 leading question을 피한다.
- [ ] consent·녹음·보상·보존이 승인됐다.
- [ ] prototype이 production action을 만들지 않는다.

### 실행

- [ ] 참가자의 중단·질문 거절 권리를 설명한다.
- [ ] 개인정보 노출 시 pause·redact한다.
- [ ] 관찰자·녹음 도구를 고지한다.
- [ ] moderator가 제품을 방어하거나 가르치지 않는다.
- [ ] 접근성·언어 지원을 제공한다.
- [ ] 보상이 긍정적 의견과 무관하다.

### 분석

- [ ] 원 note와 finding을 추적할 수 있다.
- [ ] counterevidence와 limitations가 포함된다.
- [ ] 작은 표본 비율을 시장 수치로 표현하지 않는다.
- [ ] 행동·발언·analytics를 구분한다.
- [ ] 직접 식별정보가 보고서에서 제거된다.

### 결정

- [ ] owner가 proceed·defer·stop 결정을 기록한다.
- [ ] 해결책이 아닌 문제 severity가 반영된다.
- [ ] 미검증 가정이 research debt에 남는다.
- [ ] 법률·보안·운영 issue가 적절히 escalation된다.
- [ ] 참가자 데이터 파기 schedule이 실행된다.

---

## 37. 미결정 사항

- 첫 리서치 지역과 소비자 생활권
- 초기 recruitment channel·예산
- 참가자 보상표와 지급 vendor
- 연구 녹음·transcript tool
- 외국인 participant 언어 우선순위
- 접근성 연구 partner
- 점주 현장 관찰의 영업시간 범위
- 리뷰 diary prototype fidelity
- 정량 survey의 첫 decision과 effect size
- research repository 도구·권한
- 익명화된 clip의 내부 보존기간
- 연구 참가자 pool 재접촉 동의 방식

---

## 38. 연관 문서

- [PRODUCT.md](./PRODUCT.md)
- [ROADMAP.md](./ROADMAP.md)
- [ANALYTICS.md](./ANALYTICS.md)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [RECOMMENDATION_SYSTEM.md](../features/RECOMMENDATION_SYSTEM.md)
- [ADVERTISING_MONETIZATION.md](../features/ADVERTISING_MONETIZATION.md)
- [EDITORIAL_AWARDS.md](../features/EDITORIAL_AWARDS.md)
- [INTERNATIONALIZATION.md](../features/INTERNATIONALIZATION.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [LEGAL_COMPLIANCE_CHECKLIST.md](../policies/LEGAL_COMPLIANCE_CHECKLIST.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
