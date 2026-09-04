# 도락 국제화·현지화·번역 설계

| 항목 | 내용 |
| --- | --- |
| 문서 상태 | Draft |
| 문서 버전 | 0.1.0 |
| 첫 시장 | 대한민국 |
| 기준 locale | `ko-KR` |
| 주요 독자 | 제품, 앱·웹, API, 검색, 데이터, 콘텐츠, 운영, 법무 |

## 1. 목적

도락은 한국 음식점 데이터를 한국 사용자에게 가장 정확하게 제공하는 것이 첫 목표다. 동시에 외국인 방문자, 외국어 리뷰, 다국어 점주 정보가 들어와도 원문과 의미가 손상되지 않는 기반을 갖춰야 한다.

이 문서는 다음을 정의한다.

- 언어, locale, 지역, 시간대, 통화를 어떻게 구분하는가
- 음식점명·주소·메뉴·리뷰의 원문과 번역을 어떻게 보존하는가
- 자동 번역과 사람 번역의 상태·품질·수정 이력을 어떻게 관리하는가
- 한국어·초성·로마자·외국어 검색을 어떻게 연결하는가
- 앱·웹·알림·예약·점주·운영 화면을 어떻게 현지화하는가
- 시간, 금액, 전화번호, 주소, 이름, 단위를 어떻게 표현하는가
- 잘못된 번역이 예약·알레르기·정책·법률 판단을 바꾸지 않게 어떻게 방어하는가

국제화는 앱 문자열을 영어로 바꾸는 작업이 아니다. 데이터 정체성, 검색 recall, 콘텐츠 신뢰, 법적 동의, 운영 가능성을 함께 설계하는 작업이다.

---

## 2. 범위와 우선순위

### 2.1 초기 범위

- 제품 UI의 기준 언어 `ko-KR`
- 모든 사용자 콘텐츠에 BCP 47 언어 태그 저장 가능
- 한국 음식점명·주소·메뉴의 원문 보존
- 영어 중심의 최소 관광객 UI 후보
- 외국어 리뷰 입력·표시와 선택적 번역
- 언어 중립적인 API 상태·오류 코드
- IANA 시간대와 ISO 통화 코드
- 다국어 확장 가능한 메시지 catalog
- 검색용 alias·로마자·번역명 구조

### 2.2 후속 후보

우선순위는 사용자 조사·유입·운영 역량으로 결정한다.

```text
ko-KR: 전체 제품·정책·운영 기준
en: 관광객 핵심 탐색·상세·예약
ja: 한국 음식점 탐색 수요 검증 후
zh-Hans / zh-Hant: 서로 독립적으로 검토
```

`zh` 하나로 간체·번체를 뭉뚱그리지 않는다. 영어 번역을 다른 언어 번역의 원본으로 연쇄 사용하지 않는다.

### 2.3 초기 비범위

- 모든 리뷰의 선제적 전 언어 번역
- 번역된 리뷰를 원문처럼 색인해 의미 차이를 숨기는 것
- 자동 번역된 알레르기·예약 정책을 법적 확정 정보로 취급
- 국가별 결제·세금·소비자법을 동시에 출시
- 자동 transliteration을 음식점의 공식 외국어 상호로 승격
- 사용자의 국적·민족·언어 능력을 추론

---

## 3. 원칙

### I18N-P01. 원문은 덮어쓰지 않는다

사용자 리뷰, 점주 메뉴, 공식 상호, 정책 원문과 번역은 별도 레코드다. 번역 수정이나 재생성으로 원문을 잃지 않는다.

### I18N-P02. 언어와 locale은 다르다

`ko`는 언어, `ko-KR`은 한국 관습을 포함하는 locale이다. 콘텐츠 언어, UI locale, 지점 국가, 사용자 시간대는 독립 값이다.

### I18N-P03. 구조화된 값은 locale 중립적으로 저장한다

시각은 UTC instant와 IANA timezone, 금액은 minor unit와 통화, 전화는 가능한 경우 E.164, 주소는 구성요소와 원문을 저장하고 표시할 때 현지화한다.

### I18N-P04. 번역임을 알린다

기계 번역은 원문과 구분하고 원문 보기·오류 신고를 제공한다. 번역이 사용자나 점주의 실제 표현인 것처럼 위장하지 않는다.

### I18N-P05. 중요한 의미는 사람 확인을 요구한다

알레르기, 취소·환불, deposit, 식품 안전, 법적 약관, 계정 제재 같은 고위험 문구는 기계 번역만으로 확정하지 않는다.

### I18N-P06. 검색 alias와 표시 이름을 분리한다

자동 로마자·오탈자·번역 alias는 검색 recall을 높일 수 있지만 공개 공식 이름을 자동 변경하지 않는다.

### I18N-P07. fallback은 조용한 오역보다 명확한 원문

신뢰할 수 있는 번역이 없으면 잘못된 근사 번역보다 원문, 언어 표시, 제한된 도움말을 제공한다.

### I18N-P08. locale을 권한·정책 판단에 사용하지 않는다

언어 선택으로 국가, 거주지, 법적 관할, 성인 여부를 단정하지 않는다.

---

## 4. 핵심 개념

| 개념 | 예 | 용도 |
| --- | --- | --- |
| 콘텐츠 언어 | `ko`, `en`, `ja` | 리뷰·메뉴 원문 언어 |
| UI locale | `ko-KR`, `en-US` | 날짜·숫자·메시지 표시 |
| 지역 | `KR` | 지점·법적·상품 시장 문맥 |
| 시간대 | `Asia/Seoul` | 예약·영업시간·알림 |
| 통화 | `KRW` | 가격·결제 원장 |
| 문자 체계 | `Latn`, `Kore`, `Jpan`, `Hans`, `Hant` | 필요한 경우 언어 태그 세분화 |
| 번역 방향 | `ko -> en` | 번역 asset과 model 평가 |

언어 태그는 [BCP 47](https://www.rfc-editor.org/info/rfc5646/) 계열을 사용한다. 등록되지 않은 임의 `kr`, `jp`, `cn`을 언어 코드로 쓰지 않는다.

---

## 5. locale 협상

### 5.1 입력 우선순위

로그인 사용자:

```text
explicit account setting
 -> explicit current-session setting
 -> app/device locale
 -> Accept-Language on web
 -> ko-KR fallback
```

비로그인 사용자:

```text
explicit session/cookie setting
 -> app/device or Accept-Language
 -> ko-KR fallback
```

IP 국가로 언어를 강제하지 않는다. 해외에 있는 한국어 사용자와 한국에 있는 외국어 사용자를 잘못 처리한다.

### 5.2 canonicalization

- BCP 47 문법 검증
- 알려진 alias canonicalization
- 대소문자는 표준 관례로 정규화
- private-use tag의 서버 지원 범위 제한
- 지원 locale과 실제 formatter locale 분리 가능

### 5.3 fallback

예시:

```text
zh-Hant-HK -> zh-Hant -> en -> ko-KR
en-GB -> en -> ko-KR
ja-JP -> ja -> en -> ko-KR
```

실제 fallback chain은 제품·콘텐츠 종류별로 명시한다. 법적 문서는 사용 가능한 공식 번역만 제공하며 일반 UI fallback을 그대로 적용하지 않는다.

### 5.4 응답

- HTML `lang`
- 필요한 부분의 요소별 `lang`
- API에서 resolved locale metadata가 필요한 surface
- cache key에 locale 포함
- CDN `Vary` 폭발을 피하도록 지원 locale을 정규화

---

## 6. UI 메시지 catalog

### 6.1 key

```text
search.no_results.title
reservation.cancel.confirmation
owner.claim.status.pending
review.translation.machine_label
```

영어 문장 자체를 key로 쓰지 않는다. 기능·의미 기반의 안정 key를 사용한다.

### 6.2 금지 패턴

```text
"예약 " + count + "건"
name + "님이 " + branch + "을 저장했습니다"
month + "/" + day
amount + "원"
```

어순·조사·복수·문법이 언어마다 달라 문자열을 조립하지 않는다. ICU/CLDR 기반 message formatting과 named parameter를 사용한다.

### 6.3 parameter

```text
{branchName}
{partySize, number}
{startsAt, datetime}
{amount, number, ::currency/KRW}
```

parameter의 escaping, type, 예시, 개인정보 등급을 catalog metadata에 정의한다.

### 6.4 plural·select

한국어에서 표면상 복수 변화가 적어도 plural 구조를 생략하지 않는다. 다른 locale 추가 시 코드 분기를 새로 만들지 않게 한다.

### 6.5 rich text

번역 문자열 안에 임의 HTML을 넣지 않는다. 안전한 component placeholder와 허용 markup만 사용한다. 번역자가 URL·handler·스타일을 바꾸지 못한다.

---

## 7. 번역 단위와 상태

### 7.1 UI translation unit

```text
message_key
source_locale
source_text
source_version
target_locale
translated_text
status
translator_type
quality/review metadata
```

### 7.2 상태

```text
missing
machine_draft
human_draft
in_review
approved
published
stale
rejected
retired
```

source version이 바뀌면 target을 자동 `stale`로 표시한다. 짧은 punctuation 변경과 의미 변경을 동일하게 처리할지는 diff 정책으로 정한다.

### 7.3 translator type

```text
author
merchant
editor
vendor_human
machine
community
```

출처가 다르면 신뢰와 공개 label이 다르다. 점주가 직접 제공한 영어 메뉴와 도락 기계 번역을 같은 것으로 표시하지 않는다.

### 7.4 translation memory

- 승인된 UI·정책 문구만 재사용 후보
- 사용자 리뷰 문장을 다른 리뷰 번역에 그대로 재사용하지 않음
- 개인정보·영업 비밀이 vendor TM에 남지 않게 계약·삭제 검토
- source·target locale, domain, version, 승인 수준 포함

### 7.5 glossary

도락 용어 예:

```text
지점 / branch
방문 인증 / visit verification
공개 점수 / public score
저장 / save
점주 공식 답글 / owner response
광고 / ad
예약금 / deposit
노쇼 / no-show
```

브랜드명·기능명·법률 용어는 번역자와 모델에 glossary constraint로 제공한다.

---

## 8. 음식점·지점 이름

### 8.1 이름 종류

```text
official_local_name
canonical_display_name
owner_provided_localized_name
editorial_localized_name
source_alias
historical_name
search_transliteration
search_typo_alias
```

### 8.2 우선순위

- 한국 공식 원장·간판 이름은 원문 보존
- 점주 제공 외국어 이름은 authority와 검수 후 표시 후보
- 도락 편집 번역은 출처 표시 가능한 별도 값
- 자동 transliteration은 검색 alias
- 사용자가 많이 검색한 표현은 데이터 검수 없이 공식명이 되지 않음

### 8.3 로마자 표기

기계적 국어 로마자 변환만으로 실제 브랜드 표기를 대체하지 않는다. `오복수산`의 공식 영문명이 존재하면 그것이 자동 변환보다 우선할 수 있다. 공급자별 외국어 이름 충돌은 `data_assertion`으로 처리한다.

### 8.4 표시

외국어 locale에서:

```text
localized display name if authoritative
original Korean name as secondary
branch qualifier
```

사용자가 택시·간판에서 원문을 확인할 수 있게 한국 이름을 완전히 숨기지 않는다.

---

## 9. 주소

### 9.1 저장

```text
country_code
region/locality/sublocality codes
road name
building number
building/floor/unit
postal code
original formatted address
localized formatted variants
coordinates
```

외국식 `address_line1/2`만을 한국 주소의 유일 구조로 사용하지 않는다.

### 9.2 표시

- 한국어는 도로명 주소를 기본 후보로 하고 지번 보조 가능
- 외국어는 구성요소 순서와 transliteration을 locale 규칙에 맞춤
- 건물·층·호수는 번역 중 누락하지 않음
- 길찾기·복사에는 사용자가 현지에서 활용할 원문 주소 제공
- 우편 주소와 지도 출입구 좌표를 구분

### 9.3 검색

- 행정구역 코드가 정체성 기준
- 과거·약칭·로마자 지역명은 alias
- `서울`, `Seoul`, `ソウル`, `首尔/首爾` 후보를 동일 지역으로 연결할 수 있음
- 다의적 지역명은 현재 지도·query 문맥으로 해소

---

## 10. 메뉴와 음식 용어

### 10.1 원문

메뉴 당시의 이름과 가격을 보존한다. 같은 canonical dish에 연결되어도 `평양냉면`, `물냉면`, 고유 상품명을 임의 통합하지 않는다.

### 10.2 번역 계층

```text
owner-provided official translation
editor-reviewed translation
machine translation
canonical dish explanation
```

메뉴명 번역과 음식 설명을 구분한다. 고유 상품명을 일반 음식명으로 잘못 확정하지 않는다.

### 10.3 알레르기·식이

- 점주 원문과 구조화 flag 분리
- 자동 번역에 안전 확정 badge를 부여하지 않음
- `없음`과 `정보 없음` 구분
- 주방 교차 접촉 안내와 성분 보장을 구분
- 사용자에게 매장 확인을 권고해야 하는 범위
- 구조화 allergen code와 표시 번역 version

### 10.4 가격

가격은 번역하지 않고 format한다. 통화 변환 예상액을 제공한다면:

- 원화 원가격이 기준
- 환율 시각·공급자
- 예상치 표시
- 예약·결제 시 실제 청구 통화 명시

---

## 11. 리뷰·사용자 콘텐츠 번역

### 11.1 원문 표시

- 원문 언어 label
- UI locale과 다르면 번역 버튼
- 번역본에서 원문 보기
- 번역 오류 신고
- 작성자가 수정하면 번역 stale

### 11.2 자동 언어 감지

언어 감지는 hint다.

- 작성자 선택과 자동 감지 분리
- 짧은 문장·emoji·상호명은 `und` 가능
- 혼합 언어는 primary와 segment metadata 후보
- 낮은 confidence를 강제 언어로 확정하지 않음
- model version 기록

### 11.3 기계 번역

```text
source content revision
source language and confidence
target locale
provider/model/version
glossary version
translated text
safety result
created/expires/stale
```

### 11.4 의미 보존 위험

- 부정어: `안 맵다`와 `맵다`
- 평점 수치와 가격
- 조건: `주말에는 안 됨`
- 음식 고유명
- 빈정거림·은어
- 법적 주장·욕설·위협
- 인물·점주 이름

원문 moderation 결과를 번역문만으로 뒤집지 않는다. 번역에서 새 위험이 발견되면 원문 언어 검토 queue로 보낸다.

### 11.5 번역 cache

- content revision + target locale + model version key
- 공개 상태가 바뀌면 purge
- 차단·삭제·계정 종료 전파
- 인기 콘텐츠만 선제 생성, 나머지 on demand 후보
- 외부 공급자 삭제·학습 재사용 정책 확인

### 11.6 점수·추천

번역 품질이 리뷰 점수 기여도나 작성자 전문성을 자동 변경하지 않는다. 추천 이유 문구는 안전한 reason code를 locale별 template으로 표현한다.

---

## 12. 검색 국제화

### 12.1 query 이해

```text
original query
Unicode normalization
language/script hints
Korean spacing/jamo/chosung normalization
romanization/transliteration candidates
localized entity aliases
category/dish synonym expansion
geo context
```

### 12.2 Unicode normalization

표시 원문은 보존한다. 검색·식별자 전용 파생값에서 목적에 따라 NFC 또는 제한된 NFKC 계열을 사용한다. compatibility normalization은 정보를 잃을 수 있으므로 사용자 원문에 되쓰지 않는다.

### 12.3 한글

- 완성형·자모 sequence의 canonical equivalence
- 초성 검색
- 띄어쓰기 변형
- 두벌식 오타 후보
- 받침·표기 변형을 무제한 fuzzy로 확장하지 않음

### 12.4 로마자·외국어

- authoritative 외국어 이름 우선
- 여러 transliteration 후보는 낮은 boost alias
- `gukbap`, `gookbap` 같은 실제 query 학습
- 영문 category와 한국 dish 연결
- 일본어·중국어 음식명 synonym은 편집 검수

### 12.5 ranking

- 정확한 공식명·authoritative alias 우선
- transliteration match의 confidence
- 현재 geo와 category 일치
- query language와 표시 label availability
- 번역이 없다는 이유로 좋은 지점을 부당하게 제외하지 않음
- 광고 pipeline은 별도

### 12.6 highlight

정규화·transliteration match를 원문 문자열 byte offset에 직접 적용하지 않는다. grapheme cluster와 analyzer token offset을 사용하고 실패 시 안전하게 highlight를 생략한다.

### 12.7 zero results

잘못된 자동 번역 query로 의미를 바꾸기 전에 사용자가 이해할 수 있는 교정·원문 후보를 보여준다.

---

## 13. 날짜·시간

### 13.1 저장

- 절대 사건: UTC `timestamptz`
- 지점 시간대: IANA ID, 예 `Asia/Seoul`
- 방문 현지 날짜: 별도 local date
- 예약: local service time + timezone + 계산된 instant
- 영업시간: 현지 요일·시간 규칙

### 13.2 표시

UI locale의 날짜 순서·요일·12/24시간 관습을 formatter로 처리한다. DB 문자열을 잘라 직접 조합하지 않는다.

### 13.3 예약

- 사용자 시간대와 지점 시간대가 다르면 지점 현지 시각임을 명시
- API는 instant와 지점 timezone/context 제공
- 알림은 지점 시간과 필요 시 사용자 시간 함께 검토
- 날짜만 있는 예약을 UTC 자정으로 저장하지 않음

### 13.4 DST

한국은 현재 DST를 사용하지 않아도 시스템은 다른 IANA timezone의 nonexistent/ambiguous local time을 테스트한다. timezone rule update 후 미래 예약 instant 재계산 정책을 정한다.

### 13.5 상대 시간

`3분 전`은 편리하지만 예약·취소 deadline·결제에는 절대 시각과 시간대를 함께 제공한다. server/client clock 차이를 고려한다.

---

## 14. 숫자·금액·단위

### 14.1 숫자

- grouping·decimal separator는 locale formatter
- 저장·API 숫자는 locale 문자열이 아님
- 사용자 입력 parse는 허용 locale·범위를 명확히
- 점수 `4.2`의 공개 표현 정책은 locale별 decimal 표시를 검토하되 값은 동일

### 14.2 금액

```text
amount_minor: 15000
currency: KRW
```

KRW가 통상 소수 자릿수가 없다는 현재 관습을 하드코딩한 문자열로 처리하지 않고 통화 metadata·상품 계약을 따른다. 다른 통화의 minor unit도 통화별로 다를 수 있다.

### 14.3 범위

`10,000~20,000원`처럼 하나의 문자열을 원장에 저장하지 않는다.

```text
minimum amount
maximum amount
currency
estimate basis
```

### 14.4 단위

거리, 면적, 중량은 canonical value와 unit을 저장하고 표시에서 변환한다. 음식량의 `1인분`처럼 문화적 단위는 일반 SI 변환과 구분한다.

---

## 15. 전화번호·이름·핸들

### 15.1 전화번호

- 가능한 경우 E.164 canonical 값
- 원본 입력·extension 별도
- 표시 locale과 국가 문맥
- 한국 국내 표기와 국제 dial 가능 표기 구분
- SMS 가능 여부를 번호 형태만으로 확정하지 않음
- masking은 Unicode 숫자·screen reader 고려

### 15.2 사용자 이름

- given/family name 두 칸을 모든 문화에 강제하지 않음
- 공개 display name은 로그인 identity 실명과 분리
- 정렬용 이름과 표시용 이름 분리 가능
- 점주 공식 답글은 개인명이 아닌 조직 표시

### 15.3 handle

- Unicode 허용 범위·normalization·confusable 정책
- 대소문자·정규화 uniqueness
- 사칭과 금지어
- 이전 handle redirect·tombstone
- emoji·combining mark 길이를 byte 수만으로 제한하지 않음

---

## 16. 양방향 텍스트와 layout

초기 지원 locale이 LTR이어도 사용자 리뷰·상호에는 RTL 문자가 들어올 수 있다.

- Unicode bidi isolation
- 사용자 문자열을 UI punctuation과 안전하게 결합
- CSS logical properties
- 아이콘 방향성 구분: 뒤로·진행 화살표는 mirror, 별·사진은 아님
- 숫자·전화·주소 혼합 방향 테스트
- `dir=auto` 적용 범위 검토
- 사용자 입력으로 markup direction을 주입하지 않음

번역 문자열은 한국어보다 길어질 수 있다. 고정 폭 버튼, 이미지에 박힌 문구, 임의 ellipsis를 피하고 200% 확대와 긴 독일어 유사 pseudo locale을 시험한다.

---

## 17. typography와 문자 지원

- 한국어 기준 Pretendard Variable과 Noto Serif CJK KR 정책은 [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)를 따른다.
- Latin·Japanese·Chinese·emoji fallback stack을 명시한다.
- 폰트가 glyph를 지원하지 않아 tofu가 생기는지 확인한다.
- 숫자 폭·가격 table 정렬은 기능에 맞는 tabular figure 후보를 사용한다.
- line breaking, kinsoku, 한글 단어 분리, URL wrap을 locale별 시험한다.
- 임의로 letter spacing을 넣어 한글·아랍 문자 결합을 깨지 않는다.
- 번역문을 이미지로 렌더링하지 않는다.

---

## 18. 접근성

- 문서 기본 언어와 부분 언어를 표시
- screen reader가 외국어 리뷰를 잘못 발음하지 않게 `lang`
- 번역 버튼의 대상 언어·현재 상태를 이름에 포함
- flag emoji를 언어 선택의 유일 표식으로 사용하지 않음
- 언어 이름은 해당 언어 자칭과 현재 UI 설명을 조합 가능
- locale 변경 후 focus·navigation 보존
- 금액·날짜의 시각 축약과 접근 가능한 전체 이름
- RTL focus order와 keyboard navigation
- 광고·기계 번역 label을 색만으로 구분하지 않음

---

## 19. 콘텐츠 moderation

### 19.1 언어 coverage

지원 UI 언어와 moderation 가능한 콘텐츠 언어는 다를 수 있다. 허용하는 모든 사용자 언어에 최소한 신고·긴급 위험 대응 경로가 필요하다.

### 19.2 pipeline

```text
original content
 -> language/script detection
 -> universal deterministic checks
 -> language-capable model/rules
 -> translated reviewer aid if needed
 -> human decision on original context
```

### 19.3 번역 의존 위험

- 번역문만 보고 제재하지 않음
- 욕설·은어·반어의 원언어 문맥
- 이름·음식명이 혐오 표현으로 오탐
- 인용과 작성자 주장 구분
- 모델 coverage가 낮으면 사람 검토·제한적 노출 정책

### 19.4 운영자

- 원문과 번역 나란히 표시
- 번역 공급자·version·confidence
- 중요한 결정은 해당 언어 역량 또는 검증된 통역
- 운영 메모의 기준 언어와 code 중심 reason
- 이의 제기는 사용자가 이해하는 언어로 가능

---

## 20. 예약·거래 현지화

### 20.1 예약 정보

- 지점 현지 날짜·시각
- party size와 어린이/좌석 분류
- 코스·deposit·취소 조건
- 연락 가능한 전화 형식
- 요청 사항 원문과 점주 지원 언어

### 20.2 점주 지원 언어

점주가 지원 가능한 응대 언어를 직접 명시할 수 있다. 사용자가 영어 UI를 쓴다고 지점이 영어 응대를 보장한다고 표시하지 않는다.

### 20.3 번역된 요청

사용자 요청을 자동 번역하면 원문과 번역을 모두 점주에게 제공하고 기계 번역임을 표시한다. 알레르기·장애 지원 요청은 확인 workflow를 추가한다.

### 20.4 정책·동의

- 취소 정책 원본과 공식 번역 version
- checkout에서 실제 적용된 version snapshot
- 번역 미제공 시 사용자가 이해하지 못할 수 있는 거래를 무리하게 확정하지 않음
- 법적 효력·우선 언어 조항은 법률 검토

### 20.5 결제

- 표시 통화와 청구 통화 구분
- 세금·service fee·deposit 구성
- 환율·해외 카드 수수료를 도락이 통제하는 것처럼 표현하지 않음
- invoice·영수증의 locale과 원장 금액 분리

---

## 21. 알림

- notification template도 message catalog와 version 사용
- 예약 시각은 지점 시간대 명시
- SMS length·encoding·분할 비용
- push preview에 민감 예약 정보 최소화
- 사용자의 locale 변경과 예약 당시 정책 언어를 구분
- fallback 번역이 없으면 중요한 거래 알림은 안전한 최소 template
- deep link destination locale 협상
- 마케팅 번역은 법적 표시·수신 거부 문구 검토

템플릿 번역 실패로 보안·예약 알림 자체를 버리지 않는다. 안전한 fallback channel과 운영 경보를 둔다.

---

## 22. 웹·SEO

- locale별 안정 URL 전략
- `hreflang`과 canonical의 일관성
- 번역이 없는 페이지를 빈 locale 복제 페이지로 대량 생성하지 않음
- 서버 렌더와 hydration locale 일치
- 구조화 데이터의 값·언어·통화
- sitemap의 실제 공개 번역만 포함
- 검색 엔진용 자동 번역과 사용자용 번역의 정책 일치
- 사용자 리뷰 원문과 번역의 중복 색인 위험
- locale switch가 동일 branch를 유지

상호의 번역 alias를 URL slug 정체성으로 사용하지 않는다. 안정 branch public ID를 기준으로 한다.

---

## 23. 앱·웹 구현 경계

### 공유

```text
locale registry
message key schema
domain enum labels
formatting wrappers
translation metadata contract
pseudo locales
glossary
```

### client

- locale negotiation·사용자 선택
- formatter와 메시지 렌더
- layout·접근성
- 화면별 lazy message loading
- 번역 상태 label

### server

- language-neutral domain 값
- 콘텐츠 translation selection
- template rendering for email/SMS
- cache·ETag locale variant
- locale 허용 목록과 fallback

서버와 client가 서로 다른 CLDR/formatter version으로 중요한 금액·시간을 다르게 표시하지 않게 compatibility test를 둔다.

---

## 24. API

### 24.1 요청

```text
Accept-Language
explicit locale query only where product needs it
content language on writes
timezone on local-time operations
```

locale을 모든 endpoint의 임의 query로 흩뿌리지 않는다. 계정·세션·header의 precedence를 공통 middleware에서 해결한다.

### 24.2 응답

domain 상태는 번역하지 않는다.

```json
{
  "status": "temporarily_closed",
  "display": {
    "label": "Temporarily closed",
    "locale": "en"
  }
}
```

client 계약은 `status`에 의존하며 `label` 문자열을 분기 조건으로 쓰지 않는다.

### 24.3 localized field

```json
{
  "name": {
    "text": "Myeongdong Kyoja",
    "language": "en",
    "source": "owner",
    "original": {
      "text": "명동교자",
      "language": "ko"
    }
  }
}
```

### 24.4 오류

- 안정 `code`
- localized user message
- field pointer
- safe parameter
- 지원팀용 trace ID

서버 로그는 번역문보다 error code를 사용한다.

---

## 25. 데이터 모델

### 25.1 `localized_text`

모든 테이블에 `name_en`, `name_ja` 열을 추가하지 않는다.

```text
id
target_type / target_id / field_name
source_text_revision
language_tag
text
translation_type
status
provider/model/glossary version
quality metadata
created_by
created_at / reviewed_at / published_at / stale_at
```

검색 hot path는 승인 localized name을 읽기 모델에 비정규화할 수 있다.

### 25.2 `entity_name_variant`

```text
entity type/id
name
language/script
variant_type
authority/source assertion
display eligibility
search eligibility/boost class
valid period
```

### 25.3 `content_translation`

```text
source content type/id/revision
source language
target language/locale
translated text
translator type
model/vendor version
status
safety state
created/expires/stale
```

### 25.4 `ui_message_translation`

```text
message key
source/target locale
source version
text
status
reviewer
release version
```

### 25.5 `locale_preference`

계정 기본 locale, session override, content translation preference를 하나의 모호한 `language` 값으로 합치지 않는다.

---

## 26. 번역 공급자 경계

### 26.1 전송 전

- 콘텐츠 공개/비공개 상태
- 개인정보·연락처·영수증·점주 서류 제거
- source language·target allowlist
- 목적과 사용자의 제어
- 계약상 학습 재사용·보존·국외 이전
- 요청 크기·rate·비용

### 26.2 adapter

```text
TranslationProvider.translate(request)
 -> provider request id
 -> detected language
 -> translated segments
 -> model/version
 -> usage/cost
 -> safe error
```

provider 고유 필드를 domain schema로 누출하지 않는다.

### 26.3 장애

- 원문 정상 제공
- 번역 버튼에 일시 실패와 재시도
- timeout·retry·circuit breaker
- 동일 요청 dedupe
- vendor 전환 시 cache provenance 유지
- 중요한 정책은 기계 fallback 금지

### 26.4 비용

- on-demand + 인기 콘텐츠 cache
- revision 단위 dedupe
- 지원 locale·길이 상한
- bot prefetch로 번역 비용이 발생하지 않게 함
- 번역 hit/miss·문자 수·provider cost

---

## 27. 운영 workflow

### 27.1 UI 번역

```text
source message changed
 -> affected locale marked stale
 -> translator context/screenshots
 -> linguistic review
 -> functional preview
 -> accessibility/legal review if needed
 -> publish by release
```

### 27.2 음식점 데이터

```text
owner/source localized name
 -> provenance and authority check
 -> duplicate/conflict review
 -> display/search eligibility
 -> publish
```

### 27.3 사용자 신고

- 번역이 뜻을 반대로 표현
- 상호·메뉴명 오역
- 불쾌·차별 표현 생성
- 가격·알레르기·예약 조건 오류
- 원문과 관계없는 내용

오류는 source/target/model/glossary 버전에 연결해 유사 번역을 재검토할 수 있게 한다.

---

## 28. 품질 측정

### UI

```text
missing key rate
fallback rate
stale translation age
layout overflow
locale-specific crash
task success by locale
```

### 콘텐츠 번역

```text
translation request/success/latency
cache hit
original-view-after-translation
error report rate
human correction rate
high-risk term accuracy sample
cost per translated character/request
```

### 검색

```text
zero-result rate by query language/script
reformulation
localized alias match share
transliteration precision sample
branch detail conversion
wrong-entity report
```

locale별 지표 차이를 언어 능력이나 사용자 가치의 차이로 단정하지 않는다. coverage·번역·traffic mix를 함께 본다.

---

## 29. 테스트

### 29.1 message

- missing·unknown key
- placeholder 누락·추가·type mismatch
- plural/select 모든 branch
- HTML/script injection
- rich text placeholder 순서
- fallback cycle

### 29.2 pseudo locale

- 30~50% 확장 문자열
- accent·비ASCII
- RTL mirror
- placeholder 보존
- 모든 화면의 hardcoded Korean 탐지

### 29.3 Unicode

- NFC/NFD 한글 동등성
- 자모 sequence
- combining mark와 emoji ZWJ
- confusable handle
- bidi control
- grapheme 기준 truncate
- zero-width 문자 정책

### 29.4 시간·금액

- 자정·월말·연말
- leap day
- DST gap/fold 지역
- 지점·사용자 시간대 차이
- KRW와 소수 minor unit 통화
- 음수·refund·범위
- formatter version snapshot

### 29.5 검색

- 한글·초성·자모·띄어쓰기
- 공식 로마자와 자동 변환 충돌
- 일본어·중국어 alias
- 동명 지점과 지역 해소
- highlight offset
- mixed script spam

### 29.6 E2E

- locale 변경 후 같은 branch 유지
- 외국어 리뷰 작성→번역→수정→stale
- 외국어 사용자 예약→점주 원문·번역 확인
- 예약 취소 조건의 공식 번역
- 알림 deep link와 시간대
- 계정 종료 후 번역 cache 제거

---

## 30. 보안·개인정보

- language preference는 민감할 수 있으며 광고용 민족·국적 추론 금지
- 외부 번역 공급자 전송 전 개인정보 분류
- 비공개 예약 메모·support ticket의 자동 외부 번역 기본 금지
- translation cache의 공개 상태·권한 상속
- 사용자 원문에 포함된 연락처의 번역·로그 확산 방지
- bidi control·confusable·homoglyph abuse 검사
- 번역 관리자와 법률 번역 승인 권한 분리
- vendor credential, request body, response의 logging 최소화
- 삭제·철회가 vendor와 cache까지 전파

---

## 31. 성능과 SLO

### SLO 후보

- UI message catalog 로딩 성공률
- locale 포함 페이지/API latency
- on-demand translation 성공·latency
- 검색 locale analyzer 가용성
- 예약 핵심 공식 번역 availability
- stale translation publish 차단 정확성

### 기능 저하

| 장애 | 사용자 동작 |
| --- | --- |
| UI bundle 실패 | 내장 `ko-KR` 또는 검증된 이전 bundle |
| 콘텐츠 번역 실패 | 원문 제공, 번역 실패 표시 |
| 언어 감지 실패 | `und`, 사용자 선택 허용 |
| localized name 없음 | 공식 원문과 검색 alias |
| formatter 오류 | 안전한 ISO-like 값과 명시 timezone, 거래 화면 경보 |
| 번역 vendor 장애 | queue·circuit break, 원문 기능 유지 |

예약·결제 자체가 장식 번역 서비스 장애 때문에 실패하지 않게 한다. 다만 사용자가 필수 정책을 이해할 공식 번역이 없으면 거래 진행을 제한할 수 있다.

---

## 32. 구현 순서

### L0. 한국어 기반 국제화

- BCP 47 locale registry
- message catalog와 typed key
- locale-neutral 날짜·금액·시간 API
- 원문 language field
- pseudo locale CI
- 한국어 hardcoding 제거

### L1. 데이터·검색 기반

- `entity_name_variant`
- localized name provenance
- 한글·초성·로마자 alias
- 구조화 주소·전화
- content translation model

### L2. 영어 관광객 핵심 흐름 pilot

- 검색·상세·지도·저장
- 영업시간·가격·편의·원문 주소
- 리뷰 on-demand 번역
- 영어 UI 접근성·SEO
- 운영·신고 fallback

### L3. 예약

- 공식 취소·deposit 번역
- 점주 지원 언어
- 요청 원문+번역
- 시간대·전화·결제 표시
- 핵심 거래 E2E

### L4. 추가 언어

- 수요·운영 역량 기준 locale 선택
- 언어별 검색 synonym·moderation coverage
- legal·support readiness
- 번역 품질·비용 gate

### L5. 고도화

- 사람+기계 번역 workflow
- 언어별 추천 설명
- 다국어 editorial
- 국제 시장 진출 시 국가별 제품·법률 별도 설계

---

## 33. 출시 체크리스트

### 기반

- [ ] 콘텐츠 언어·UI locale·지역·시간대가 분리된다.
- [ ] 모든 domain enum과 오류 code는 언어 중립적이다.
- [ ] message placeholder type 검사가 CI에서 동작한다.
- [ ] pseudo locale에서 핵심 화면이 깨지지 않는다.
- [ ] 원문과 번역 version·provenance가 보존된다.

### 데이터·검색

- [ ] 자동 transliteration이 공식 이름을 덮어쓰지 않는다.
- [ ] 원문 한국 이름과 주소를 외국어 화면에서 확인할 수 있다.
- [ ] 한글 NFC/NFD·자모·초성 검색 회귀가 통과한다.
- [ ] localized alias의 source와 display/search 자격이 분리된다.
- [ ] 번역 삭제·stale이 검색 색인에 전파된다.

### 콘텐츠

- [ ] 기계 번역 label과 원문 보기·오류 신고가 있다.
- [ ] 리뷰 수정 시 이전 번역이 stale 처리된다.
- [ ] 번역 공급자의 보존·학습·삭제 조건을 검토한다.
- [ ] 낮은 coverage 언어의 moderation 경로가 있다.
- [ ] 알레르기·예약 정책을 기계 번역만으로 확정하지 않는다.

### 거래

- [ ] 예약 시각에 지점 시간대가 명확하다.
- [ ] 표시 통화와 청구 통화가 구분된다.
- [ ] checkout에 적용 정책 version·공식 번역이 고정된다.
- [ ] SMS·email·push fallback이 locale별 시험된다.
- [ ] 법적 문서 번역과 우선 언어를 법률 검토한다.

---

## 34. 미결정 사항

- 영어 pilot의 정확한 surface 범위
- 일본어·간체·번체의 우선순위
- 리뷰 자동 번역의 기본 on/off와 비용 상한
- 번역 공급자와 국내·국외 처리 구조
- 공식 이름이 없는 경우 editorial 번역의 표시 방식
- 한국 주소 로마자 변환 공급자·규칙
- 메뉴·음식 glossary의 운영 주체
- 언어별 moderation 최소 coverage 기준
- 사용자 content language 수동 선택 UX
- mixed-language 리뷰의 segment 저장 여부
- 광고·추천에서 locale을 사용할 허용 범위
- 국제 결제·세금·소비자법 진출 시 별도 market architecture

---

## 35. 기술 기준과 참고

- [RFC 5646: Tags for Identifying Languages](https://www.rfc-editor.org/info/rfc5646/)
- [Unicode Technical Standard #35: LDML/CLDR](https://unicode.org/reports/tr35/)
- [Unicode Standard Annex #15: Normalization Forms](https://www.unicode.org/reports/tr15/)
- [Unicode Normalization FAQ](https://www.unicode.org/faq/normalization.html)

CLDR data와 formatter library는 릴리스별 결과가 달라질 수 있다. 사용 버전을 lock하고 날짜·금액·collation snapshot test 후 갱신한다.

---

## 36. 연관 문서

- [PRODUCT.md](../product/PRODUCT.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [SEARCH_SYSTEM.md](./SEARCH_SYSTEM.md)
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [RESERVATION_SYSTEM.md](./RESERVATION_SYSTEM.md)
- [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)
- [RECOMMENDATION_SYSTEM.md](./RECOMMENDATION_SYSTEM.md)
- [ADVERTISING_MONETIZATION.md](./ADVERTISING_MONETIZATION.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [GLOSSARY.md](../product/GLOSSARY.md)
