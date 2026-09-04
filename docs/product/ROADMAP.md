# 도락 제품·기술·운영 로드맵

> 상태: 실행안 v0.2  
> 목표: 한국형 음식점 리뷰·랭킹·예약 플랫폼의 전체 범위를 품질 게이트에 따라 구축한다.  
> 일정 기준: 아래 기간은 개인 개발의 방향성 추정이며 고정 출시 약속이 아니다.  
> 연관 문서: [COST_FIRST_ARCHITECTURE.md](../architecture/COST_FIRST_ARCHITECTURE.md), [PRODUCT.md](./PRODUCT.md), [TECH_STACK.md](../architecture/TECH_STACK.md), [OPERATIONS.md](../operations/OPERATIONS.md), [ANALYTICS.md](./ANALYTICS.md)

---

## 1. 로드맵 원칙

### 1.1 제품의 깊이는 유지하고 데이터 범위는 작게 시작한다

최종 범위는 전국 음식점 원장, 리뷰·평점·랭킹, 지도 검색, 소셜, 점주 도구, 예약·결제, 외부 연동을 포함한다. 그러나 개인 프로젝트 단계의 실제 데이터는 선택한 1~2개 생활권과 우선 장르로 제한한다. 기능의 완성도를 얕게 만드는 대신 검증 가능한 지역 안에서 원장·검색·운영 흐름을 끝까지 만든다.

### 1.2 화면보다 원장과 운영을 먼저 만든다

검색 화면을 먼저 만들어도 중복 지점, 폐업, 출처 충돌을 처리할 수 없으면 전국 서비스로 커지지 않는다. 각 사용자 기능은 해당 운영 도구와 같이 출시한다.

### 1.3 시간보다 종료 조건이 우선이다

일정이 됐다는 이유로 다음 단계로 가지 않는다. 정확도, 사건 처리, 권한, 보안, SLO가 정의된 문턱을 넘어야 범위를 넓힌다.

### 1.4 신뢰와 매출을 분리한다

광고·점주 유료 상품을 평점과 자연 검색의 독립성보다 먼저 최적화하지 않는다. 수익 기능에는 자연 결과와의 분리, 사용자 표시, 감사 가능성이 선행된다.

### 1.5 거래는 탐색보다 늦게, 운영은 거래보다 먼저 연다

예약 기능을 출시하기 전에 점주 예약대장, 고객지원 큐, 중복 예약 대응, 거래 알림, 환불 조정이 준비되어야 한다.

### 1.6 고정비 0원을 기본 gate로 둔다

현재 단계는 Vercel Hobby, Neon Free와 PostgreSQL 검색으로 운영한다. 새 유료 서비스는 무료 수단으로 해결할 수 없는 측정된 문제, 예상 월 비용, 제거·이관 계획을 함께 제시한 뒤 추가한다. 무료 한도의 80%에 도달하면 지역 확장을 멈추고 최적화 또는 유료 전환을 결정한다.

---

## 2. 전체 단계

| 단계                | 예상 범위 | 핵심 결과                                            |
| ------------------- | --------: | ---------------------------------------------------- |
| 0. Definition       |     0~6주 | 브랜드·법률·제품·기술 기준과 검증 계획               |
| 1. Data Foundation  |   2~4개월 | 서울 일부 지역의 신뢰 가능한 음식점 원장과 운영 도구 |
| 2. Discovery Alpha  |   2~3개월 | 웹·앱 검색, 지도, 상세, 저장의 폐쇄형 알파           |
| 3. Trust Beta       |   3~5개월 | 리뷰·방문 인증·평점·랭킹·신고의 지역 베타            |
| 4. Merchant Network |   2~4개월 | 점주 claim, 공식 정보, 답글, 분석, 예약대장          |
| 5. Reservation      |   4~7개월 | 승인형→즉시형 예약, 결제·취소·환불                   |
| 6. Network & Growth |      지속 | 리뷰어·리스트·피드·추천·다국어·지역 확장             |
| 7. Platform         |      지속 | 외부 예약/POS, 그룹, 파트너 API, 고급 분석           |

단계는 겹칠 수 있지만 다음 단계의 사용자 공개 범위는 이전 단계 게이트에 의존한다.

---

## 3. 단계 0 — Definition

### 3.1 목적

되돌리기 비용이 큰 브랜드, 법률, 원장 모델, 점수 독립성, 기술 경계를 코드보다 먼저 검증한다.

### 3.2 제품 작업

- 브랜드 `도락 / DORAK`의 의미와 언어별 표기 확정
- 핵심 사용자·점주 인터뷰
- 음식점 선택 여정과 현재 대안 조사
- 경쟁 서비스의 기능이 아닌 불만·운영 공백 분석
- 소비자, 점주, 운영자 정보구조와 프로토타입
- 초기 지역과 장르 선정 기준
- 무료·유료 기능 경계 원칙

### 3.3 브랜드·법률 작업

- KIPRIS 기반 상표 선행 조사와 변리사 검토
- `도락`, `DORAK`, 유사 발음·동종 서비스 충돌 검토
- 도메인, 앱스토어, 소셜 핸들 확보 가능성 확인
- 타베로그와 혼동되지 않는 독립 브랜드·디자인 검토
- 이용약관, 리뷰 정책, 점주 약관의 책임 구조 초안
- 개인정보·위치정보 처리 구조와 신고·동의 검토
- 음식점 공공 데이터의 이용 조건과 재배포 범위 검토
- 지도·장소·사진 공급자 라이선스 검토

### 3.4 기술 작업

- 모노레포와 단일 Next.js 배포 기본 골격
- local·preview·production 환경과 DB credential 경계
- PostgreSQL/PostGIS/`pg_trgm` 로컬 환경
- 인증과 권한 proof of concept
- 음식점 원천 레코드 수집 spike
- 한글 형태소·초성·별칭 검색 품질 spike
- 지도 공급자 비교 spike
- OpenAPI와 이벤트 계약 방식
- CI, 비밀 관리, 기본 관측성

### 3.5 운영 작업

- 데이터 검수, 신고, 점주 인증 사건 모델
- 운영 역할과 최소 권한 매트릭스
- 사건 우선순위와 서비스 목표
- 개인정보 요청 접수 경로
- 초기 데이터 품질 표본 방법

### 3.6 사용자 연구 가설

- 사용자는 단일 별점보다 리뷰 맥락과 신뢰 근거를 원한다.
- 지역·장르별 전문 리뷰어의 기록이 일반 인기순보다 선택에 도움 된다.
- 정확한 영업 상태·대표 메뉴·대기 정보가 점수 못지않게 중요하다.
- 점주는 리뷰 삭제보다 공식 정보·답글·예약 운영의 통합을 필요로 한다.

가설이 틀리면 기능 표현과 순서를 바꾸되 신뢰 독립성 원칙은 유지한다.

### 3.7 종료 조건

- [ ] 브랜드 법률 검토에서 치명적 충돌이 없거나 대체 이름이 정해졌다.
- [ ] 핵심 사용자 15명 이상과 독립 점주 8곳 이상의 정성 연구가 정리되었다.
- [ ] `restaurant`와 `branch`의 샘플 데이터 매핑이 검증되었다.
- [ ] 최소 2개 공공·상업 데이터 출처의 이용 조건이 확인되었다.
- [ ] 한글 검색 spike가 대표 쿼리셋에서 기본 정확도를 보였다.
- [ ] 운영·개인정보·보안 owner가 지정되었다.
- [ ] 핵심 ADR과 위협 모델이 검토되었다.

---

## 4. 단계 1 — Data Foundation

### 4.1 목적

서울의 제한 지역에서 실제 운영 가능한 음식점 원장과 수정 체계를 만든다.

### 4.2 초기 지역 선정

무조건 전국 데이터를 한 번에 공개하지 않는다. 다음 기준으로 2~4개 생활권을 선택한다.

- 음식점 장르 다양성
- 공공 데이터 품질
- 현장 검증 가능성
- 협력 점주 접근성
- 리뷰어 모집 가능성
- 검색 수요
- 프랜차이즈와 독립점 혼합

### 4.3 데이터 파이프라인

- `data_source`, `raw_source_record` 저장
- 상호·주소·전화·좌표 정규화
- 사업자·인허가 매핑
- restaurant/branch 후보 생성
- 중복 후보 탐지
- 영업 상태 정규화
- 카테고리 계층과 동의어
- 영업시간·휴무 표현
- assertion과 출처 신뢰도
- 변경 이력과 transactional outbox

### 4.4 운영자 도구

- 신규 지점 후보 큐
- 필드별 출처 비교
- 중복 병합 미리보기
- 폐업·이전·재개업 처리
- 좌표 지도 검수
- 사용자 수정 제보
- 실행 후 영향 보고서와 감사 로그

### 4.5 품질 기준

초기 표본 목표이며 실제 측정 후 조정한다.

| 항목                         | 베타 공개 목표 |
| ---------------------------- | -------------: |
| 지점 존재·정체성 정확도      |  표본 98% 이상 |
| 중복 지점 비율               |        1% 미만 |
| 좌표가 실제 입구/건물에 유효 |  표본 97% 이상 |
| 핵심 상호·주소 완성          |       99% 이상 |
| 영업 상태 최신성             |  표본 95% 이상 |
| 출처 추적 가능한 공개 필드   |           100% |

숫자를 달성하기 위해 어려운 지점을 표본에서 제외하지 않는다. 지역·장르·출처별 층화 표본을 사용한다.

### 4.6 종료 조건

- [ ] 선택 지역 지점의 핵심 필드 coverage가 목표를 넘는다.
- [ ] 병합·분리·폐업·이전 runbook과 감사 기록이 검증된다.
- [ ] 점주 또는 사용자의 정보 수정 제보가 사건으로 처리된다.
- [ ] 원천 재수집이 수동 수정과 충돌해도 덮어쓰지 않는다.
- [ ] 일일 데이터 품질 대시보드와 샘플 검수 흐름이 있다.
- [ ] 검색용 지점 문서를 재생성할 수 있다.
- [ ] 삭제·보존 정책이 원천 레코드까지 정의된다.

---

## 5. 단계 2 — Discovery Alpha

### 5.1 목적

정확한 지점 데이터를 사용자가 검색, 지도, 상세에서 유용하게 탐색하는지 폐쇄형 알파로 검증한다.

### 5.2 소비자 기능

- 한글 상호·장르·메뉴·지역 통합 검색
- 초성, 띄어쓰기, 로마자, 주요 별칭
- 자동완성
- 현재 지도에서 재검색
- 거리·영업 중·가격·장르·편의 필터
- 음식점 상세
- 영업시간, 메뉴, 사진, 출처·수정 제보
- 저장과 기본 목록
- 길 찾기·전화 연결
- 웹 공유 링크와 SEO 기본 구조

### 5.3 앱·웹 순서

공개 웹과 모바일을 같은 주에 완성하려 하지 않는다.

1. 내부 운영용 웹 상세
2. 공개 웹 검색·상세
3. 반응형 모바일 웹에서 정보구조 검증
4. Expo 앱의 검색·지도·저장
5. 딥링크와 웹↔앱 연결

공개 웹은 검색엔진 유입과 공유를, 앱은 지도·저장·위치 경험을 우선한다.

### 5.4 검색 평가

- 대표·꼬리 쿼리 판단 세트
- 상호, 메뉴, 장르, 지역, 복합 의도별 NDCG/MRR
- 자동완성 성공률
- 결과 없음과 회복률
- 지도 경계와 거리 정확성
- 폐업·휴업 노출 오류
- 관련도에 대한 점수·인기도 영향 상한

### 5.5 성능·접근성

- 검색 p95 목표
- 지도 저사양 기기 성능
- 화면 읽기 도구의 검색·필터·상세 흐름
- 키보드 탐색과 포커스
- 색상만으로 영업 상태나 광고를 구분하지 않음
- 느린 네트워크와 오프라인 상태

### 5.6 알파 집단

- 지역 거주 일반 사용자
- 음식 탐색 빈도가 높은 사용자
- 화면 읽기/확대 사용자
- 외국어 UI 후보 사용자
- 데이터 운영자

### 5.7 종료 조건

- [ ] 판단 쿼리셋의 최소 검색 품질 기준을 충족한다.
- [ ] 검색 결과 없음과 폐업 오노출이 목표 이하이다.
- [ ] 상세에서 저장·길찾기·전화 중 의미 있는 결정 행동이 관찰된다.
- [ ] 지도 이동과 목록 상태가 사용성 테스트를 통과한다.
- [ ] 공개/개인 캐시와 위치정보 처리가 검토된다.
- [ ] 분석 이벤트의 중복·금지 필드 검사가 통과한다.
- [ ] 데이터 수정 제보의 처리 시간이 운영 가능 범위다.

---

## 6. 단계 3 — Trust Beta

### 6.1 목적

누구나 별점을 남기는 기능이 아니라, 방문 맥락과 이해관계가 드러나는 신뢰 가능한 리뷰·평점 생태계를 지역 단위로 만든다.

### 6.2 사용자 기능

- 계정과 공개 프로필
- 방문 기록
- 리뷰 초안·게시·수정 이력
- 음식·서비스·분위기·가격 만족 평가
- 사진 업로드와 처리
- 예약·영수증·QR·위치 기반 방문 인증 후보
- 경제적 이해관계 공개
- 리뷰 유용 반응
- 신고와 이의 제기
- 점수 설명과 리뷰 수·불확실성 표시
- 지역·장르 랭킹

### 6.3 평점 엔진

- 적격성과 공개 상태 분리
- 리뷰어 기준선 보정
- 검증·전문성·최근성·무결성 가중치
- 베이지안 수축과 유효 표본 수
- 모델 버전과 입력 스냅샷
- shadow 계산과 승인 발행
- 개별 리뷰 기여 감사
- 조작 군집 탐지

### 6.4 시드 전략

리뷰를 구매하지 않는다.

- 지역별 공개 모집 리뷰어
- 방문 인증 비용의 중립적 지원, 평점 방향 조건 없음
- 에디터가 작성한 콘텐츠와 사용자 리뷰 명확히 구분
- 행사·초대·할인 관계 의무 공개
- 점주·직원·대행사 리뷰 차단 또는 공개

### 6.5 운영 준비

- 리뷰·사진·프로필 신고 큐
- 임시 노출 제한
- 점주 이의 제기와 공식 답글
- 이의 제기 재검토자 분리
- 영수증·위치 증빙 제한 뷰어
- 유해 콘텐츠 검토자 보호
- 정책 버전별 품질 표본

### 6.6 공개 점수 출시 게이트

점수는 리뷰 기능과 동시에 무조건 공개하지 않는다.

- 최소 데이터 밀도 전에는 리뷰 분포만 표시 가능
- 모델 결과를 내부 shadow로 관찰
- 지역·장르·가격대 편향 검토
- 조작 시나리오 공격 테스트
- 대표 지점의 점수 변화 설명 가능성 확인
- 점수 이의 문의 대응 자료 준비

### 6.7 종료 조건

- [ ] 선택 지역에서 유효 리뷰 밀도가 최소 기준을 넘는다.
- [ ] 방문 인증의 오탐·누락 표본이 측정된다.
- [ ] 평점 모델의 버전·입력·결과를 재현할 수 있다.
- [ ] 광고·점주 계약이 점수 계산에 들어가지 않음을 감사할 수 있다.
- [ ] 신고 처리와 이의 뒤집힘이 안정 범위다.
- [ ] 조작 공격 테스트와 shadow 발행 승인 절차가 통과한다.
- [ ] 계정 삭제·리뷰 익명화·증빙 파기가 end-to-end로 검증된다.

---

## 7. 단계 4 — Merchant Network

### 7.1 목적

점주가 도락 데이터를 신뢰하고 직접 최신화하며, 소비자 신뢰를 해치지 않는 방식으로 고객 접점을 운영하게 한다.

### 7.2 기능

- 사업자·위임 기반 지점 claim
- 조직, 멤버, 지점 범위 역할
- 공식 설명·영업시간·휴무
- 메뉴·가격·공식 사진
- 리뷰 공식 답글과 신고
- 검색 노출·상세·저장·길찾기·전화 집계
- 여러 지점 전환
- 알림과 정보 최신화 요청
- 결제 없는 예약대장 pilot

### 7.3 점주 유료화 전 무료 기반

다음은 신뢰 가능한 원장을 위한 기본 기능이므로 광고 구매를 조건으로 하지 않는다.

- 지점 claim
- 법적·핵심 정보 수정
- 영업시간·휴무
- 기본 메뉴와 대표 사진
- 리뷰 답글·신고
- 계정 보안과 구성원 권한

유료 후보:

- 고급 집계 분석
- 예약·웨이팅 도구
- 대량 지점 관리
- 추가 CRM 기능
- 명확히 표시된 광고

### 7.4 점주 pilot

- 독립점 10~20곳
- 소규모 다점포 2~3개 조직
- 장르·영업 방식 혼합
- 직접 교육과 주간 인터뷰
- 지원 문의를 기능 요구로 구조화

### 7.5 종료 조건

- [ ] claim 승인과 소유권 분쟁 절차가 검증된다.
- [ ] 역할 변경·탈퇴·소유권 이전에 객체 단위 권한 테스트가 통과한다.
- [ ] 점주 수정이 출처 assertion과 공개 검수 정책을 따른다.
- [ ] 예약 연락처를 보기 전에도 예약대장 UX가 유용하다.
- [ ] 점주 분석이 작은 집단의 사용자를 노출하지 않는다.
- [ ] 광고와 자연 노출의 계약·UI·분석 경계가 승인된다.
- [ ] 점주 취소·리뷰 신고 남용의 운영 지표가 있다.

---

## 8. 단계 5 — Reservation

### 8.1 목적

점주와 사용자가 실제로 믿고 사용할 수 있는 예약 거래를 승인형부터 즉시형까지 단계적으로 연다.

### 8.2 R1: 예약대장

- 점주 수동 전화·현장 예약
- 테이블, 룸, 단순 용량 자원
- 정기 가용성·휴무·대관 예외
- 일간 예약 보드
- 역할별 연락처 마스킹
- 거래 알림 기반

### 8.3 R2: 승인형 자체 예약

- 사용자 날짜·시간·인원 조회
- 요청 제출
- 점주 승인·거절 기한
- 변경 제안
- 취소
- 앱·문자 거래 알림
- 결제 없음

### 8.4 R3: 즉시 예약

- 짧은 hold
- 원자적 자원 배정
- 코스·이용 시간
- 동시성·멱등성
- 점주 착석·완료·노쇼
- 예약 기반 방문 인증 후보

### 8.5 R4: 결제

- 예약금 또는 선결제 한 가지 흐름부터
- 결제 의도와 예약 상태 분리
- 취소 견적과 정책 스냅샷
- 전액·부분 환불
- 웹훅 중복·역순 처리
- 결제 성공-예약 없음 자동 조정
- 고액 수동 조정 이중 승인

### 8.6 R5: 웨이팅·외부 연동

- 당일 웨이팅
- 취소 자리 제안
- 외부 예약 ID 매핑
- 채널별 할당 또는 공유 재고
- 파트너 장애 차단과 재조정

### 8.7 거래 출시 게이트

- [ ] 마지막 재고 동시 요청에서 초과 예약 0건이다.
- [ ] 동일 멱등키 재시도가 한 예약·한 결제로 수렴한다.
- [ ] 결제 성공 후 서버 응답 단절 시 자동 복구된다.
- [ ] 취소·환불 금액이 정책 버전으로 재현된다.
- [ ] 주말·야간 임박 예약 지원 체계가 있다.
- [ ] 점주 취소와 중복 예약의 사용자 대응이 훈련된다.
- [ ] 결제·연락처 로그에 개인정보가 남지 않는다.
- [ ] 공급자 장애 시 신규 거래를 안전하게 닫을 수 있다.

---

## 9. 단계 6 — Network & Growth

### 9.1 소셜

- 리뷰어 팔로우
- 공개·비공개 리스트
- 리스트 저장과 공유
- 리뷰어·리스트 피드
- 사용자 차단
- 에디터 컬렉션

댓글은 모더레이션 비용과 괴롭힘 위험을 검증한 후 결정한다.

### 9.2 개인화

- 선호 장르·가격·지역 콜드스타트
- 저장·상세·방문 기반 추천
- 개인화 끄기
- 추천 근거 요약
- 민감 방문 패턴 억제
- 공개 점수는 사용자마다 바꾸지 않음

### 9.3 지역 확장

지역별 출시는 지도 색칠 방식이 아니라 다음 준비도를 기준으로 한다.

```text
data coverage and accuracy
review density
operations capacity
merchant support
search query quality
legal/data-source constraints
reservation support readiness
```

### 9.4 다국어

- 음식점명·주소의 원문과 번역 분리
- 한글을 모르는 사용자의 로마자 검색
- 카테고리·편의시설·영업 상태 번역
- 리뷰 자동 번역 표시와 원문 접근
- 번역 오류 신고
- 해외 전화번호·시간대·결제 지원은 별도 단계

### 9.5 성장 원칙

- 리뷰 작성 보상은 평점 방향과 무관해야 한다.
- 무차별 푸시로 북극성 지표를 부풀리지 않는다.
- 초대와 공유는 공개 범위를 사용자가 이해하게 한다.
- SEO 페이지를 얇은 자동 생성 콘텐츠로 대량 생산하지 않는다.

### 9.6 종료 조건

Network는 종료 단계가 아니지만 기능별로 다음을 요구한다.

- 유지율 상승이 알림 차단·신고를 악화시키지 않는다.
- 추천이 지역·장르 다양성을 과도하게 줄이지 않는다.
- 공개 목록이 비공개 저장·방문을 노출하지 않는다.
- 다국어 결과가 원문 사실을 왜곡하지 않는다.
- 새 지역의 데이터·운영 기준이 기존과 같은 게이트를 통과한다.

---

## 10. 단계 7 — Platform

### 10.1 다점포·프랜차이즈

- 조직 계층과 브랜드 역할
- 지점 템플릿과 예외
- 대량 메뉴·영업시간 변경
- 지점별 권한과 승인 흐름
- 그룹 분석과 작은 수 보호
- 감사·내보내기

### 10.2 파트너 API

- 승인된 장소·영업정보 API
- 예약 가용성·생성·변경
- 서명 웹훅
- client scope와 지점 범위
- 사용량·요금·폐기 정책
- 파트너별 데이터 라이선스

### 10.3 POS·예약 채널

- 지점·자원 ID 매핑
- 착석·완료 신호
- 공유 재고
- 이벤트 역순·중복
- 오프라인 조정
- 파트너별 feature flag와 kill switch

### 10.4 고급 신뢰

- 다계정·점주·대행사 그래프 탐지
- 조작 캠페인 조기 경보
- 설명 가능한 운영 우선순위
- 모델 drift와 공정성 평가
- 광고·점주 관계의 독립성 감사

### 10.5 외부 확장의 원칙

파트너 트래픽 때문에 소비자 예약과 원장 일관성을 희생하지 않는다. 외부 API의 계약, rate limit, 격리, 데이터 권리를 별도 제품으로 관리한다.

---

## 11. 공통 작업 흐름

단계와 무관하게 지속한다.

### 11.1 보안·개인정보

- 위협 모델 갱신
- 의존성·비밀·권한 검토
- 데이터 목록과 보존 작업
- 삭제·내보내기 훈련
- 공급자와 재위탁자 검토
- 침해 대응 tabletop
- 운영자 민감 조회 감사

### 11.2 접근성

- 디자인 시스템 컴포넌트 검사
- 화면 읽기와 키보드 자동·수동 테스트
- 지도 대체 목록
- 모션·색상·텍스트 확대
- 결제·예약의 시간 제한 연장과 오류 복구
- 장애 사용자 연구

### 11.3 신뢰 연구

- 평점 이해도
- 리뷰 인증 표시에 대한 해석
- 광고 구분 인지
- 점주 답글의 유용성
- 추천 근거 이해
- 신고·이의 제기 경험

### 11.4 운영 품질

- 결정 표본 검수
- 이의 뒤집힘
- 지역·광고 여부 편향
- backlog와 서비스 목표
- 자동화 오탐
- runbook과 재해 복구 훈련

### 11.5 비용

- 검색·지도·사진 비용
- 분석 이벤트와 보존
- 문자·결제 공급자
- 운영 건당 비용
- 지점·리뷰당 저장 및 색인 비용
- 예약 거래당 공헌이익

---

## 12. 기술 마일스톤

### T0. 저장소와 기반

```text
pnpm/Turborepo
Next.js App Router: public + /ops + /api
PostgreSQL/PostGIS
PostgreSQL FTS + pg_trgm
GitHub Actions + DB job
OpenAPI packages
Vercel preview + Neon production
```

### T1. 원장

```text
raw ingestion
normalization
entity resolution
assertions/provenance
operator actions
outbox/indexer
audit
```

### T2. 읽기 경험

```text
branch read model
search/autocomplete/map
public web rendering
mobile client
cache/CDN
analytics events
```

### T3. 신뢰

```text
account/identity
visit/review/media
verification
moderation case
rating batch/versioning
ranking snapshots
```

### T4. 점주

```text
organization/RBAC
branch claim
official assertions
owner response
merchant analytics aggregates
```

### T5. 거래

```text
resources/availability
holds/allocations
reservation state machine
payment/refund
notifications
reconciliation
reservation operations
```

### T6. 플랫폼

```text
partner auth/webhooks
multi-channel inventory
POS adapters
warehouse/semantic layer
advanced risk models
multi-region/read expansion if justified
```

---

## 13. 팀 구성

### 13.1 0~2단계 최소 핵심 팀

| 역할                     | 권고 인원 | 책임                         |
| ------------------------ | --------: | ---------------------------- |
| Product/Founder          |         1 | 제품 결정, 연구, 사업        |
| Product Designer         |         1 | 웹·앱·점주·운영 UX           |
| Backend/Data Engineer    |         2 | 원장, API, 수집, 검색        |
| Frontend/Mobile Engineer |         2 | Next.js, Expo, 디자인 시스템 |
| Data Operations          |       1~2 | 검수, 출처, 현장 표본        |
| Trust/Policy             |     0.5~1 | 리뷰 정책, 신고, 법률 연결   |
| Platform/SRE             |     0.5~1 | 인프라, 보안, 관측성         |

초기에는 겸임 가능하지만 원장·운영 인력을 개발 이후로 미루지 않는다.

### 13.2 3~5단계 추가

- ML/Data Scientist: 평점·검색·조작 평가
- Trust & Safety Operations
- Merchant Operations/Success
- Reservation/Payment Backend Engineer
- Customer Support/Payment Operations
- Security/Privacy 담당
- Analytics Engineer

### 13.3 팀 분리 시점

코드 서비스를 먼저 쪼개지 않고 책임과 부하가 생겼을 때 팀과 배포 경계를 분리한다.

후보:

- Data Platform
- Discovery/Search
- Trust/Reviews
- Merchant
- Booking/Payments
- Growth/Network
- Platform/Security

---

## 14. 의존성 지도

```text
brand/legal/data licenses
          ↓
restaurant source ingestion
          ↓
entity resolution + operator tools
          ↓
branch read model ──→ search/map/detail ──→ analytics baseline
          ↓                    ↓
account/identity ──→ visit/review/media ──→ rating/ranking/moderation
          ↓                                      ↓
owner organization/claim ──→ official data + owner responses
          ↓
booking resources + operator board
          ↓
request booking ──→ instant inventory ──→ payment/refund
          ↓                                  ↓
visit verification                    reconciliation/support
          ↓
network/personalization/partner platform
```

지도·앱 UI가 음식점 원장보다 먼저 최종화될 수 없고, 결제가 예약 재고·운영보다 먼저 공개될 수 없다.

---

## 15. 단계별 출시 범위

### 내부

직원·지정 리뷰어만 사용한다. 개인정보와 결제가 없어도 실제 운영 데이터를 사용한다면 프로덕션 수준 접근 통제를 적용한다.

### 폐쇄 알파

초대 사용자, 선택 지역. 기능보다 데이터 오류와 여정 이해에 집중한다.

### 지역 베타

일반 가입 가능하지만 지역·기능을 제한한다. 지원 범위와 실험 상태를 표시한다.

### 공개 지역 출시

검색·리뷰 품질과 운영 서비스 목표가 안정된 지역만 연다.

### 전국 출시

전국 데이터가 있다는 이유만으로 하지 않는다. 지역별 coverage 배지를 내부에서 관리하고 기준 미달 지역에는 제한된 기능과 정확도 고지를 적용한다.

---

## 16. 첫 90일 실행안

개인 개발자가 주당 가용 시간에 맞춰 순서를 조정한다는 가정의 구체적인 작업 묶음이다. 주차는 완료 약속이 아니라 의존 순서를 보여준다.

### 1~2주

- 브랜드 선행 조사 의뢰
- 사용자·점주 인터뷰 모집
- 저장소와 문서 구조 확정
- 지점 엔터티 샘플 100건 수집
- 지도·장소·공공 데이터 계약 조사
- 핵심 화면의 저해상도 흐름

### 3~4주

- 공공 원천 수집기 spike
- 주소·상호 정규화
- 지점 중복 후보 실험
- PostgreSQL/PostGIS schema 1차
- OpenAPI 공통 계약
- 운영자 지점 검수 프로토타입
- 대표 검색 쿼리 200개 판단 세트

### 5~8주

- 선택 지역 원천 적재
- restaurant/branch 생성 파이프라인
- assertion·provenance·감사
- PostgreSQL FTS·`pg_trgm` 검색 document와 인덱스
- 운영자 중복·폐업 처리
- 웹 검색·상세 수직 슬라이스
- 이벤트 수집 최소 기반

### 9~12주

- 데이터 표본 검수와 오류 수정
- 자동완성·지도 검색
- 저장과 계정 기본
- 사용자 수정 제보
- 공개 웹 성능·접근성
- 알파 사용자 30~50명 연구
- 검색·데이터 품질 대시보드
- 다음 90일 진입 게이트 평가

90일의 성공은 앱스토어 출시가 아니라 실제 데이터로 검색→상세→수정 제보 흐름이 운영되는 것이다.

---

## 17. 우선순위 방법

기능은 다음 점수를 참고하되 기계적으로 합산하지 않는다.

```text
trust impact
user decision value
data flywheel effect
merchant operational value
risk reduction
learning value
reach
effort
operational load
legal/security risk
```

### 상위에 두는 작업

- 잘못된 지점과 폐업 수정
- 검색 결과 없음 개선
- 방문 인증과 리뷰 신뢰
- 점수 재현성과 설명
- 점주 핵심 정보 최신화
- 예약 중복·결제 불일치 방지

### 후순위로 두는 작업

- 신뢰 근거 없는 게임화
- 댓글과 공개 논쟁 기능
- 과도한 배지와 레벨
- 점수에 영향을 주는 유료 상품
- 운영 도구 없는 대규모 UGC 확장
- 근거 없는 생성형 리뷰 요약

---

## 18. 위험 등록부

| 위험               | 조기 신호                    | 예방·완화                              |
| ------------------ | ---------------------------- | -------------------------------------- |
| 음식점 원장 부정확 | 수정 신고·즉시 이탈 증가     | 출처·표본·운영 도구 우선               |
| 리뷰 콜드스타트    | 지점별 유효 리뷰 밀도 낮음   | 지역 집중, 투명한 시드 전략            |
| 평점 불신          | 점수 문의·언론/커뮤니티 의혹 | 독립성, 설명, 버전, 감사               |
| 조작·대행사        | 계정·지점 군집 급증          | 방문 신호, 그래프 탐지, 운영           |
| 점주 반발          | 삭제 요구·claim 이탈         | 답글권, 공정한 이의, 공식 정보 가치    |
| 지도·데이터 종속   | 비용 급등·약관 제한          | 내부 ID, 어댑터, 다중 출처             |
| 예약 중복          | 자원 충돌·지원 급증          | DB 불변식, 단계 출시, kill switch      |
| 결제 불일치        | 성공 결제에 예약 없음        | 멱등성, 웹훅, 조정 원장                |
| 운영 비용 폭증     | backlog 노령화               | 사건 제품화, 자동화+표본, 지역 게이트  |
| 개인정보 침해      | 민감 조회·로그 발견          | 분리 저장, 최소 권한, 감사             |
| 광고가 신뢰 훼손   | 자연/광고 인지 실패          | 명확 표시, 랭킹 독립 감사              |
| 기술 과잉 설계     | 기능보다 플랫폼 작업 증가    | 모듈형 모놀리스, 실제 임계점 기반 분리 |
| 상표 충돌          | 유사 서비스·거절 가능성      | 코드 대규모 공개 전 선행 조사          |

위험은 owner, 검토일, 현재 수준, 완화 작업을 가진 살아 있는 레지스터로 운영한다.

---

## 19. 의사결정 게이트

### Gate A: 앱 개발 확대

- 웹 수직 슬라이스에서 데이터·검색 가치가 확인됐는가
- 모바일 고유 가치가 지도·위치·저장에 명확한가
- 앱 유지 비용을 감당할 팀이 있는가

### Gate B: 공개 리뷰 모집

- 신고·수정·삭제·이의 제기가 준비됐는가
- 증빙 개인정보 보존이 정의됐는가
- 조작 모니터링과 운영자 큐가 있는가

### Gate C: 대표 점수 공개

- 최소 리뷰 밀도와 모델 안정성이 있는가
- 점수 결과를 재현하고 설명할 수 있는가
- 특정 지역·장르·점주 관계 편향이 검토됐는가

### Gate D: 유료 점주 상품

- 무료 공식 정보와 신뢰 권리가 보장되는가
- 자연 검색·평점과 기술적으로 분리됐는가
- 구독 해지 후 데이터·권한 동작이 명확한가

### Gate E: 자체 예약

- 점주가 예약대장을 실제 운영하는가
- 지원과 거래 알림이 영업시간에 맞게 가능한가
- 취소·변경 상태가 사용자와 점주 모두에게 명확한가

### Gate F: 결제

- 조정, 환불, 이중 승인, 장애 대응이 준비됐는가
- 결제 성공 후 예약 실패 시 자동 보호가 되는가
- 약관·고지·정산 구조가 검토됐는가

### Gate G: 전국 확장

- 신규 지역을 코드가 아니라 데이터·운영 준비도로 열 수 있는가
- 지역별 품질 저하를 숨기지 않는가
- 운영팀의 backlog와 품질이 안정적인가

---

## 20. 출시하지 말아야 하는 조건

다음 중 하나라도 해당하면 관련 기능 공개를 미룬다.

- 원천 데이터 이용권이 불명확하다.
- 지점 중복·폐업을 운영자가 안전하게 고칠 수 없다.
- 공개 점수가 광고·점주 계약과 분리되지 않았다.
- 리뷰 신고는 가능하지만 이의 제기나 복구가 없다.
- 예약 마지막 재고 동시성 테스트가 실패한다.
- 결제 성공 후 예약 없음 상태를 탐지하지 못한다.
- 운영자가 다른 조직·사용자 개인정보를 과도하게 볼 수 있다.
- 장애 시 기능을 채널·지역별로 닫을 수 없다.
- 핵심 지표가 클라이언트 클릭 이벤트에만 의존한다.
- 고객지원과 운영 owner가 없다.

---

## 21. 로드맵 검토 주기

### 주간

- 사용자·점주 학습
- 데이터·검색·운영 품질
- 핵심 위험과 막힘
- 다음 주 배포 범위

### 월간

- 단계 게이트 진행
- 지역 coverage
- 신뢰·안전·개인정보
- 인프라·공급자 비용
- 조직 용량과 채용

### 분기

- 제품 전략과 단계 재배치
- 평점·검색 독립성 감사
- 정책·법률 변화 검토
- 재해 복구·보안 훈련
- 데이터 보존과 공급자 검토
- 중단하거나 제거할 기능

로드맵 변경은 이전 약속을 숨기지 않고 결정 이유와 영향을 기록한다.

---

## 22. 문서에서 구현으로 넘어가는 순서

설계 문서가 충분히 구체화되면 다음 산출물로 전환한다.

1. `docs/adr/`: 핵심 기술 결정 기록
2. `openapi/`: v1 API 원본과 예시
3. `packages/contracts/`: 생성 타입과 이벤트 스키마
4. `infra/`: 로컬·클라우드 환경
5. `db/migrations/`: Foundation 스키마
6. `apps/web/app/ops/`: 데이터 검수 수직 슬라이스
7. `apps/web/`: 검색·상세·API 수직 슬라이스
8. `packages/server-ingestion/`: 원천 수집·정규화 bounded context
9. `packages/server-search/`: 검색 문서와 색인 bounded context
10. `apps/mobile/`: 지도·저장 알파

홈 화면의 시각 완성도보다 운영자 지점 수정과 검색 결과의 정확성을 첫 통합 데모 기준으로 삼는다.

---

## 23. 연계 설계 산출물

로드맵을 실행 가능한 세부 기준으로 분해한 문서:

- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md): 점주 조직, claim, 공식 정보, 분석, 유료 경계
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md): 공공·점주·사용자 원천 수집과 엔터티 해소
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md): 거래·활동·마케팅 알림과 채널 fallback
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md): 브랜드, 앱·웹·점주·운영 UI 기반
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md): 계약, 데이터, 모델, 보안, E2E, 부하 테스트
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md): 서비스 목표, 경보, 기능 저하와 장애 대응
- [ADR_INDEX.md](../adr/README.md): 핵심 아키텍처 결정과 검토 상태
- [GLOSSARY.md](./GLOSSARY.md): 도메인 용어와 상태값의 단일 기준
- [AUTH_IDENTITY.md](../architecture/AUTH_IDENTITY.md): 소비자·점주·운영자 인증, 세션, 복구
- [RECOMMENDATION_SYSTEM.md](../features/RECOMMENDATION_SYSTEM.md): 추천 후보·랭킹·다양성·설명·광고 분리
- [MEDIA_PIPELINE.md](../features/MEDIA_PIPELINE.md): 공개 사진과 비공개 증빙의 처리·권리·보존 경계
- [ADVERTISING_MONETIZATION.md](../features/ADVERTISING_MONETIZATION.md): 신뢰와 분리된 광고·구독·예약 과금
- [INTERNATIONALIZATION.md](../features/INTERNATIONALIZATION.md): 한국어 우선 다국어 데이터·검색·번역 기반
- [LEGAL_COMPLIANCE_CHECKLIST.md](../policies/LEGAL_COMPLIANCE_CHECKLIST.md): 기능별 법률 적용성·증빙·출시 승인 register
- [EDITORIAL_AWARDS.md](../features/EDITORIAL_AWARDS.md): 편집 리스트와 연간 선정의 독립 심사·공개·회수
- [RESEARCH_PLAN.md](./RESEARCH_PLAN.md): 단계별 가설·참가자·과제·반증·research gate
- [LAUNCH_CHECKLIST.md](../operations/LAUNCH_CHECKLIST.md): 알파·베타·지역 공개·확장의 Go/No-Go와 롤백
- [CONTRACTS_AND_SCHEMAS.md](../architecture/CONTRACTS_AND_SCHEMAS.md): OpenAPI·이벤트·DB mapping의 단일 원본과 호환성 gate
- [DATABASE_SCHEMA_BLUEPRINT.md](../architecture/DATABASE_SCHEMA_BLUEPRINT.md): 개념 모델을 PostgreSQL migration으로 옮기는 schema·constraint·index 기준
- [FOUNDATION_VERTICAL_SLICE.md](../architecture/FOUNDATION_VERTICAL_SLICE.md): Data Foundation의 첫 end-to-end 흐름, 작업 분해, demo와 Definition of Done
- [MONOREPO_ARCHITECTURE.md](../architecture/MONOREPO_ARCHITECTURE.md): 실행 app·server package·계약·task graph·CI의 저장소 경계
- [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md): Vercel·Neon 환경, migration·rollback·backup·비용 통제

---

## 24. 연관 문서

- [README.md](../../README.md)
- [COST_FIRST_ARCHITECTURE.md](../architecture/COST_FIRST_ARCHITECTURE.md)
- [PRODUCT.md](./PRODUCT.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [ANALYTICS.md](./ANALYTICS.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [AUTH_IDENTITY.md](../architecture/AUTH_IDENTITY.md)
- [RECOMMENDATION_SYSTEM.md](../features/RECOMMENDATION_SYSTEM.md)
- [MEDIA_PIPELINE.md](../features/MEDIA_PIPELINE.md)
- [ADVERTISING_MONETIZATION.md](../features/ADVERTISING_MONETIZATION.md)
- [INTERNATIONALIZATION.md](../features/INTERNATIONALIZATION.md)
- [LEGAL_COMPLIANCE_CHECKLIST.md](../policies/LEGAL_COMPLIANCE_CHECKLIST.md)
- [EDITORIAL_AWARDS.md](../features/EDITORIAL_AWARDS.md)
- [RESEARCH_PLAN.md](./RESEARCH_PLAN.md)
- [LAUNCH_CHECKLIST.md](../operations/LAUNCH_CHECKLIST.md)
- [CONTRACTS_AND_SCHEMAS.md](../architecture/CONTRACTS_AND_SCHEMAS.md)
- [DATABASE_SCHEMA_BLUEPRINT.md](../architecture/DATABASE_SCHEMA_BLUEPRINT.md)
- [FOUNDATION_VERTICAL_SLICE.md](../architecture/FOUNDATION_VERTICAL_SLICE.md)
- [MONOREPO_ARCHITECTURE.md](../architecture/MONOREPO_ARCHITECTURE.md)
- [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md)
