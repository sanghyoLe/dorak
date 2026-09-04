# 도락 소비자 화면 감사 — codex 변경 정리 + AI 냄새 제거

> 상태: 감사 리포트 v0.1 (2026-09-04)
> 대상: `apps/web` 작업 트리(커밋 안 된 변경 포함)
> 기준: hallmark audit (anti-patterns.md 명명 규칙), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) §2 "피해야 할 인상"
> 선행 문서: [UX_IMPROVEMENT_TABELOG.md](./UX_IMPROVEMENT_TABELOG.md)

---

## 1. codex가 바꾼 것 (작업 트리 diff 요약)

UX_IMPROVEMENT_TABELOG.md의 P0 항목 2.1~2.5를 한 번에 구현한 상태다. 커밋되지 않았다.

| 영역 | 변경 | 파일 |
|---|---|---|
| 목록 라우트 | `/r/[[...path]]` 신설. 경로 = `/r/{구}/{장르}`, 쿼리 = `q, neighborhood, price, rating, sort, page`. SSR로 첫 페이지 렌더 | `app/r/[[...path]]/page.tsx` (신규) |
| 구 검색 라우트 | `/search` 페이지도 신규 생성. `/r`과 기능 중복, `q`·`cuisine`만 받음 | `app/search/page.tsx` (신규) |
| API | `district, neighborhood, price(1~4 콤마), rating(최소), sort(default/rating/reviews), page` 파라미터 추가. `limit` 상한 200 → 20 | `app/api/v1/branches/route.ts` |
| 카탈로그 | `BranchSearchOptions` 타입 추출. 메모리·Postgres 양쪽에 필터 4종 + 서버 정렬 3종. 응답 meta에 `page, pageSize, sort` | `packages/domain-types`, `packages/server-catalog/*` |
| 헤더 | 상시 검색창 `HeaderSearch` 추가. 제출 시 `/r?q=` 이동 | `components/header-search.tsx` (신규), `site-header.tsx` |
| Discovery | `mode="home" \| "results"` 분기. results 모드는 모든 필터 변경을 `router.push`로 URL 변경. 무한스크롤 삭제, 이전/다음 페이지네이션. 카드에서 사진 placeholder 열 제거, 순위 번호·영업시간 줄 추가. 가격대·평점 필터 UI 추가. 홈은 20건만 보이고 "전체 결과 보기" 링크 | `components/discovery.tsx` (+673/-295) |
| 홈 | 초기 로드 60 → 20건 | `app/page.tsx` |
| CSS | `.header-search`, `.pagination`, `.restaurant-hours`, 순위 번호 스타일. 카드 그리드에서 사진 열 제거 | `app/globals.css` (+142) |
| 설정 | 개발 모드에서만 CSP `script-src`에 `'unsafe-eval'` 허용 | `next.config.ts` |

### 1.1 변경분에서 발견한 문제 (디자인 아님, 동작)

- **`/search`와 `/r` 중복.** 헤더 검색·홈 검색 모두 `/r`로 가므로 `/search`는 진입점이 없다. 삭제 대상.
- **브레드크럼에 장르 키 원문 노출.** `/r/마포구/japanese`에서 "japanese"가 그대로 표시된다. `cuisineLabel`로 바꿔야 한다. (`app/r/[[...path]]/page.tsx` 브레드크럼 블록)
- **지역 필터 선택 상태가 results 모드에서 표시되지 않는다.** `aria-pressed`가 `query`와 비교하는데 results 모드는 지역을 `initialNeighborhood`/`initialDistrict`로 받는다. 어떤 동을 골라도 눌린 표시가 없다. (`discovery.tsx` FilterControls, 890~904행 부근)
- **홈 모드의 정렬은 여전히 클라이언트 정렬.** results 모드만 서버 정렬. 홈에서 "평점순"을 누르면 20건 안에서만 재정렬된다. 홈에서 정렬 탭을 없애거나 `/r?sort=`로 보내는 게 맞다.
- **페이지네이션이 "1 / 5" + 이전/다음만.** 번호 링크 없음. 개선안 2.3의 "번호 페이지네이션"과 다르다. SEO 목적이면 번호 링크가 있어야 한다.
- **`meta.page`가 `offset/limit`에서 역산.** `limit=20&offset=10`이면 page=1로 나온다. 의미가 안 맞으니 `page` 파라미터를 받았을 때만 채우는 게 안전하다.

---

## 2. AI 냄새 감사 (hallmark audit)

프로젝트에 `.hallmark/log.json`이 있고 `globals.css` 첫 줄에 스탬프가 있다. `design.md`는 없다.

```
/* Hallmark · macrostructure: Ecosystem Index · theme: studied-DNA (tabelog.com/kr)
 * nav: N6 · footer: Ft1 · slop: pass · honest: pass · ... · pre-emit critique: P5 H5 E5 S5 R5 V5 */
```

스탬프가 스스로 만점을 매겨 놓았다. 아래는 실제 화면 기준이다.

### Critical

**[critical] Stamp lies — `app/globals.css:1`**
스탬프는 nav N6(신문 마스트헤드), footer Ft1(마스트형)이라 적혀 있는데 실제 헤더는 "워드마크 왼쪽 · 검색창 · 링크 3개 오른쪽 · 하단 헤어라인"으로 anti-patterns의 "AI nav"(N1a) 형태다. 푸터는 한 줄(Ft2)이다. 스탬프의 pass 표기 전부 자기 인증이다.
→ 스탬프를 실제와 맞추거나 삭제. 이후 감사에서 스탬프를 신뢰하지 않는다.

**[critical] Eyebrow on every section — 홈·목록·상세 전부**
- `discovery.tsx:414` `SEOUL · RESTAURANT INDEX`
- `discovery.tsx:499` `THE WHOLE INDEX`
- `restaurants/[publicId]/page.tsx:128, 180, 261, 286, 366, 392` — "주소와 지도", "방문자의 기록", "한 번의 방문을 구체적으로", "식당 정보", "이 식당의 음식", "리뷰 신뢰 기준"
상세 페이지 6개 섹션 모두 h2 위에 소제목이 붙어 있다. 순서가 있는 내용이 아니므로 장식이다. 특히 한국어 서비스 위에 영어 대문자 + `letter-spacing: 0.08em`(`globals.css:256~265`)은 "편집 디자인처럼 보이려는" 가장 흔한 생성 흔적이다.
→ 전부 삭제. h2만 남긴다. 상세의 "리뷰 N건", "기본 정보", "대표 메뉴"는 그 자체로 충분하다.

### Major

**[major] 안내형 히어로 카피 — `discovery.tsx:414~425`, `globals.css:266~277`**
"오늘 갈 식당, 도락에서 고르세요." + "동네와 음식, 방문자의 기록을 한 번에 살펴보고 내게 맞는 식당을 천천히 고릅니다." 세리프 5.75rem, `letter-spacing: -0.08em`, `line-height: 0.98`. 디렉터리 사이트에 붙은 매니페스토 헤드라인이다. 타베로그는 히어로가 없고 검색이 첫 줄이다.
→ h1을 "서울 식당 N곳" 같은 사실 문장으로 바꾸고 크기를 `--text-xl` 이하로 내린다. 부제 삭제. 검색 폼이 첫 시선.

**[major] 설명문 톤의 카피 전반**
- `discovery.tsx:502` "지역과 메뉴로 좁혀보고, 방문자의 구체적인 기록을 함께 읽습니다."
- `discovery.tsx:792` "검색 버튼을 누르면 결과 페이지로 이동합니다."
- `discovery.tsx:728` "N곳 중 일부를 먼저 보여드리고 있습니다."
- `page.tsx:393` "표시를 구분해 읽어주세요."
UI가 자기 동작을 문장으로 설명한다. 사람이 만든 디렉터리는 이런 문장을 쓰지 않는다. DESIGN_SYSTEM §3.2 "담백한"과도 어긋난다.
→ 삭제하거나 데이터로 바꾼다. "N곳 중 20곳" 처럼 숫자만.

**[major] 가짜 컨트롤 — `discovery.tsx:761~767`, `globals.css:434~470`**
검색 폼의 "지역: 서울 전체" 필드는 아이콘·테두리·라벨이 셀렉트처럼 생겼지만 클릭되지 않는다. 눌러도 아무 일이 없는 입력 모양은 "재현된 크롬"과 같은 부류다.
→ 실제 `<select>`로 구 선택을 붙이거나(개선안 2.1 경로와 연결), 아니면 제거.

**[major] 반복 filler 라벨 — `discovery.tsx:477`**
음식 장르 6개 버튼마다 `<small>찾아보기</small>`. 지역 버튼은 건수를 보여주는데 장르는 채울 숫자가 없어 문구로 채웠다. 채울 데이터가 없으면 비워두는 게 정직하다.
→ `listLocations`처럼 장르별 건수 API를 추가하거나, small 제거.

**[major] 빈 사진 박스를 디자인으로 출하 — `page.tsx:92~99`, `globals.css:1197~1215`**
상세 상단에 12rem 높이 회색 박스, 가운데 "일식 / 사진 정보 없음". 데이터가 없는 자리를 큰 면적으로 남겨 두는 것은 스톡 이미지 자리표시자와 같은 인상을 준다. 목록 카드에서는 codex가 이미 제거했다.
→ 사진 파이프라인 전까지 박스 삭제. 이름·평점·영업정보가 첫 화면.

**[major] Trust strip = proof bar — `discovery.tsx:484~488`, `globals.css:377~395`**
"식당 정보는 출처를 표시합니다 · 리뷰에는 방문일을 남깁니다 · 저장한 식당은 브라우저에 보관됩니다." 클레이색 점으로 이어진 3개 문장 띠. 숫자를 지어내지는 않았지만 "3개 신뢰 문장 가로 배열"은 랜딩페이지 템플릿의 proof bar 자리다.
→ 홈에서 삭제. 이 내용은 `/review-policy`와 상세 사이드바에 이미 있다.

**[major] 장식용 우측 라벨 — `discovery.tsx:565`**
결과 헤딩 오른쪽 `<span>공개 리뷰 기준</span>`. 정보가 아니고 균형 맞추기용 텍스트.
→ 삭제. 정렬 탭 옆에 붙일 정보가 있다면 "N곳" 하나로 충분.

**[major] 폰트 미로딩 — `tokens.css`, `app/layout.tsx`**
`--font-body`가 Pretendard Variable인데 `next/font`도 `@font-face`도 없다. Pretendard가 설치되지 않은 기기(대부분의 Windows·Android)에서는 시스템 sans로 떨어지고, 브랜드 세리프 `Noto Serif KR`도 마찬가지다. 토큰이 약속한 타이포그래피가 실제로는 출하되지 않는다.
→ `next/font/local`로 Pretendard Variable woff2 1개, `next/font/google`로 Noto Serif KR 1개 웨이트. 각 1파일.

**[major] AI nav 형태 — `site-header.tsx`, `globals.css:69~225`**
워드마크 + 태그라인 + 검색 + 우측 링크 3개 + 헤어라인. 스탬프의 N6와 무관하게 SaaS 기본형이다. 다만 식당 디렉터리는 헤더가 검색 도구여야 하므로 형태 자체는 틀리지 않다.
→ 큰 개편보다 정리: "서울 맛집" 링크는 홈과 같은 곳으로 가므로 삭제, "리뷰 원칙"은 푸터로. 헤더 = 로고 · 검색 · 로그인 3요소.

### Minor

**[minor] 세리프 브랜드 워드마크 `letter-spacing: -0.05em` — `globals.css:154~160`**
Noto Serif KR에 음수 자간. 한글 세리프에 타이트한 자간은 라틴 편집 디자인 습관을 그대로 옮긴 것이다. → 자간 0.

**[minor] `home-search`가 우측 정렬 — `globals.css:288~292`**
h1은 왼쪽, 검색 폼은 `margin-inline-start: auto`로 오른쪽. 비대칭 "깨기"를 위한 배치인데 검색이 첫 행동인 페이지에서 시선 흐름을 끊는다. → 왼쪽 정렬, 폼 너비 100%.

**[minor] 평점 숫자 색 = 황동(`--color-brass`) — `globals.css:965~968`**
평점만 별도 금속색. DESIGN_SYSTEM §2 "금색을 남발하는 리뷰 사이트"에 닿아 있다. → `--color-ink`로 두고 등급 라벨만 색을 준다.

**[minor] 홈 결과 리스트 잔존 — `discovery.tsx:592~734`**
홈에 20건 목록 + 필터 사이드바 + "전체 결과 보기". 개선안 2.6은 홈에서 목록을 빼는 방향이다. 지금은 홈과 `/r`이 거의 같은 화면이다.

**[minor] 페이지네이션 표기 "1 / 5"** — 타베로그식 번호 링크 없음. 위 1.1 참조.

### 통과한 것

- 그라디언트·글로우·보라색·아우라 배경 없음. 단색 종이 톤 팔레트, OKLCH 토큰.
- 모션: 4곳, 속성 지정 transition, `prefers-reduced-motion` 처리. `transition-all` 없음.
- 아이콘 lucide 단일. 이모지 없음.
- 지어낸 숫자·후기·로고 없음. 평점 없으면 `—`.
- 카드가 아니라 헤어라인 리스트 행. 3열 아이콘 카드 없음.
- 곡선 따옴표(`“ ”`) 사용.

### 집계

**2 critical · 9 major · 5 minor**
**판정 — 시각 토큰은 건강하나, 카피와 라벨이 "AI가 편집 디자인을 흉내낸" 톤이다. 카피·소제목·빈 박스만 걷어내면 사람이 만든 디렉터리로 읽힌다.**

---

## 3. 제거 순서 (코드 변경 없이 판단만, 실행은 별도)

1. **소제목 8개 삭제** — discovery 2곳, 상세 6곳. CSS `.home-portal__eyebrow`, `.directory-heading__eyebrow`, `.branch-section header > p` 규칙 삭제. 30분.
2. **카피 교체** — 히어로 h1·부제, directory 부제, search-helper, load-more 문구, data-note 제목. 문장 대신 숫자나 삭제. 30분.
3. **빈 요소 삭제** — 상세 사진 박스, trust-strip, "공개 리뷰 기준", 장르 버튼 "찾아보기". 20분.
4. **가짜 지역 필드** — `<select>`로 바꾸어 `/r/{구}` 이동, 또는 삭제. 1시간.
5. **폰트 로딩** — `next/font` 2개. 30분.
6. **스탬프 정정** — 실제 nav/footer 코드와 일치시키고 pass 표기 제거.
7. **1.1의 동작 버그** — 브레드크럼 장르 라벨, 지역 필터 pressed 상태, `/search` 삭제, 홈 정렬 탭.

1~3은 삭제만 있어서 diff가 음수다. 먼저 한다.

---

## 4. 이후 감사 규칙

- 새 섹션에 h2 위 소제목을 붙이지 않는다. 번호가 필요한 순서형 내용에만 허용.
- 데이터가 없는 자리는 문장으로 채우지 않는다. 비우거나 `—`.
- UI가 자기 동작을 설명하는 문장(…하면 …로 이동합니다)을 쓰지 않는다.
- 영어 대문자 라벨은 쓰지 않는다. 한국어 서비스다.
- 스탬프의 pass 표기는 감사 근거로 인정하지 않는다.
