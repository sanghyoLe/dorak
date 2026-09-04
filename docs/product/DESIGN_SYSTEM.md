# 도락 브랜드·제품 디자인 시스템

> 상태: 방향 제안 v0.1  
> 제품: 소비자 앱·공개 웹·점주 콘솔·운영자 콘솔  
> 브랜드 문장: 좋은 식당을 찾는 즐거움  
> 시각 방향: 한국 도시의 식도락 필드노트 × 길찾기 표식  
> 연관 문서: [PRODUCT.md](./PRODUCT.md), [GLOSSARY.md](./GLOSSARY.md), [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)

---

## 1. 디자인 목표

도락은 음식 사진을 빠르게 소비시키는 앱보다 ‘어디를 왜 선택할지’ 판단하게 돕는 도구여야 한다.

디자인 목표:

- 상호, 장르, 위치, 영업 상태, 점수 근거가 사진보다 먼저 이해된다.
- 점수 하나를 과장하지 않고 리뷰의 맥락과 불확실성을 보여 준다.
- 광고, 공식 점주 정보, 사용자 경험을 한눈에 구분한다.
- 검색→비교→저장→방문→기록의 흐름이 끊기지 않는다.
- 한국어의 긴 상호·주소·리뷰가 좁은 모바일 화면에서도 잘 읽힌다.
- 소비자 앱의 정서와 점주·운영 도구의 정확성이 같은 시스템에서 공존한다.
- 도락만의 고유한 인상을 만들되 정보 밀도를 희생하지 않는다.

---

## 2. 피해야 할 인상

- 배달 할인 배너가 가득한 커머스 앱
- 별 다섯 개와 금색을 남발하는 리뷰 사이트
- 사진만 크게 보이고 상호·상태가 묻히는 SNS 피드
- 보라색 gradient와 둥근 카드가 반복되는 일반적인 AI 제품
- 전통문양·한지 질감을 표면적으로 붙인 관광 앱
- 일본 서비스의 표, 배지, 문구를 그대로 모방한 화면
- 지도 위에 모든 정보를 겹쳐 놓은 복잡한 지역 검색 앱
- 운영자만 이해할 수 있는 위험 색상과 내부 코드 중심 콘솔

---

## 3. 브랜드 성격

### 3.1 핵심 성격

| 성격 | 의미 | 피해야 할 반대 극단 |
|---|---|---|
| 안목 있는 | 근거를 정리해 좋은 선택을 돕는다 | 권위적·엘리트주의 |
| 탐구적인 | 골목과 장르를 깊게 발견한다 | 정보 과잉·수집 집착 |
| 정직한 | 광고·불확실성·이해관계를 숨기지 않는다 | 차갑고 방어적 |
| 담백한 | 음식과 글을 주인공으로 둔다 | 밋밋하고 무표정 |
| 사람다운 | 방문자의 목소리와 점주의 사정을 존중한다 | 친한 척하는 과도한 구어체 |

### 3.2 목소리

도락은 단정하지만 딱딱하지 않다.

```text
좋음: 오늘은 17:30부터 영업해요
피함: 현재 영업시간이 아닙니다

좋음: 아직 리뷰가 적어 점수가 크게 달라질 수 있어요
피함: 신뢰도 낮음

좋음: 광고로 소개된 음식점이에요
피함: PR / 추천 / HOT

좋음: 예약은 취소됐고, 환불은 처리 중이에요
피함: 취소 완료
```

### 3.3 문장 규칙

- 사용자 행동을 주어로 쓴다.
- 한자어와 내부 상태 코드를 줄인다.
- 실패 원인과 다음 행동을 함께 말한다.
- `최고`, `무조건`, `인생 맛집`을 서비스 목소리로 사용하지 않는다.
- 점주와 리뷰어 어느 한쪽을 유죄로 전제하지 않는다.
- 시각·금액·인원은 모호한 상대 표현보다 정확한 값을 우선한다.

---

## 4. 시각 콘셉트

### 4.1 식도락 필드노트

식당을 발견하고 방문하고 기록하는 과정에서 나온 요소를 사용한다.

- 지도 위의 작은 좌표 표식
- 노트의 여백과 얇은 구분선
- 날짜·장르·지역의 index label
- 방문 도장처럼 제한적으로 쓰는 상태 mark
- 사진 밑의 짧은 caption
- 리뷰의 본문 중심 editorial rhythm

종이 texture를 배경 이미지로 반복하지 않는다. 따뜻한 paper 색과 여백, 활자 구조만 빌린다.

### 4.2 길찾기 표식

검색과 지도의 기능적 요소를 브랜드 문법으로 연결한다.

- `ㄷ`의 열린 사각 형태
- 장소를 감싸는 frame
- 출발→도착을 암시하는 짧은 line
- 지점·장르를 분류하는 작은 tab
- 현재 위치가 아니라 ‘선택한 장소’에 초점을 둔 marker

### 4.3 의도적인 대비

```text
따뜻한 paper surface
× 짙은 먹색 type
× clay red action
× forest green verification
```

식욕을 자극하는 빨간색을 전체 배경에 쓰지 않고 선택·행동의 명확한 표식으로 제한한다.

---

## 5. 이름과 로고 방향

### 5.1 워드마크

`도락` 한글을 우선하고 `DORAK`은 다국어·법적 보조 표기로 사용한다.

요구:

- 작은 앱 아이콘에서도 첫 음절 `도` 또는 고유 symbol이 구분된다.
- 너무 전통 서예적이거나 일본 음식 전문 앱처럼 보이지 않는다.
- 한글 워드마크와 영문 워드마크가 같은 기하 리듬을 가진다.
- 흑백 단색에서도 동작한다.

### 5.2 symbol 제안

최종 로고가 아니라 디자인 탐색 기준이다.

**Open bowl-route**

- `ㄷ`의 열린 형태를 그릇·지도 경로로 동시에 읽는다.
- 열린 한쪽은 새로운 장소로 이어지는 길이다.
- 내부의 작은 점은 식당 위치 또는 한 끼의 기록이다.
- pin 아이콘을 그대로 복제하지 않는다.

### 5.3 검증

- 16px favicon
- 24px navigation
- iOS/Android icon mask
- 한글을 모르는 사용자 인지
- 지도 marker와 혼동 여부
- 음식 배달·술·여행 브랜드와 유사성
- 상표·도메인 검토

### 5.4 사용 금지

- 별 5개를 로고에 넣기
- 수저·젓가락·셰프 모자를 조합한 일반 음식 아이콘
- 타베로그의 색·타이포·구조를 연상시키는 모방
- 붓글씨로 ‘한국적’ 인상을 단순화

---

## 6. 색상

### 6.1 Light palette

| token | 값 | 용도 |
|---|---|---|
| `paper.canvas` | `#F6F0E4` | 기본 배경 |
| `paper.surface` | `#FFFCF5` | 읽기 surface, sheet |
| `paper.sunken` | `#ECE3D3` | 필터·보조 영역 |
| `ink.primary` | `#1E1B16` | 본문·제목 |
| `ink.secondary` | `#625D54` | 보조 정보 |
| `line.default` | `#D8CEBE` | 구분선 |
| `line.strong` | `#AFA392` | 강한 경계 |
| `clay.primary` | `#B63A24` | 주 행동·선택 |
| `clay.strong` | `#8F2C1B` | hover/pressed |
| `forest.primary` | `#1F6A4E` | 인증·영업·긍정 상태 |
| `brass.primary` | `#A36B00` | 주의·특별 표식 |
| `blue.focus` | `#1557A0` | focus·링크·정보 |
| `danger.primary` | `#A6262E` | 파괴적 행동·오류 |

### 6.2 Dark palette

| token | 값 | 용도 |
|---|---|---|
| `night.canvas` | `#171512` | 기본 배경 |
| `night.surface` | `#211E19` | surface |
| `night.raised` | `#2D2923` | raised surface |
| `night.text` | `#F7F0E3` | 본문·제목 |
| `night.muted` | `#C3BAAB` | 보조 정보 |
| `night.line` | `#4A4338` | 경계 |
| `night.clay` | `#F07A5A` | 주 행동·선택 |
| `night.forest` | `#7CC6A5` | 인증·긍정 상태 |
| `night.focus` | `#78AFFF` | focus·링크 |

### 6.3 확인된 대비 예

2026-09-02 계산 기준:

| 전경 / 배경 | 대비 |
|---|---:|
| `#1E1B16` / `#F6F0E4` | 15.12:1 |
| `#625D54` / `#F6F0E4` | 5.76:1 |
| white / `#B63A24` | 5.80:1 |
| white / `#1F6A4E` | 6.50:1 |
| white / `#1557A0` | 7.23:1 |
| `#F7F0E3` / `#171512` | 16.08:1 |
| `#C3BAAB` / `#171512` | 9.49:1 |
| `#F07A5A` / `#171512` | 6.63:1 |

실제 component의 font size·weight·state에서도 WCAG 기준을 다시 검증한다.

### 6.4 색상 규칙

- clay는 주 행동과 현재 선택에 집중한다.
- forest는 방문 인증, 영업, 완료처럼 긍정적 사실에 사용한다.
- brass는 평점 자체가 아니라 주의·정보 최신성·editorial highlight에 제한한다.
- 별점과 광고에 같은 gold를 쓰지 않는다.
- 빨강/초록만으로 영업 상태·성공·실패를 구분하지 않는다.
- 데이터 시각화는 brand palette를 그대로 순서형 scale로 사용하지 않는다.

### 6.5 음식 사진과 색

사진이 이미 강한 색을 제공한다. UI surface는 사진과 경쟁하지 않는다. 사진 위 text overlay는 피하고 필요한 경우 별도 solid scrim의 대비를 실제 이미지에서 검사한다.

---

## 7. 타이포그래피

### 7.1 기본 글꼴

**UI/body:** Pretendard Variable  
**Editorial accent:** Noto Serif CJK KR 또는 Noto Serif KR 후보  
**숫자·코드:** Pretendard의 tabular numbers, 운영 도구의 제한된 monospace

Pretendard와 Noto CJK는 SIL Open Font License 계열로 배포되는 공식 자료를 확인했으나 실제 bundle·subset·재배포 방식은 구현 시 다시 검토한다.

### 7.2 font stack

```css
--font-sans: "Pretendard Variable", Pretendard,
  -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
  "Noto Sans KR", sans-serif;

--font-serif: "Noto Serif CJK KR", "Noto Serif KR", serif;
```

### 7.3 serif 사용

serif는 다음에만 제한한다.

- 큰 editorial title
- 어워드·장르 guide 제목
- 리뷰 본문의 짧은 pull quote
- 브랜드 캠페인

버튼, 폼, 영업시간, 예약 정책, 운영 콘솔에는 sans를 사용한다.

### 7.4 scale

| style | mobile | desktop | line-height | weight |
|---|---:|---:|---:|---:|
| `display.1` | 36 | 56 | 1.12 | 650 |
| `display.2` | 30 | 44 | 1.15 | 650 |
| `heading.1` | 26 | 34 | 1.2 | 700 |
| `heading.2` | 22 | 28 | 1.25 | 700 |
| `heading.3` | 18 | 22 | 1.35 | 650 |
| `body.large` | 17 | 18 | 1.65 | 400 |
| `body.default` | 16 | 16 | 1.6 | 400 |
| `body.small` | 14 | 14 | 1.5 | 400 |
| `label` | 14 | 14 | 1.35 | 600 |
| `caption` | 12 | 12 | 1.4 | 500 |

단위는 px 기준 시작값이며 모바일 시스템 글자 확대를 막지 않는다.

### 7.5 한국어 조판

- 본문 양쪽 정렬을 사용하지 않는다.
- 단어 중간 강제 줄바꿈을 피한다.
- 상호는 최대 2줄까지 허용하고 지점명을 별도 hierarchy로 분리할 수 있다.
- 주소는 정보 손실보다 줄 수 증가를 선택한다.
- 영어식 uppercase letter spacing을 한글 label에 적용하지 않는다.
- 숫자 표는 tabular numbers를 사용한다.
- 리뷰 본문은 16px/1.6 이상을 기본으로 한다.
- 긴 URL·메뉴명에는 안전한 break 전략을 둔다.

---

## 8. 간격과 레이아웃

### 8.1 spacing scale

4px 기반이지만 모든 간격을 같은 배수로 기계적으로 만들지 않는다.

```text
2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
```

### 8.2 editorial rhythm

- 관련 metadata: 4~8
- label과 value: 8~12
- card 내부: 16~20
- section 사이: 32~48
- 큰 이야기 전환: 64 이상

### 8.3 grid

#### 모바일

- 4 column
- 좌우 gutter 16, 큰 화면 20
- 결과 목록은 full-width row 중심
- 사진이 edge까지 갈 때 text gutter는 유지

#### tablet

- 8 column
- 지도/목록 split 가능
- 상세의 content rail 640~720

#### desktop

- 12 column
- max content 1280~1440
- 공개 리뷰 본문 rail 680~760
- 지도 split: 목록 420~520 + 유연한 지도
- owner/ops: nav 240 + main + optional inspector 320~400

### 8.4 density modes

- 소비자: comfortable
- 점주 예약대장: compact 선택 가능
- 운영자: compact 기본이되 터치·접근성 target 유지

정보를 작게 만드는 것이 compact가 아니다. 여백과 중복 label을 줄인다.

---

## 9. 형태

### 9.1 radius

```text
radius.xs  4
radius.sm  8
radius.md  12
radius.lg  18
radius.round full
```

- 버튼·입력은 8~12
- 큰 sheet는 18
- avatar·작은 status dot만 full round
- 모든 컨테이너를 pill로 만들지 않는다.

### 9.2 border

도락의 정보 구조는 shadow보다 얇은 line과 여백을 우선한다.

- 일반 section: border 없이 spacing
- 목록 분리: 1px line
- 선택: 2px clay/blue outline 또는 좌측 marker
- 입력: 1px line, focus 2px
- 위험 영역: 색 배경보다 label+icon+line

### 9.3 elevation

```text
0: canvas/list
1: sticky bar, small popover
2: menu, floating search
3: modal/sheet
```

그림자는 paper 위에 떠 있는 듯 부드럽고 작은 범위로 사용한다. card마다 shadow를 쓰지 않는다.

---

## 10. 아이콘

### 10.1 스타일

- 1.75px 또는 2px stroke
- 둥글지만 지나치게 귀엽지 않은 corner
- 20/24 기본 grid
- filled state는 현재 선택·저장에 제한
- 텍스트 label을 대체하지 않는 경우가 많음

### 10.2 고유 아이콘 후보

- 도락 marker
- 방문 확인 mark
- 점주 공식 정보 mark
- 이전·폐업 상태
- 예약 승인형/즉시형 구분
- 공개 점수 정보
- 광고 표시

### 10.3 사용 규칙

- 접근성 이름 필수
- tooltip은 keyboard/touch 모두 접근
- 아이콘만 있는 위험 행동 금지
- 저장 heart와 평점 star를 혼동하지 않음
- 검증 check를 공식 점주·방문·결제에 똑같이 쓰지 않고 label 병행

---

## 11. 이미지

### 11.1 사진 역할

사진은 분위기와 메뉴를 이해시키는 증거이자 영감이다. 관련 없는 hero 장식이 아니다.

### 11.2 유형 구분

```text
사용자 사진
점주 공식 사진
도락 editorial 사진
메뉴 원본/스캔
증빙 사진 — 공개 금지
```

### 11.3 비율

- 검색 thumbnail: 4:3
- 메뉴: 1:1 또는 원본 비율
- 상세 gallery: 원본 비율 + 4:3 대표
- editorial: 3:2/16:9 제한적

세로·가로 원본을 강제로 모두 square crop하지 않는다.

### 11.4 placeholder

회색 카메라 icon만 반복하지 않는다.

- paper.sunken 배경
- 장르를 암시하지 않는 고유 line motif
- `사진 없음` text
- 목록 layout이 무너지지 않는 고정 비율

### 11.5 품질·권리 표시

공식/사용자 출처, 촬영 시점, 메뉴 변경 가능성을 필요한 곳에 표시한다. AI 생성·연출 이미지는 실제 메뉴처럼 오해되지 않게 정책 label을 둔다.

---

## 12. 지도

### 12.1 지도와 목록은 동등하다

지도만으로 검색을 완성하지 않는다. 화면 읽기, 키보드, 정보 비교를 위해 항상 결과 목록을 제공한다.

### 12.2 marker

- 기본: 짙은 ink outline + paper fill
- 선택: clay fill + white/ink contrast label
- 저장: 작은 secondary glyph
- 영업 상태: marker 색만 바꾸지 않고 목록 label과 함께
- 광고: 일반 marker 모양을 돈으로 더 크게 만들지 않음

### 12.3 cluster

숫자만 큰 원으로 만들지 않고 지역 밀도를 보여 주되 선택 시 예측 가능한 zoom/list 변화가 있어야 한다.

### 12.4 map sheet

모바일:

```text
상단 floating search
지도
하단 peek result rail
선택 시 한 장의 branch preview
전체 목록 전환
```

여러 작은 card가 지도 위를 가리지 않게 한다.

### 12.5 현재 지도에서 검색

사용자가 지도를 움직인 뒤 명시적으로 재검색하거나 설정에 따라 자동 갱신한다. 영역이 바뀌었다는 사실과 loading을 표시한다.

---

## 13. 공개 점수 표현

### 13.1 점수 하나를 훈장처럼 만들지 않는다

기본 score block:

```text
4.12
도락 점수
유효 리뷰 38 · 방문 확인 71%
최근 계산 9월 1일
[점수가 만들어지는 방식]
```

### 13.2 시각 hierarchy

- 숫자는 크지만 상호보다 크지 않다.
- 별 5개 row를 대표 표현으로 사용하지 않는다.
- 소수점 2자리와 model 표시 정책을 일관되게 유지한다.
- 신규·표본 부족은 점수 대신 설명 상태를 우선할 수 있다.

### 13.3 불확실성

통계 그래프를 강요하지 않고 다음처럼 설명한다.

```text
아직 리뷰가 적어 점수가 달라질 수 있어요
리뷰가 충분히 쌓인 음식점이에요
최근 방문 리뷰가 적어요
```

고급 설명에서는 신뢰 구간·유효 표본을 제공할 수 있다.

### 13.4 세부 평가

맛·서비스·분위기·가격은 bar 또는 distribution으로 보여 주되 서로 다른 질문을 합산한 또 다른 총점을 만들지 않는다.

### 13.5 랭킹

`성수 라멘 7위`의 기준 지역·장르·날짜를 함께 표시한다. 광고 badge와 같은 brass/gold 표현을 쓰지 않는다.

---

## 14. 리뷰 표현

### 14.1 review anatomy

```text
reviewer identity + relevant expertise
visit date + verification label + disclosure
overall rating and dimensions
body
photos/captions
edit state
helpful/report
owner response
```

### 14.2 인증 label

```text
방문 확인
예약 확인
영수증 확인
인증 없음 — 숨기지 않되 낙인화하지 않음
```

정확한 방법 공개가 privacy/abuse 위험이면 통합 label을 사용한다.

### 14.3 이해관계

`초대받아 방문`, `할인 제공`, `점주 관계`를 reviewer metadata와 가까이 둔다. 본문 끝의 작은 각주로 숨기지 않는다.

### 14.4 긴 글

- 줄 길이 45~75자 목표
- 문단 간 0.75em 이상
- 접기 전 최소 의미 단락
- 펼치기 버튼에 현재 상태
- 원문/번역 분리

### 14.5 공식 답글

다른 배경색의 별도 block이 아니라 왼쪽 규칙선과 `점주 공식 답글` label로 연결한다. 리뷰와 시각적 권위를 경쟁시키지 않는다.

---

## 15. 음식점 검색 결과

### 15.1 row 중심

모바일 목록은 둥근 card의 격자가 아니라 비교하기 쉬운 editorial row를 기본으로 한다.

```text
[thumbnail] 상호 + 지점
            장르 · 지역 · 거리
            도락 점수 · 리뷰 수 · 가격대
            오늘 영업/마감 · 예약 방식
            한 줄 evidence snippet
```

row 사이에 line과 충분한 vertical space를 둔다.

### 15.2 정보 우선순위

1. 상호·지점
2. 장르·위치
3. 영업·예약 가능성
4. 공개 점수와 리뷰 근거
5. 가격·편의
6. 사진

사진 없는 지점이 목록에서 과도하게 불리하지 않게 한다.

### 15.3 광고 결과

- `광고` label을 상호와 가까이
- 자연 순번에서 제외
- 자연 결과와 동일한 핵심 사실 구조
- 과장된 gradient/animation 금지
- 같은 지점 자연 결과 중복 정책 명시

### 15.4 선택 상태

지도와 연결된 선택은 배경색만으로 표시하지 않고 좌측 clay marker, outline, `지도에서 선택됨` 접근성 상태를 사용한다.

---

## 16. 음식점 상세

### 16.1 상단 구조

```text
breadcrumb/지역·장르
상호 + 지점명
운영 상태 · 오늘 시간 · 마지막 확인
점수 근거 + 핵심 행동
사진 rail
```

주 행동은 상황에 따라 `예약`, `길찾기`, `저장` 중 하나가 될 수 있지만 세 개를 모두 같은 primary button으로 만들지 않는다.

### 16.2 section 순서

1. 지금 방문 가능한가
2. 무엇을 먹는가
3. 사람들이 어떻게 평가했는가
4. 공간·편의가 어떤가
5. 정확한 위치·정책

### 16.3 sticky action

모바일 하단 sticky bar는 최대 2개 주요 행동 + overflow를 사용한다. 시스템 navigation·keyboard·안전 영역을 침범하지 않는다.

### 16.4 출처와 수정

`점주가 8월 30일 확인`, `사용자 제보 검토 중` 같은 출처·최신성을 정보 가까이에 둔다. 페이지 맨 아래 법적 각주만으로 처리하지 않는다.

---

## 17. 예약 UI

### 17.1 단계

```text
날짜·인원
 -> 시간·코스·좌석 조건
 -> 예약자 정보
 -> 취소·결제 정책
 -> 결제/인증
 -> 서버 최종 상태
```

step 수를 줄이기 위해 정책 확인을 숨기지 않는다.

### 17.2 slot

- 시간은 pill 군집보다 정렬된 grid/list
- 즉시 확정과 승인형 label
- 예약금·이용시간을 선택 전에 표시
- 매진은 disabled만 하지 말고 이유·대기 선택
- 작은 화면에서 가로 scroll만 강요하지 않음

### 17.3 hold

타이머는 긴급성을 과장하는 붉은 countdown이 아니라 `이 시간은 04:32 동안 보관돼요`처럼 설명한다. 시간 연장·접근성·네트워크 복구 정책을 고려한다.

### 17.4 취소 정책

요약과 상세를 함께 제공한다.

```text
9월 11일 18:30까지 무료 취소
이후 예약금 20,000원 중 10,000원 환불
당일 노쇼 환불 없음
```

`동의함` checkbox가 무엇에 동의하는지 label에 명시한다.

### 17.5 결과

- `예약 요청을 보냈어요`
- `예약이 확정됐어요`
- `결제는 확인 중이에요`
- `예약은 취소됐고 환불은 처리 중이에요`

모든 결과를 green success screen으로 만들지 않는다.

### 17.6 변경

기존 조건과 제안 조건을 field-by-field diff로 보여 준다. 시간·인원·가격 차이를 색만으로 표시하지 않는다.

---

## 18. 저장과 목록

### 18.1 저장

한 탭 저장은 기본 비공개 목록으로 들어간다. 저장 icon의 filled 상태와 screen reader 상태를 동기화한다.

### 18.2 목록 cover

사진 collage만 사용하지 않고 제목, 지역·장르 index, 지점 수를 조합한다. 사진 없는 목록도 완성된 인상을 갖는다.

### 18.3 공개 범위

`나만 보기`, `링크 공개`, `전체 공개`를 icon만으로 표시하지 않는다. 변경 시 누가 볼 수 있는지 설명한다.

### 18.4 개인 메모

공개 설명과 명확히 다른 field·surface에 둔다. 공유 화면에서 개인 메모가 절대 직렬화되지 않게 UI와 API 모두 분리한다.

---

## 19. 점주 콘솔

### 19.1 성격

소비자 앱의 따뜻한 paper/ink 언어를 유지하되 밀도와 상태 명확성을 높인다. 소비자 앱을 단순 확대하지 않는다.

### 19.2 홈

 vanity metric보다 오늘 필요한 행동을 먼저 둔다.

```text
승인할 예약 3
오늘 임시 휴무 확인
환불 확인 1
정보 충돌 2
새 리뷰 답글 선택
```

### 19.3 폼

- autosave와 제출/공개를 구분
- 현재 공개 값 vs 제안 값
- resourceVersion 충돌 diff
- sticky save 남발 금지
- section별 저장 상태
- 위험 변경 impact preview

### 19.4 예약대장

타임라인만 제공하지 않고 표/list 대체를 둔다.

- row height density 선택
- 시간·인원·상태·연락 상태
- table/room grouping
- 승인·착석의 keyboard shortcut은 확인 가능하고 재지정 가능
- drag 없이 자원 재배정
- 민감 연락처 기본 마스킹

### 19.5 분석

- 큰 숫자 card 그리드보다 funnel과 추세
- 자연/광고 분리
- 작은 수 숨김을 `데이터 없음`으로 오해하지 않게 설명
- 정의와 마지막 갱신 시각

---

## 20. 운영자 콘솔

### 20.1 성격

정확성, 비교, 이력, 안전한 실행이 우선이다. paper palette를 유지하되 density가 높고 상태 색은 절제한다.

### 20.2 사건 화면

```text
top: priority/status/owner/due
left: target and relationship
center: evidence/timeline
right: policy/next action
bottom: commands with impact preview
```

### 20.3 증거

- 민감 이미지 기본 blur
- 보기 전 목적 확인
- 워터마크
- 원본 자동 재생 금지
- copy/download 제한

### 20.4 위험 행동

예: 지점 병합

```text
"병합" 버튼
 -> 영향 보고서
 -> 충돌 항목
 -> 예약·점주 권한 경고
 -> 기준 지점 확인
 -> 사유/티켓
 -> 추가 인증/이중 승인
 -> 실행 결과
```

단순 `정말 실행하시겠습니까?`만 사용하지 않는다.

### 20.5 상태 색

P0/P1을 계속 붉은 배경으로 채워 감각을 무디게 하지 않는다. 작은 label, icon, 순서, alert region을 함께 사용한다.

---

## 21. 핵심 컴포넌트

### 21.1 Action

변형:

```text
primary
secondary
quiet
danger
link
icon+label
```

한 영역에 primary는 하나를 원칙으로 한다.

### 21.2 Field

```text
label
optional/required text
control
hint
error
character/format constraint
```

placeholder를 label로 사용하지 않는다.

### 21.3 Status label

형태:

- 4px radius, pill 아님
- icon 선택
- text 필수
- tone: neutral/info/success/warning/danger

도메인 상태값을 색 tone 하나에 영구 매핑하지 않는다. 문맥별 의미를 정의한다.

### 21.4 Filter

- 적용 전/후 명확
- removable token은 여러 filter 요약에만 사용
- Boolean filter를 전부 rounded chip으로 만들지 않음
- 결과 수와 zero result 회복
- keyboard와 화면 읽기 상태

### 21.5 Sheet/Modal

- 모바일 선택·필터: bottom sheet
- 파괴적 확인: focused dialog
- 긴 정책: full page 또는 large sheet
- 중첩 modal 금지
- 뒤로가기·escape·focus return

### 21.6 Table/List

- 소비자 list는 editorial row
- 점주·운영은 semantic table 우선
- 모바일에서 row detail 전환
- sticky header, column visibility
- sort와 filter label
- empty/loading/error 유지

### 21.7 Timeline

예약·사건·변경 이력에 공통 사용한다.

```text
timestamp
actor/source
action
reason/status
related version
```

시각 장식보다 audit 읽기 순서를 우선한다.

---

## 22. 상태 화면

### 22.1 loading

- 예상 layout과 유사한 skeleton
- 무한 shimmer 남용 금지
- 예약 명령에서는 spinner와 `처리 중` 의미
- 이전 데이터가 안전하면 stale 표시와 함께 유지

### 22.2 empty

빈 상태 유형을 구분한다.

```text
아직 데이터 없음
필터 때문에 결과 없음
권한 없음
처리 대기
사용자가 아직 만들지 않음
```

각각 다음 행동이 다르다.

### 22.3 error

```text
무슨 일이 있었는지
저장/결제가 됐는지
지금 할 수 있는 행동
자동으로 다시 확인하는지
지원에 필요한 request ID
```

### 22.4 offline

- 저장한 목록·기존 예약 읽기 범위
- 검색·지도 데이터의 마지막 갱신
- 리뷰 draft 로컬 저장
- 예약 확정·취소는 서버 확인 없이는 성공 표시 금지

### 22.5 degraded

검색·사진·예약 같은 부분 장애를 페이지 전체 장애로 만들지 않는다. 안전하게 유지되는 행동과 제한되는 행동을 구분한다.

---

## 23. 모션

### 23.1 원칙

모션은 공간 변화와 상태 결과를 설명한다. 음식 앱의 감정 자극을 위해 bounce·confetti를 남발하지 않는다.

### 23.2 duration

```text
fast: 120ms
standard: 180ms
slow: 260ms
route/sheet: 280~360ms
```

### 23.3 사용

- 저장 icon state
- 목록↔지도 선택 연결
- sheet 진입
- 변경 diff 강조
- 성공 상태의 짧은 확인

### 23.4 금지

- 평점 숫자 count-up으로 과장
- 예약 countdown pulse
- 광고 자동 animation
- 음식 사진 parallax 기본
- 삭제/환불 성공 confetti

### 23.5 reduced motion

OS 설정에서 transform·parallax를 opacity/즉시 전환으로 대체한다. 정보 전달을 animation에만 두지 않는다.

---

## 24. 접근성

### 24.1 목표

웹은 WCAG 2.2 AA 수준을 기본 목표로 하고 네이티브는 동등한 플랫폼 접근성 원칙을 적용한다. 최신 적용 표준과 법적 의무는 출시 전 별도 검토한다.

### 24.2 터치 target

- 최소 44×44 CSS/point 방향
- 밀도 높은 점주 표에서도 보이지 않는 hit area 확보
- 인접 위험 버튼 간격

### 24.3 focus

- `blue.focus` 2px 이상 + offset
- 색상 대비
- modal focus trap/return
- skip link
- 지도 대체 결과로 이동

### 24.4 screen reader

- 상호·점수·영업 상태 읽기 순서
- 광고를 label로 선언
- 저장 toggle 상태
- rating 숫자 의미
- 예약 slot의 시간·방식·금액·가용성
- validation error summary
- live region 남발 금지

### 24.5 cognitive

- 예약·결제 단계와 현재 위치
- 취소 정책의 구체 예
- timeout 연장
- 입력 보존
- 오류 후 다시 입력 최소화
- 내부 코드 대신 행동 문구

### 24.6 지도

지도 marker와 동일 결과를 semantic list로 제공하고 keyboard로 marker를 직접 모두 탐색하지 않아도 목적을 달성하게 한다.

---

## 25. 반응형 전략

### 25.1 화면 크기가 아니라 task로 바꾼다

- 모바일: 현재 위치·즉시 결정·임박 예약
- desktop: 비교·긴 리뷰·점주 대량 운영
- tablet: 지도/목록·예약대장 split

### 25.2 breakpoint 후보

```text
compact < 600
medium 600~1023
wide >= 1024
large >= 1440
```

기기명보다 content가 깨지는 지점에서 조정한다.

### 25.3 container query

search row, score block, review card처럼 재사용 component는 viewport만이 아니라 container 크기로 layout을 바꾼다.

---

## 26. 다크 모드

### 원칙

- 음식 사진을 어둡게 필터링하지 않는다.
- pure black 대신 warm night 사용
- shadow보다 border·surface level
- 상태 색을 light token 그대로 사용하지 않음
- 지도 공급자의 dark style 가독성 검증
- 사용자·시스템 설정 동기화

예약·결제 정책 문서의 긴 text도 dark mode line length와 contrast를 검증한다.

---

## 27. 데이터 시각화

### 27.1 점수 분포

막대 길이 + 숫자 + label을 사용한다. color만으로 단계 구분하지 않는다.

### 27.2 추세

- 자연·광고 separate line/section
- y축을 잘라 과장할 때 명확히 표시
- 데이터 없음과 0 구분
- provisional/degraded 상태
- 작은 수 억제

### 27.3 색상

categorical palette는 인접 대비와 색각 이상을 검증한다. clay/forest/brass를 상태 의미와 동시에 서로 다른 series로 쓰면 혼동될 수 있으므로 chart 전용 token을 둔다.

### 27.4 표 우선

정확한 예약·환불·운영 수치는 차트와 접근 가능한 표를 함께 제공한다.

---

## 28. 디자인 token

### 28.1 계층

```text
primitive
  color.paper.100
  space.4
  radius.8

semantic
  bg.canvas
  text.primary
  action.primary.bg
  status.verified.fg

component
  searchRow.selected.border
  scoreBlock.number.color
  reservationSlot.available.bg
```

컴포넌트가 primitive 색을 직접 사용하기보다 semantic token을 사용한다.

### 28.2 플랫폼 출력

```text
tokens source
 -> CSS variables
 -> TypeScript theme
 -> React Native values
 -> design tool variables
 -> documentation
```

### 28.3 naming

색의 이름이 아니라 역할로 사용한다.

```text
좋음: text.muted, action.danger.bg
피함: gray500, redButton
```

primitive에는 색 이름/단계를 사용할 수 있다.

---

## 29. 컴포넌트 API 원칙

- 의미 있는 variant만 제공한다.
- boolean prop 수십 개보다 composition을 사용한다.
- `asChild` 같은 escape hatch는 접근성 검토를 요구한다.
- icon-only는 accessible label 필수 타입 또는 runtime 경고
- loading이 action label과 폭을 크게 바꾸지 않음
- disabled와 read-only를 구분
- error text ID와 field aria 관계 자동화
- React Native와 web가 동일 이름을 가져도 동작이 다른 경우 문서화

### 예

```tsx
<Action tone="primary">예약하기</Action>
<StatusLabel kind="verified">방문 확인</StatusLabel>
<ScoreSummary score={4.12} evidence={...} />
<BranchRow branch={...} placement="organic" />
```

실제 구현 타입은 OpenAPI와 도메인 상태를 그대로 UI component에 누출하지 않게 view model을 사용한다.

---

## 30. 디자인 문서와 story

각 component는 다음 story를 가져야 한다.

```text
default
long Korean text
English/Japanese locale
large text
keyboard focus
screen reader name
loading
empty
error
disabled/read-only
dark mode
compact/comfortable density
slow data/image
```

점수·예약·권한 component는 도메인 상태 matrix를 추가한다.

---

## 31. 콘텐츠 디자인

### 31.1 상태 문구 pattern

```text
[현재 사실]
[사용자에게 미치는 의미]
[가능한 다음 행동]
```

예:

```text
결제 결과를 확인하고 있어요.
새로 결제하지 말고 잠시 기다려 주세요.
예약 내역에서 자동으로 갱신됩니다.
```

### 31.2 날짜·시간

- `9월 12일(토) 오후 6:30`
- 24시간/12시간 표기는 locale 설정
- 지점 시간대가 사용자와 다르면 명시
- `오늘`, `내일`과 절대 날짜 병행 가능

### 31.3 금액

- `20,000원`
- 총액·1인 가격·예약금 구분
- 취소 전 환불액과 수수료를 별도 줄
- `무료`와 `0원`의 의미 일관화

### 31.4 점수

- `4.12`를 `4.1`과 혼용하지 않는다.
- 리뷰 수와 유효 리뷰 수를 구분한다.
- `상위 1%`는 기준·표본·날짜 없이 사용하지 않는다.

---

## 32. 디자인 리뷰 기준

### 신뢰

- 광고와 자연 결과가 구분되는가
- 공식·사용자·도락 editorial 출처가 구분되는가
- 점수의 근거·표본 부족이 드러나는가
- 성공처럼 보이는 불확실 상태가 없는가

### 행동

- 화면의 primary action이 하나인가
- 위험 행동의 결과가 구체적인가
- 사용자가 되돌리거나 이의할 수 있는가
- offline/degraded에서 거짓 성공이 없는가

### 정보

- 상호·주소·시간이 사진에 가려지지 않는가
- 긴 한국어와 번역에서 hierarchy가 유지되는가
- 상태를 색만으로 구분하지 않는가

### 접근성

- keyboard/screen reader/large text
- focus와 target
- motion
- 지도 대체

### 고유성

- 일반 card grid로 돌아가지 않았는가
- paper/ink/clay/forest가 일관적인가
- 필드노트·길찾기 문법이 기능을 돕는가
- 전통·맛집 cliché에 의존하지 않는가

---

## 33. 구현 순서

### DS0. Foundations

1. brand wordmark exploration
2. color/contrast token
3. type loading/subset
4. spacing/grid/radius
5. icon base
6. focus/motion

### DS1. Primitives

1. Action
2. Field/Select/Checkbox/Radio
3. StatusLabel
4. Sheet/Dialog/Menu
5. List/Table
6. Image
7. Empty/Error

### DS2. Consumer patterns

1. SearchBox/Autocomplete
2. BranchRow
3. MapMarker/Preview
4. ScoreSummary
5. ReviewCard
6. Save/List
7. ReservationSlot/Policy/Status

### DS3. Business patterns

1. Owner navigation/Task
2. OfficialFieldDiff
3. ReservationBoard
4. Analytics chart/table
5. Ops case/timeline/evidence
6. HighRiskAction

### DS4. Validation

1. actual content fixture
2. Korean/English/Japanese
3. device/browser matrix
4. accessibility audit
5. performance/font/image
6. visual regression

---

## 34. 첫 화면 설계 순서

시각적으로 홈부터 만들지 않는다.

1. 검색 결과 row
2. 지도 선택 preview
3. 음식점 상세 header·영업 상태
4. 공개 점수 설명
5. 리뷰 card·이해관계
6. 저장 목록
7. 정보 수정 제보
8. 점주 공식 정보 diff
9. 예약 시간·정책·상태
10. 운영자 지점 병합 impact

이 10개가 시스템의 정보·신뢰·거래 문법을 대부분 검증한다.

---

## 35. 품질 지표

- 검색→상세 작업 성공률
- 영업 상태·광고·예약 방식 이해도
- 점수 근거 설명 후 이해도
- 예약 취소 조건 회상
- 점주 위험 변경 오류율
- 운영자 결정·병합 작업 시간과 재작업
- keyboard/screen reader 핵심 흐름 성공
- large text layout failure
- 디자인 token 외 임의 색·간격 수
- 컴포넌트 중복과 escape hatch 사용량

전환율 개선이 정책 인지·접근성·오류를 악화시키면 성공으로 보지 않는다.

---

## 36. 출시 체크리스트

- [ ] 워드마크·symbol이 흑백, 16px, 앱 icon에서 검증됐다.
- [ ] 상표·유사 브랜드 검토가 완료됐다.
- [ ] 핵심 text/action contrast가 실제 상태별로 검증됐다.
- [ ] Pretendard/Noto의 bundle·license·subset이 확인됐다.
- [ ] 검색 목록이 사진 없는 지점을 불합리하게 낮추지 않는다.
- [ ] 광고, 점주 공식 정보, 사용자 리뷰가 구분된다.
- [ ] 공개 점수가 별점 UI 하나로 축소되지 않는다.
- [ ] 예약 요청·확정·결제 확인 중·환불 중이 서로 다르게 보인다.
- [ ] 지도 모든 핵심 행동에 목록 대체가 있다.
- [ ] 점주 예약 연락처가 기본 마스킹된다.
- [ ] 운영자 고위험 행동에 영향 미리보기와 이중 승인 상태가 있다.
- [ ] 긴 한국어·다국어·큰 글자·dark mode story가 있다.
- [ ] 접근성 수동 검토와 실제 사용자 검증이 있다.
- [ ] 임의 card/pill/shadow 남용이 디자인 리뷰에서 통제된다.

---

## 37. 미결정 사항

- 최종 wordmark와 symbol
- clay/forest palette의 사용자 연구 결과
- editorial serif의 실제 제품 사용 범위
- 웹 font subset과 native bundle 방식
- 지도 공급자 style customization 범위
- 공개 점수 대표 명칭
- 방문 인증 label의 공개 수준
- 사용자 사진과 공식 사진의 기본 gallery 비율
- bottom navigation의 최종 항목
- 점주 콘솔을 별도 native 앱으로 확장할지
- dark mode 초기 출시 여부
- chart 전용 palette

---

## 38. 공식 글꼴 참고

- [Pretendard 공식 저장소와 사용 문서](https://github.com/orioncactus/pretendard)
- [Pretendard SIL Open Font License](https://github.com/orioncactus/pretendard/blob/main/LICENSE)
- [Noto CJK 공식 저장소](https://github.com/notofonts/noto-cjk)
- [Noto Serif CJK 다운로드 안내](https://github.com/googlefonts/noto-cjk/blob/main/Serif/README.md)

---

## 39. 연관 문서

- [PRODUCT.md](./PRODUCT.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [GLOSSARY.md](./GLOSSARY.md)
