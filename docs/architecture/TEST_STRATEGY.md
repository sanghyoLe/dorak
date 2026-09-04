# 도락 테스트·품질 전략

> 실행 우선순위 안내: 현재 필수 통합 의존성은 PostgreSQL/PostGIS/`pg_trgm` 하나다. OpenSearch·Redis·queue 장애 시험은 해당 서비스를 실제로 도입한 이후 활성화한다. 기준은 [TECH_STACK.md](./TECH_STACK.md)다.

> 상태: 초안 v0.1  
> 범위: 앱, 웹, API, 데이터 수집, 검색, 평점, 리뷰, 점주, 예약·결제, 알림, 운영, 보안·개인정보  
> 원칙: 테스트 개수나 코드 커버리지가 아니라 음식점 정체성, 신뢰, 권한, 재고, 금전의 불변식을 증명한다.  
> 연관 문서: [PRODUCT.md](../product/PRODUCT.md), [TECH_STACK.md](./TECH_STACK.md), [DATA_MODEL.md](./DATA_MODEL.md), [GLOSSARY.md](../product/GLOSSARY.md)

---

## 1. 목적

도락은 일반적인 CRUD 앱보다 실패 비용이 큰 영역을 함께 가진다.

- 잘못된 지점 병합은 리뷰·평점·점주 권한·예약을 오염시킨다.
- 평점 오류는 서비스 신뢰와 점주 평판에 영향을 준다.
- 객체 권한 오류는 다른 지점의 예약 연락처와 운영 데이터를 노출한다.
- 예약 동시성 오류는 실제 고객 두 팀에게 같은 자리를 판매한다.
- 결제 재시도 오류는 이중 청구 또는 환불 누락을 만든다.
- 알림 역순은 취소 후 확정 메시지를 보낼 수 있다.
- 개인정보 삭제 누락은 캐시·검색·분석에 정보를 남긴다.

이 문서는 각 실패를 어떤 수준의 테스트와 배포 게이트로 막을지 정의한다.

---

## 2. 품질 원칙

### 2.1 위험 기반

모든 코드에 같은 테스트 강도를 적용하지 않는다. 피해 범위, 감지 가능성, 복구 비용, 변경 빈도를 기준으로 강화한다.

### 2.2 불변식 우선

화면 스냅샷보다 다음 불변식을 우선한다.

```text
한 review는 한 visit/branch 정체성에 귀속
한 공개 score는 model version과 input snapshot으로 재현
조직 권한은 role × branch scope × active relation의 교집합
한 resource의 활성 allocation은 점유 시간에 중복되지 않음
같은 idempotency request는 한 논리 결과
금전 movement 합계는 공급자·내부 원장과 조정 가능
삭제·철회는 모든 파생 시스템에 전파
광고 여부는 자연 score/ranking input에 들어가지 않음
```

### 2.3 경계 테스트

모듈 내부 구현을 과도하게 고정하지 않고 API, 이벤트, DB 제약, 공급자 어댑터, 상태 머신 경계를 검증한다.

### 2.4 운영 복구도 기능이다

실패를 막는 테스트뿐 아니라 발생한 실패를 탐지·격리·재처리·보상하는 runbook과 도구를 테스트한다.

### 2.5 프로덕션과 같은 의미, 다른 데이터

비프로덕션에서 실제 사용자 개인정보를 복제하지 않는다. 합성 fixture와 제한된 라이선스 샘플로 실제 구조·분포·어려운 사례를 재현한다.

### 2.6 flaky 테스트를 정상으로 받아들이지 않는다

재실행하면 통과하는 테스트는 신뢰를 낮춘다. 원인을 추적하고 격리에는 owner·기한을 붙인다.

---

## 3. 위험 등급

| 등급        | 정의                           | 예                          | 필수 검증                                  |
| ----------- | ------------------------------ | --------------------------- | ------------------------------------------ |
| Q0 Critical | 금전·개인정보·광범위 실제 피해 | 예약 재고, 결제, 권한, 파기 | 단위+통합+불변식+E2E+부하/실패+수동 게이트 |
| Q1 High     | 신뢰·평판·대규모 데이터 영향   | 지점 병합, 평점 발행, 제재  | 단위+통합+golden/shadow+운영 승인          |
| Q2 Medium   | 핵심 여정 영향, 복구 가능      | 검색, 리뷰 작성, 점주 정보  | 단위+계약+E2E+성능                         |
| Q3 Low      | 제한적 표시·편의               | 비핵심 UI, 문구             | 단위/컴포넌트+시각 검토                    |

변경 PR에 위험 등급을 표시하고 등급에 따른 CI와 승인 규칙을 적용한다.

---

## 4. 테스트 층

### 4.1 정적 검사

- TypeScript strict
- Python type/lint
- SQL migration lint
- OpenAPI lint·breaking change
- 이벤트 schema compatibility
- IaC plan·policy
- secret·dependency scan
- 개인정보 금지 필드 검사
- 번역 key·템플릿 변수 검사

### 4.2 단위 테스트

외부 I/O 없이 순수 규칙을 빠르게 검증한다.

예:

- 주소·상호 정규화
- 평점 가중치·수축 계산
- 상태 전이 guard
- 취소 수수료 계산
- 알림 자격·quiet hours
- 검색 필터 파싱
- 권한 predicate

### 4.3 속성 기반 테스트

많은 생성 입력에서 성질을 검증한다.

예:

- 문자열 정규화의 멱등성
- 점수 범위 1.00~5.00
- 가중치가 음수가 아님
- 환불 총액이 결제 가능 금액 초과하지 않음
- 시간 구간 겹침 판정의 대칭성
- 커서 encode/decode와 변조 거부

### 4.4 통합 테스트

실제 PostgreSQL/PostGIS, Redis, OpenSearch, queue와 모듈 경계를 검증한다. 인메모리 대체가 DB 제약·격리 수준을 숨기지 않게 한다.

### 4.5 계약 테스트

- OpenAPI 요청·응답
- 앱·웹 생성 SDK
- 도메인 이벤트 생산자/소비자
- 결제·문자·지도 adapter fixture
- 파트너 webhook 서명·버전

### 4.6 컴포넌트 테스트

디자인 시스템과 복잡한 UI의 상태·접근성·상호작용을 브라우저/네이티브 렌더러에서 검증한다.

### 4.7 E2E

실제 배포 환경에서 핵심 여정을 검증한다. 모든 조합을 E2E에 넣지 않고 Q0/Q1과 사용자 핵심 흐름을 선택한다.

### 4.8 탐색적 테스트

자동 테스트가 놓치는 실제 사용 맥락, 문구, 지도, 시간대, 점주 운영을 제품·운영 담당이 시나리오 기반으로 확인한다.

### 4.9 프로덕션 검증

- synthetic journey
- canary
- shadow 계산
- feature flag
- 불변식 모니터
- 제한된 표본 감사

프로덕션 사용자에게 무단 테스트 예약·문자를 보내지 않는다.

---

## 5. 테스트 환경

### 5.1 로컬

Docker 기반 PostgreSQL/PostGIS, Redis, OpenSearch, queue adapter를 사용한다. 공급자 sandbox 또는 deterministic fake를 선택할 수 있다.

### 5.2 CI ephemeral

PR별 격리 DB·schema와 서비스 컨테이너를 사용한다. 병렬 테스트의 ID·포트·시간 충돌을 막는다.

### 5.3 shared development

팀 통합과 모바일 기기 연결용. 품질 승인 환경으로 사용하지 않는다.

### 5.4 staging

- 프로덕션과 같은 배포 구조
- 합성 데이터
- 공급자 sandbox
- 실제 알림 목적지는 allowlist
- 결제 금전 이동은 sandbox
- 운영자 SSO와 권한 경계 검증

### 5.5 production

read-only smoke와 안전한 synthetic tenant/branch만 사용한다. 실제 음식점 통계와 검색 결과에 테스트 리뷰·예약이 섞이지 않게 `is_test` 격리 규칙을 원장 수준에서 적용한다.

### 5.6 환경 차이 등록부

```text
component
staging behavior
production behavior
risk
compensating test
owner
```

결제·문자·지도 공급자의 sandbox가 실제와 다른 부분을 문서화한다.

---

## 6. 테스트 데이터

### 6.1 합성 fixture 원칙

- 실제 개인 이름·전화·영수증을 쓰지 않는다.
- 주소는 테스트용으로 명확히 표시하거나 공개 안전 데이터 사용을 검토한다.
- 전화·이메일은 공급자 테스트 범위와 예약된 도메인을 사용한다.
- 이미지에는 실제 얼굴·차량번호가 없다.
- fixture에 `TEST` 표시를 넣되 정규화 알고리즘 결과를 왜곡하지 않는다.

### 6.2 도메인 fixture 팩

```text
restaurant_identity_pack
korean_search_pack
review_integrity_pack
owner_permission_pack
reservation_concurrency_pack
payment_webhook_pack
notification_routing_pack
privacy_lifecycle_pack
```

### 6.3 시간

테스트는 injectable clock을 사용한다.

- 자정 넘는 영업
- 월말·연말
- 윤년
- 예약 취소 경계
- hold 만료 직전/직후
- 해외 DST 전환
- 알림 quiet hours

CI 시스템 실제 시각과 로컬 timezone에 의존하지 않는다.

### 6.4 무작위 데이터

property/fuzz seed를 실패 출력에 기록해 재현한다. 개인정보처럼 보이는 랜덤 문자열이 외부 공급자로 전송되지 않게 environment guard를 둔다.

### 6.5 golden set

사람이 검수한 검색 판단, 지점 pair, 평점 기대 범위, 모더레이션 사례를 버전 관리한다. 변경 사유 없이 새 모델 결과에 맞춰 golden label을 고치지 않는다.

---

## 7. 음식점 데이터 테스트

### 7.1 수집

- 전체·증분·webhook·파일 수집
- 페이지 중간 실패와 재개
- 커서 만료
- 겹치는 lookback 중복 제거
- 동일 snapshot 재처리
- 원천 record 삭제·누락
- schema drift와 enum 새 값
- rate limit·timeout

### 7.2 정규화

- Unicode, 전각·반각, 공백
- 한글·영문·일문 혼용 상호
- 본점·지점·별관 토큰
- 도로명·지번·건물·층·호수
- 국내·국제 전화
- 좌표 순서·범위·precision
- 자정 넘는 영업시간
- 자연어 휴무의 구조화 실패

### 7.3 엔터티 해소 golden 사례

- 같은 이름, 다른 주소
- 같은 건물, 같은 브랜드, 다른 층
- 같은 전화, 다른 지점
- 이전과 단순 좌표 수정
- 폐업 후 새 업종
- 리브랜딩과 정체성 단절
- 프랜차이즈 본사 번호
- 공유 주방·가상 브랜드

### 7.4 false merge 공격

자동 병합 임계치에 맞춰 상호·전화·좌표 일부를 조작한 adversarial pair를 생성한다. 리뷰·claim·예약이 있는 branch는 더 높은 보호가 실제 적용되는지 확인한다.

### 7.5 assertion

- 효력 기간 선택
- 점주 미래 휴무
- 오래된 공공 값과 최신 현장 제보
- 서로 복제된 출처의 독립 확인 오판
- 철회·대체
- 계약 종료 source의 공개 자격 제거

### 7.6 병합·분리

- 영향 미리보기 수치
- 관계 수 보존
- redirect
- 점수·검색 재계산
- 점주 권한 충돌
- 활성 예약 차단
- 부분 실행 재개
- 분리 시 병합 후 생성 데이터 분류

### 7.7 불변식

```text
same source external ID mapping is unique within defined scope
one primary branch location per instant
merge graph has no cycle
canonical public field has valid provenance
search document source version never moves backward
```

---

## 8. 검색 테스트

### 8.1 오프라인 판단 세트

쿼리 분류:

- 정확 상호
- 오탈자·띄어쓰기
- 초성
- 영문·로마자
- 장르·메뉴
- 지역+장르
- 속성·상황 자연어
- 폐업·과거 상호
- 결과가 없어야 하는 쿼리

### 8.2 지표

- Precision@K
- Recall@K
- MRR
- NDCG@K
- zero-result 정확성
- autocomplete acceptance
- geographic error
- result diversity

전체 평균뿐 아니라 지역·장르·언어·체인/독립점으로 분리한다.

### 8.3 온라인 계약

- 필터·정렬 조합
- 지도 경계와 반경
- 커서 안정성·변조·만료
- 결과 중복
- 광고와 자연 위치 분리
- 폐업·휴업 정책
- 색인 지연 중 상세 fallback

### 8.4 랭킹 회귀

새 analyzer·synonym·함수 적용 전 상위 결과 diff를 만든다.

```text
large position changes
new zero results
closed branches surfaced
coverage by region/category
popular score dominance
sponsored/organic collision
latency and index size
```

### 8.5 성능

- 자동완성 burst
- 지도 이동 반복
- 인기 지역 넓은 viewport
- 다중 필터
- deep pagination
- 재색인과 검색 동시 부하
- 노드 장애·timeout

---

## 9. 리뷰·방문 인증 테스트

### 9.1 생명주기

- 초안 자동 저장
- 게시 정책 검증
- revision 이력
- 작성자 삭제
- 운영 제한·제거
- 이의 후 복구
- 계정 종료 후 공개 표현

### 9.2 구조화 평가

- 1.0~5.0, 0.5 간격
- 전체·차원 필수/선택
- scale version
- locale 숫자 입력
- review revision과 rating 동시성

### 9.3 인증

- 예약 confirmed vs seated/completed
- 영수증 중복·다른 지점
- QR 재사용
- 위치 권한 거부·부정확 좌표
- 증빙 만료·철회
- 한 visit의 복수 시도
- 인증 취소 후 score eligibility

### 9.4 이해관계

- 자비·할인·초대·협찬
- 직원·점주 관계
- disclosure 수정 이력
- 공개 상태와 score eligibility
- 프로모션 보상 조건 검증

### 9.5 모더레이션

- 신고 중복과 사건 묶음
- 임시 제한
- 정책 버전
- 작성자·점주 통지
- 이의 재검토자 분리
- 증빙 접근 권한
- 블록 관계에서 알림·댓글 제한

---

## 10. 평점 테스트

### 10.1 수학적 성질

- 결과 범위
- 리뷰 순서 불변
- 동일 입력 동일 결과
- 가중치가 0인 리뷰 무영향
- prior만 있을 때 기대값
- 표본 증가에 따른 불확실성 경향
- effective sample size 상한
- 반복 방문 상한

### 10.2 예제 기반

- 신규 branch
- 박한 리뷰어와 후한 리뷰어
- 인증/비인증 혼합
- 오래된 리뷰
- 협찬 disclosure
- 한 리뷰어 집중
- 조작 군집 제외
- category prior 차이

### 10.3 snapshot 재현

`modelVersion + inputSnapshot`으로 같은 branch score와 contribution을 재계산한다. Python 라이브러리·부동소수점·정렬 변경의 차이를 허용 오차와 함께 관리한다.

### 10.4 golden portfolio

대표 branch 집합의 점수·순위·신뢰 구간을 모델 버전별로 비교한다. golden은 정확한 사회적 진실이 아니라 의도하지 않은 변경을 탐지하는 회귀 기준이다.

### 10.5 공격 테스트

- 다계정 동일 지점 고평점
- 정상 리뷰 사이에 분산된 캠페인
- 오래된 계정 탈취
- 협찬 미공개
- 특정 경쟁점 저평점
- 반복 방문으로 영향 집중
- 리뷰 게시·삭제 타이밍 공격

### 10.6 발행

- draft→shadow→active→retired
- 승인자 분리
- 부분 계산 실패
- 발행 중 사용자 조회
- rollback은 이전 snapshot 재활성 또는 새 보상 발행
- 광고·계약 필드가 입력 schema에 없음

---

## 11. 계정·점주 권한 테스트

### 11.1 권한 매트릭스

```text
actor role
× organization relationship
× branch scope
× resource ownership
× membership/claim state
× action sensitivity
```

대표 행위:

- 정보 조회·수정
- 메뉴 업로드
- 리뷰 답글·신고
- 예약 연락처 보기
- 예약 승인·취소
- 분석 내보내기
- 구성원 초대
- owner 이전
- 구독·결제

### 11.2 IDOR

URL·본문의 organizationId, branchId, reservationId, exportId를 다른 조직 값으로 바꾼 부정 테스트를 자동화한다.

### 11.3 claim

- 기존 claim 없음
- 같은 조직 재신청
- 다른 조직 충돌
- 대행사 위임 만료
- 프랜차이즈 본사/가맹점
- 증빙 부족·철회·이의
- 승인 후 권한 생성 원자성
- revoked 후 세션·캐시 무효화

### 11.4 소유권 이전

- 기존 owner 통지
- 새 조직 검증
- 활성 예약과 구독 영향
- 과거 연락처 접근 미승계
- 이중 승인
- 중간 실패와 재개

### 11.5 추가 인증

- 인증 시간 만료
- 세션 회전
- owner·billing 변경
- 내보내기
- 연락처 대량 접근
- 탈취 계정 잠금

---

## 12. 예약 재고 테스트

### 12.1 상태 머신

허용 전이와 금지 전이를 자동 생성해 전수 검증한다. 종료 상태 정정은 권한 있는 별도 명령만 가능해야 한다.

### 12.2 시간

- 현지 날짜·UTC 변환
- 자정 넘는 서비스
- buffer
- 최소 사전 시간
- 예약 오픈 경계
- 휴무 등록과 활성 예약
- 해외 DST 중복·누락 시각

### 12.3 자원

- 테이블 min/max 인원
- 조합
- 룸 독점
- 용량 pool
- maintenance
- 인원 증가·감소
- 미래 fragmentation 휴리스틱

### 12.4 동시성

마지막 자원에 동시 N개 요청:

- 한 논리 예약만 확정
- 실패 요청은 일관된 409
- allocation overlap 0
- hold 소비 정확
- idempotency replay 동일 결과
- deadlock 재시도 제한

단일 프로세스 promise 동시성만이 아니라 여러 API 인스턴스와 실제 DB 연결로 테스트한다.

### 12.5 hold

- 생성·중복
- 만료 직전 결제
- 만료 후 late callback
- release
- 계정당 남용 제한
- 인기 예약 오픈 burst

### 12.6 변경

- 기존 재고 유지
- 새 시간 hold
- 추가 결제
- 환불 의무
- proposal 만료
- base resourceVersion 충돌
- 양쪽 동시 제안

### 12.7 점주 수동 예약

- 전화·현장·외부 출처
- 연락처 동의 분리
- 기존 도락 예약 충돌
- offline memo 재연결
- 직원 권한 해제

---

## 13. 결제·환불 테스트

### 13.1 provider contract

공급자 공식 sandbox와 서명 fixture를 사용한다. 우리가 만든 fake는 드문 공급자 동작을 재현하지만 공식 계약 테스트를 대체하지 않는다.

### 13.2 결제 흐름

- requires method/action
- 3DS 성공·실패·취소
- processing
- timeout/unknown
- 성공
- 영구 실패
- 통화·금액 불일치

### 13.3 웹훅

- 서명 유효·무효
- 원본 body
- 중복
- 역순
- 알 수 없는 event type
- 내부 intent 없음
- 오래된 timestamp/replay
- endpoint timeout 후 공급자 재전송

### 13.4 부분 실패

- 결제 성공 후 예약 commit 실패
- 예약 확정 후 outbox 지연
- 취소 후 환불 요청 생성 실패
- 환불 공급자 성공 후 DB timeout
- 공급자와 내부 상태 불일치

모든 경우 조정 큐와 보상 의무를 검증한다.

### 13.5 금액 불변식

```text
captured >= total successful refunds
same provider movement counted once
reservation price snapshot immutable
cancellation quote uses server time and policy version
manual adjustment records original and delta
```

### 13.6 정산·조정

- 일별 provider 조회/파일과 내부 movement 비교
- missing·duplicate·amount mismatch
- 장기 processing
- 재실행 멱등
- 운영자 고액 이중 승인
- 감사 로그

---

## 14. 알림 테스트

### 14.1 분류와 자격

- security/transactional/activity/marketing
- 동의·철회
- quiet hours
- frequency cap
- 차단·계정 종료
- 역할·지점 routing

### 14.2 순서·중복

- 동일 domain event 반복
- 취소 후 늦은 확정
- 변경 전 reminder
- 환불 완료 후 늦은 processing
- 공급자 timeout과 webhook

### 14.3 템플릿

- locale
- 변수 allowlist
- 개인정보 금지
- escaping
- SMS segment
- deep link 권한·만료
- 잠금 화면 최소 문구

### 14.4 에스컬레이션

- primary 무응답
- backup 없음
- 구성원 해제
- 공급자 장애
- 마감 직전
- auto-expiry
- 운영 사건 생성

### 14.5 외부 발송 안전

staging/CI 목적지는 allowlist 외 전송을 코드에서 차단한다. 테스트용 SMS/email 제목에 환경 표시를 넣는다.

---

## 15. API 계약 테스트

### 15.1 스키마

- 모든 route가 OpenAPI에 있음
- 예시 유효
- nullable/optional
- enum unknown fallback
- 오류 Problem Details
- 금액·시간·위치 표현

### 15.2 호환성

- 필드 삭제·타입 변경 감지
- 필수 요청 필드 추가 감지
- enum 삭제 감지
- 오래된 지원 앱 SDK의 smoke
- deprecation header

### 15.3 멱등성

- 같은 키·같은 본문
- 같은 키·다른 본문
- 처리 중 동시 요청
- commit 후 응답 단절
- TTL 경계
- actor scope 분리

### 15.4 페이지네이션

- tie-breaker
- 중간 삽입·삭제
- 커서 변조
- 다른 filter에 커서 재사용
- 만료·모델 버전 변경

### 15.5 오류 정보

SQL, stack, provider 원문, 계정 존재, fraud signal, 개인정보가 응답에 없는지 부정 테스트한다.

---

## 16. 개인정보 생명주기 테스트

### 16.1 데이터 목록

각 민감 필드가 수집 목적, 저장소, 암호화, 접근 역할, 보존 작업, 삭제 경로를 갖는지 schema-level 검사를 만든다.

### 16.2 동의

- 정책 버전
- 목적·채널
- 철회
- 선택 동의 거부 후 핵심 기능
- 마케팅과 거래 분리
- 위치 권한 거부·정밀도 변경

### 16.3 열람·내보내기

- 요청자 신원
- 제3자 정보 제거
- 내부 보안 신호 제한
- 서명 URL 만료·단일 접근
- export 생성 로그의 개인정보

### 16.4 삭제

```text
primary database
identity/contact vault
review/profile presentation
object storage
search index
cache
analytics identity link
notification destination
third-party processors
backup deletion tombstone
```

end-to-end synthetic account로 각 시스템을 확인한다.

### 16.5 보존

- 만료 job
- legal hold
- 거래 기록 제한 보관
- 증빙 조기 파기
- 복원 후 tombstone 재적용
- clock 경계

---

## 17. 보안 테스트

### 17.1 자동

- SAST
- dependency/lockfile scan
- secret scan
- container/image scan
- IaC policy
- API dynamic scan
- CSP/header check
- SBOM 생성

### 17.2 인증·세션

- refresh rotation
- 재사용 탐지
- logout/revoke
- session fixation
- CSRF
- OAuth state/nonce
- password reset enumeration
- MFA/passkey recovery

### 17.3 권한

객체 권한 matrix와 운영자 민감 행동을 집중한다. 403뿐 아니라 존재를 숨겨야 할 404와 로그 redaction도 본다.

### 17.4 입력·파일

- SQL/NoSQL injection
- XSS/HTML
- SSRF URL fetch
- path/object key
- image bomb·malformed media
- CSV formula injection
- archive bomb
- webhook signature bypass

### 17.5 외부 보안 검토

공개 베타 전과 예약·결제 출시 전 독립 penetration test를 실시한다. 발견은 위험 등급, owner, 기한, 재테스트 증거를 갖는다.

### 17.6 abuse case

- 리뷰 spam·계정 farm
- hold inventory denial
- 전화번호·계정 존재 enumeration
- 점주 claim 탈취
- 대량 scraping
- 알림 폭탄
- 운영자 내부 오용

---

## 18. 접근성 테스트

### 18.1 자동 검사

웹 semantic, label, contrast, focus 기본 검사를 CI에 넣지만 수동 검사를 대체하지 않는다.

### 18.2 키보드

- 검색·필터
- 지도 대체 목록
- 리뷰 작성
- 예약 시간 선택·취소
- 점주 예약대장
- 운영자 사건 결정

### 18.3 화면 읽기

- 결과 위치·광고 구분
- 점수와 불확실성 설명
- 폼 오류
- 예약 상태·정책
- 타이머와 hold 만료
- modal focus
- 알림 문구

### 18.4 확대·리플로우

- 큰 글자
- 200~400% 웹 확대
- 가로 스크롤 없는 핵심 흐름
- 모바일 시스템 font scale

### 18.5 모션·색상

- reduced motion
- 색상 외 상태 label
- flashing 없음
- 지도 marker의 목록 대체

### 18.6 사용자 테스트

실제 장애 사용자와 탐색·리뷰·예약·점주 핵심 흐름을 정기 검증한다.

---

## 19. 성능 테스트

### 19.1 workload 모델

추측한 RPS 하나가 아니라 실제 패턴을 모델링한다.

- 출퇴근·식사 시간 검색 burst
- 인기 예약 오픈 순간
- 평점 배치 발행
- 원천 backfill·재색인
- 점주 대량 메뉴 변경
- 알림 캠페인
- 연휴 예약 취소

### 19.2 유형

- baseline
- load
- stress
- spike
- soak
- capacity
- failover

### 19.3 측정

- p50/p95/p99
- 오류·timeout
- DB lock·deadlock
- connection pool
- queue/outbox lag
- OpenSearch heap·rejection
- cache hit
- autoscaling delay
- 비용/요청

### 19.4 데이터 크기

작은 fixture에서만 빠른 쿼리를 승인하지 않는다. 예상 1년·3년 데이터 규모와 skew를 합성한다.

### 19.5 성능 회귀

핵심 query plan과 endpoint budget을 릴리스 비교한다. 하드웨어 증가만으로 회귀를 숨기지 않는다.

---

## 20. 복원력·실패 주입

### 20.1 의존성

- PostgreSQL failover/read replica lag
- Redis unavailable
- OpenSearch partial/slow
- queue delayed/duplicate
- object storage timeout
- 결제·문자·지도 5xx/rate limit
- DNS/network partition

### 20.2 기대 동작

- 검색 장애가 예약 write를 막지 않음
- Redis 장애가 재고 정확성을 깨지 않음
- 사진 장애가 리뷰 text draft를 잃게 하지 않음
- 알림 장애가 예약 확정을 rollback하지 않음
- 결제 unknown이 새 결제 유도로 이어지지 않음
- outbox가 이벤트를 보존

### 20.3 game day

분기별로 프로덕션과 유사한 환경에서 시나리오를 실행한다.

- 검색 전면 장애
- 결제 webhook 지연
- 문자 장애 중 임박 예약
- 잘못된 대량 폐업 assertion
- 운영자 계정 탈취
- 리전 장애 또는 DB restore

훈련 결과를 runbook과 기술 backlog에 반영한다.

---

## 21. 모바일·웹 호환성

### 21.1 모바일 matrix

- 지원 iOS/Android 최소·최신
- 작은/큰 화면
- 저메모리·저성능 기기
- Wi-Fi/느린 셀룰러/오프라인
- 위치·카메라·알림 권한 조합
- background/resume
- 앱 업데이트 중 저장된 draft·예약

### 21.2 웹 matrix

- 지원 브라우저
- mobile/desktop
- SSR/hydration
- cookie 제한
- 뒤로/앞으로 캐시
- 공유·SEO metadata
- JS 실패 시 공개 상세의 최소 정보

### 21.3 앱 버전 호환

서버는 지원 중인 구버전의 enum·필드·deep link를 검증한다. 강제 업데이트는 보안·치명적 계약 문제에 제한한다.

---

## 22. 시각 회귀

### 22.1 대상

- 디자인 시스템 primitive
- 검색 result card
- branch header·score
- 리뷰 card·disclosure
- 예약 상태·취소 견적
- 점주 예약대장
- 운영자 고위험 확인

### 22.2 기준

모든 페이지 전체 screenshot을 무분별하게 저장하지 않는다. 안정된 fixture, font, viewport로 핵심 컴포넌트와 상태를 선택한다.

### 22.3 오탐 관리

OS/font 렌더 차이를 격리하고 threshold 변경으로 실제 회귀를 숨기지 않는다. 승인 diff에는 이유와 reviewer가 남는다.

---

## 23. 모니터링과 테스트 연결

각 Q0/Q1 불변식은 사전 테스트와 프로덕션 모니터를 모두 갖는다.

| 불변식              | 사전           | 프로덕션             |
| ------------------- | -------------- | -------------------- |
| 자원 중복 없음      | 동시성 통합    | overlap query alert  |
| 결제 성공-예약 대응 | 실패 주입      | reconciliation alert |
| 권한 범위           | matrix/IDOR    | 민감 조회 이상 탐지  |
| 점수 재현           | snapshot test  | publish audit diff   |
| 검색 버전 단조      | event contract | stale version metric |
| 삭제 전파           | lifecycle E2E  | overdue deletion job |

테스트를 통과해도 모니터가 필요하고, 모니터가 있다고 테스트를 생략하지 않는다.

---

## 24. CI 파이프라인

### PR 필수

```text
format/lint/typecheck
unit/property tests
changed-domain integration tests
OpenAPI/event compatibility
migration checks
security/secret/dependency scan
privacy field lint
component accessibility
build
```

### merge 후

```text
full integration
E2E critical journeys
search/rating regression if affected
staging deploy + smoke
performance micro-baseline
```

### scheduled

```text
full golden evaluation
large data quality reconciliation
dependency/container scan
deletion lifecycle synthetic
long-running/soak
restore verification
provider sandbox contract
```

### release gate

Q0/Q1 변경은 테스트 결과, migration plan, 관측성, rollback/compensation, 운영 준비를 확인한다.

---

## 25. migration 테스트

### 25.1 schema

- 빈 DB 적용
- 현재 production snapshot 형태에서 적용
- forward/backward application compatibility
- lock duration
- table rewrite
- index build 방식
- rollback 또는 forward fix

### 25.2 expand/contract

```text
add compatible schema
dual read/write if needed
backfill with checkpoints
verify
switch reads
stop old writes
remove old schema later
```

### 25.3 대량 backfill

- dry-run diff
- canary 범위
- 영향 개수 임계치
- pause/resume
- rate limit
- idempotency
- audit
- 검산

### 25.4 enum

DB enum보다 check table/text+constraint 등 migration 유연성을 비교한다. 공개 enum 추가는 구버전 클라이언트 fallback을 검증한다.

---

## 26. 배포 검증

### 26.1 pre-deploy

- 변경 위험 등급
- feature flag
- dashboard·alert
- migration
- provider/config
- 운영 공지·runbook
- rollback/compensation

### 26.2 canary

내부→소수 사용자/지점/지역→확대한다. 예약·점수는 별도 승인 게이트를 둔다.

### 26.3 smoke

- 로그인
- 검색·상세
- 리뷰 draft
- 점주 branch 조회
- synthetic 예약 availability
- queue/outbox
- 알림 sandbox/inbox

### 26.4 자동 중단

- 오류·latency 예산
- 권한 거부 급변
- 검색 결과 수 급변
- score 대규모 변화
- 예약 충돌
- 결제 reconciliation
- 이벤트 schema invalid

---

## 27. 수동 출시 승인

### 검색 공개

- 판단 세트·성능·폐업 오노출
- 데이터 coverage
- 기능 저하

### 공개 점수

- model shadow
- portfolio diff
- 공정성·조작
- 승인자·snapshot
- 사용자 설명

### 점주

- claim·권한 matrix
- 소유권 분쟁
- 연락처 접근 감사

### 예약

- 동시성·상태 머신
- 점주 pilot
- 알림 에스컬레이션
- support runbook

### 결제

- 공급자 contract
- 실패 주입·unknown
- 환불·조정
- 법률·정책
- 온콜

---

## 28. flaky 테스트 정책

### 정의

코드 변경 없이 동일 commit·환경에서 결과가 달라지는 테스트.

### 처리

1. 실패 artifact와 seed를 보존한다.
2. 최근 발생률과 owner를 등록한다.
3. Q0/Q1 테스트는 단순 quarantine하지 않는다.
4. Q2/Q3 격리는 만료일과 이슈를 요구한다.
5. 원인을 수정하고 반복 실행으로 복구를 증명한다.

### 흔한 원인

- 실제 clock/timezone
- 고정 sleep
- 공유 DB 상태
- 비결정 정렬
- 외부 네트워크
- 비동기 작업 대기 부족
- 포트·ID 충돌

조건을 polling하거나 완료 이벤트를 기다리며 임의 긴 sleep을 쓰지 않는다.

---

## 29. 결함 처리

### 심각도

| 등급 | 예                                  |
| ---- | ----------------------------------- |
| B0   | 개인정보·이중 결제·대규모 예약 중복 |
| B1   | 핵심 여정 불가, 잘못된 점수 발행    |
| B2   | 우회 가능한 주요 오류               |
| B3   | 제한적 표시·편의 오류               |

### 결함 기록

```text
observed behavior
expected invariant
environment/version
reproduction
user/data scope
security/privacy classification
evidence without sensitive data
temporary mitigation
owner and target
regression test
```

프로덕션 결함 수정에는 재현 테스트 또는 왜 자동화가 불가능한지 설명을 요구한다.

---

## 30. 품질 지표

### 결과

- 사용자 영향 결함
- 예약·결제 불변식 사건
- 잘못된 병합·점수 발행
- 권한·개인정보 사건
- 장애당 탐지·복구 시간

### 예방

- 위험 등급별 자동 테스트 coverage
- 계약 breaking change 차단
- migration canary
- 복원 훈련 성공
- golden 평가 회귀

### 테스트 건강

- suite 시간
- flaky rate
- quarantine age
- 실패 진단 시간
- 환경 실패율

라인 커버리지는 보조 신호다. 위험 분기와 불변식 coverage를 우선한다.

---

## 31. 책임

### 개발자

- 변경 위험 분류
- 단위·통합·계약 테스트
- 관측성
- 결함 회귀

### QA/Quality Engineer

- 위험 모델
- E2E·탐색·호환성
- test infrastructure
- release evidence

### Data/ML

- golden set
- 모델 평가·drift·reproducibility
- data quality

### Product/Design

- acceptance criteria
- 문구·오류·접근성
- 사용자 연구

### Operations/Trust

- 실제 사건 fixture
- runbook/game day
- 정책 결정 품질

### Security/Privacy

- 위협·권한·삭제·공급자 검토
- 침투·incident exercise

품질은 QA 한 팀의 승인 업무로만 두지 않는다.

---

## 32. 초기 구현 순서

### Q0. 기반

1. Vitest/Jest 및 Python test 설정
2. 실제 Postgres/PostGIS 통합 harness
3. deterministic clock/ID
4. fixture factory
5. OpenAPI/event compatibility
6. CI artifact

### Q1. Foundation

1. normalization property tests
2. entity resolution golden set
3. assertion/merge integration
4. search judgment runner
5. ops vertical E2E

### Q2. Trust

1. review lifecycle
2. verification
3. rating mathematical/snapshot
4. moderation case
5. media security

### Q3. Merchant

1. permission matrix
2. claim/transfer
3. official assertion
4. audit/export

### Q4. Reservation

1. state model generator
2. allocation constraint
3. multi-instance concurrency
4. payment webhook contract
5. reconciliation
6. notification escalation

### Q5. Hardening

1. performance/capacity
2. chaos/game day
3. restore/deletion synthetic
4. independent security test
5. mobile compatibility lab

---

## 33. 출시 체크리스트

- [ ] Q0/Q1 불변식마다 테스트와 프로덕션 모니터가 있다.
- [ ] 실제 PostgreSQL/PostGIS/OpenSearch를 쓰는 통합 suite가 있다.
- [ ] 한국 음식점 정체성 golden fixture가 있다.
- [ ] 검색·평점 모델 변경에 자동 diff와 승인 게이트가 있다.
- [ ] 점주·운영자 객체 권한 matrix가 자동화되어 있다.
- [ ] 마지막 예약 재고의 multi-instance 동시성 테스트가 통과한다.
- [ ] 결제 중복·역순·unknown·부분 실패가 테스트된다.
- [ ] 알림 과거 상태·중복·동의 철회가 테스트된다.
- [ ] 개인정보 삭제가 파생 시스템과 공급자까지 E2E 검증된다.
- [ ] 비프로덕션 외부 발송과 실결제가 차단된다.
- [ ] migration과 backfill에 dry-run·canary·검산이 있다.
- [ ] 접근성 핵심 흐름을 자동+수동 검증한다.
- [ ] flaky test에는 owner와 만료 정책이 있다.
- [ ] 장애 game day와 백업 복원 시험이 완료되었다.

---

## 34. 미결정 사항

- 모바일 E2E 도구와 실제 기기 farm
- 브라우저 지원 matrix
- property testing 라이브러리
- 검색 판단 도구와 annotator workflow
- ML 모델 artifact reproducibility 환경
- 결제·문자 공급자 sandbox CI 허용 범위
- 성능 테스트 트래픽 규모와 초기 capacity 목표
- 시각 회귀 도구와 승인 workflow
- 독립 penetration test 시점과 범위
- 테스트 결과·artifact 보존기간
- 프로덕션 synthetic branch 격리 방식

---

## 35. 연관 문서

- [PRODUCT.md](../product/PRODUCT.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [DATA_INGESTION.md](./DATA_INGESTION.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [API_DESIGN.md](./API_DESIGN.md)
- [CONTRACTS_AND_SCHEMAS.md](./CONTRACTS_AND_SCHEMAS.md)
- [DATABASE_SCHEMA_BLUEPRINT.md](./DATABASE_SCHEMA_BLUEPRINT.md)
- [FOUNDATION_VERTICAL_SLICE.md](./FOUNDATION_VERTICAL_SLICE.md)
- [MONOREPO_ARCHITECTURE.md](./MONOREPO_ARCHITECTURE.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [TECH_STACK.md](./TECH_STACK.md)
- [GLOSSARY.md](../product/GLOSSARY.md)
