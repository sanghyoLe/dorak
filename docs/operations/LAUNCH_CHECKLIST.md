# 도락 출시 준비·Go/No-Go·롤백 체크리스트

> 실행 우선순위 안내: 개인 프로젝트의 첫 공개는 [비용 우선 배포 체크리스트](./DEPLOYMENT_ENVIRONMENTS.md)를 기준으로 한다. OpenSearch·Redis·AWS·다중 환경 항목은 해당 서비스를 도입하는 단계에서만 활성화한다.

| 항목      | 내용                                                               |
| --------- | ------------------------------------------------------------------ |
| 문서 상태 | Draft                                                              |
| 문서 버전 | 0.1.0                                                              |
| 적용 범위 | 웹, iOS, Android, API, 데이터, 운영, 점주·예약·광고 단계 출시      |
| 주요 독자 | 창업자, 제품, 엔지니어링, 데이터, trust, 운영, 법무, 지원, 마케팅  |
| 기본 전략 | 전국 데이터를 준비하되 제품 노출과 운영 책임은 단계적으로 확대한다 |
| 배포 기준 | [DEPLOYMENT_ENVIRONMENTS.md](./DEPLOYMENT_ENVIRONMENTS.md)         |

## 현재 MVP 웹 출시 판정

현재 구현 범위는 L0 개발 프리뷰와 L1 내부 검증 사이다. 검색·상세·리뷰·운영
숨김의 핵심 흐름과 자동 검증은 준비됐지만, 실서비스 공개 전 아래 항목은
반드시 사람이 확인해야 한다.

- [x] 리뷰는 계정당 식당별 1건이며 하루 5건 제한이 동시 요청에도 적용된다.
- [x] 방문일 자기입력과 별도 근거 확인을 UI·API·정책 문서에서 구분한다.
- [x] 공개 리뷰 숨김과 평점 재계산이 운영자 인증·CSRF 방어·감사 로그와 함께 동작한다.
- [x] 공개 리뷰 하단에 운영자 신고 메일 경로가 있고, 접수 후 `/ops`에서 조치할 수 있다.
- [x] 예시 데이터는 `synthetic`으로 표시되고 기본 검색엔진 색인은 꺼져 있다.
- [x] 개인정보 처리 안내 페이지가 공개되어 있다.
- [ ] 실제 연락 가능한 `DORAK_CONTACT_EMAIL`과 운영자 비밀번호를 등록했다.
- [ ] Google OAuth redirect URI와 이메일 확인 정책을 실제 도메인에서 확인했다.
- [ ] 합성 데이터가 아닌 출처·최신성 검수된 지점만 production DB에 적재했다.
- [ ] 대한민국 개인정보 보호법·위치정보법 적용성과 약관·신고 절차를 법률 검토했다.
- [ ] Neon 복구 범위와 리뷰 삭제·계정 종료 처리의 운영 절차를 리허설했다.
- [ ] 공개 베타 전 메일 신고를 구조화된 신고 큐와 처리 SLA로 전환했다.

## 1. 목적

이 문서는 `기능이 구현됨`을 `출시 준비 완료`로 오해하지 않게 한다. 도락의 출시는 앱 binary 배포뿐 아니라 음식점 원장, 검색 색인, 점수, 리뷰 운영, 개인정보 권리, 고객지원, 점주 권한, 예약·결제, 알림과 법적 공개가 동시에 책임 가능한 상태가 되는 일이다.

이 문서는 다음을 정의한다.

- 출시 단계를 어떻게 나누고 각 단계에서 무엇을 약속하는가
- 누가 go/no-go를 결정하고 어떤 증거가 필요한가
- 심각한 결함은 무엇이며 어떤 경우 출시를 멈추는가
- 앱스토어·웹·backend·데이터 배포를 어떻게 조율하는가
- 기능 flag, kill switch, rollback, 기능 저하를 어떻게 준비하는가
- 출시 직후 24시간·7일·30일에 무엇을 감시하고 결정하는가

체크박스 개수가 출시를 결정하지 않는다. critical 불변식과 미해결 위험의 성격이 결정한다.

---

## 2. 출시 단위

### L0. prototype

- production 개인정보·거래 없음
- 사용자 문제·mental model 검증
- 합성·허가된 데이터
- 외부 공개 서비스로 오인되지 않음

### L1. 내부 dogfood

- 직원·승인 테스터
- production-like 인프라 가능
- 실제 계정·위치·사진은 최소
- support·incident 연습 시작
- 공개 점수·예약·광고 약속 없음

### L2. closed alpha

- 초대된 소비자·점주
- 한정 지역·기능
- 명확한 테스트 고지
- 데이터 오류·리뷰 신고 수동 대응 가능
- analytics와 feedback 운영

### L3. closed beta

- 실제 발견·저장·리뷰 journey
- 지역 coverage gate
- app store test track
- 계정 종료·권리 요청·moderation SLA 운영
- 예약·결제는 별도 feature gate

### L4. 지역 공개

- 누구나 검색·가입 가능
- 약속한 지역에서 데이터·운영 SLO
- 공개 리뷰·점수 정책 적용
- 대외 지원·법률 문서·status communication
- 기능별 점주 pilot 가능

### L5. 다지역·전국 확장

- region별 coverage·품질 독립 gate
- 운영 capacity와 공급자 비용
- 검색·점수 fairness 감사
- 마케팅과 실제 서비스 가능 범위 일치

### L6. 거래·수익화 확장

- 예약·결제·점주 구독·광고는 각각 독립 launch track
- 기본 검색·리뷰 출시가 거래 기능의 자동 승인이 아님

---

## 3. 출시 원칙

### REL-P01. 범위를 숨기지 않는다

지원 지역, beta 성격, 예약 가능 지점, 번역·데이터 최신성의 한계를 사용자와 점주에게 명확히 알린다.

### REL-P02. 데이터 품질도 release artifact다

코드 version뿐 아니라 source snapshot, branch coverage, 검색 index, rating model, policy·template version을 고정하고 추적한다.

### REL-P03. 되돌릴 수 없는 기능은 늦춘다

리뷰 공개, 대량 알림, 결제 청구, 광고 과금, 어워드 발표처럼 외부 효과가 큰 기능은 dry run·승인·kill switch가 있어야 한다.

### REL-P04. 앱 update 없이 끌 수 있어야 한다

서버 API·remote config·feature flag로 고위험 기능을 안전한 기본 상태로 낮춘다. client binary rollback만 기대하지 않는다.

### REL-P05. 출시일은 법률·보안 예외를 만들지 않는다

마케팅 일정 때문에 개인정보·거래·권리·취약점 blocker를 risk accept하지 않는다.

### REL-P06. 미해결 위험에는 owner와 만료가 있다

`알고 있음`으로 끝내지 않는다. 영향, 임시 통제, 결정자, 재검토 trigger, 만료일을 기록한다.

### REL-P07. 실패를 작게 만든다

지역, 사용자 cohort, platform, traffic, 지점·점주 그룹 단위로 점진 확대한다.

---

## 4. 역할

### launch owner

전체 범위·일정·의존성·결정 기록 책임. 모든 기술 판단을 직접 내리는 사람이 아니다.

### release commander

배포 당일 실행, 통신, pause·rollback 조정. incident commander와 겹칠 수 있으나 장애 발생 시 명시적으로 역할 전환한다.

### domain approver

```text
product
engineering
data/ingestion
search/rating
trust/moderation
privacy/security/legal
operations/support
owner/reservation/payments/ads as applicable
```

### scribe

결정, 시각, 지표, 명령, 변경, incident link를 기록한다.

### executive decision owner

위험 수용과 출시/중단 최종 판단. 전문 approver가 critical blocker로 분류한 개인정보·보안·법률·금전 위험을 단순 일정 사유로 덮을 수 없다.

---

## 5. Go/No-Go 결과

```text
GO
GO_WITH_CONDITIONS
PAUSE
NO_GO
ROLLBACK
LIMIT_SCOPE
```

### GO_WITH_CONDITIONS

허용 예:

- 낮은 위험의 visual defect
- 지원 문서 보완이 정해진 시간 내 가능
- 관찰성이 충분하고 안전 fallback이 있는 비핵심 기능

필수 기록:

```text
issue
impact
temporary safeguard
owner
deadline
monitor/alert
automatic stop condition
approvers
```

### 허용하지 않는 조건부 출시

- 계정 탈취·권한 우회
- 결제 중복·금액 불일치
- 예약 oversell 불변식 실패
- 공개 점수에 광고·제외 리뷰 유입
- 개인정보 동의·권리·삭제가 작동하지 않음
- 법률상 필수 신고·약관·표시 미확정
- moderation 긴급 위해 대응 불가
- 데이터 대량 오연결·잘못된 지점 공개
- rollback/kill switch가 검증되지 않은 고위험 기능

---

## 6. release evidence packet

```text
release id/version/commit
scope and excluded features
target cohorts/regions/platforms
schema/API/event/model/policy versions
test results and exceptions
data quality report
security/privacy/legal approvals
operational readiness
SLO dashboards and alerts
capacity/cost forecast
rollback/kill-switch rehearsal
support/communication plan
known issues/risk acceptances
go/no-go signatures
```

문서 link가 존재하는 것만으로 evidence가 아니다. 실제 결과, 시각, 실행 환경, 승인자를 포함한다.

---

## 7. 범위 freeze

### feature inventory

각 feature:

```text
name
user/owner/operator surface
region/cohort
flag and safe default
dependencies
data collected
policy/legal impact
SLO/alerts
support path
rollback owner
```

### freeze 규칙

- release candidate 뒤 새 기능 추가 금지
- blocker fix는 review·targeted regression
- copy 변경도 예약·결제·동의·광고면 고위험 변경
- config·model·index·policy를 code와 함께 freeze
- emergency change의 승인·audit

### excluded scope

출시하지 않는 기능도 명시한다.

```text
예약/결제
광고
점주 유료 구독
댓글/DM
백그라운드 위치
다국어 거래
어워드
```

client에 숨겨진 미완성 endpoint·화면이 deep link로 열리지 않게 한다.

---

## 8. 제품 준비

### 핵심 journey

- [ ] 비로그인 검색·지도·지점 상세
- [ ] 정확 상호·지역·장르·초성·오탈자
- [ ] 저장과 로그인 전후 연결
- [ ] 가입·로그인·logout·session 관리
- [ ] 리뷰 작성·수정·삭제·사진
- [ ] 신고·차단·이의 제기
- [ ] 점주 claim·기본 정보 수정, 출시 범위라면
- [ ] 계정 종료·privacy choices

### 상태

- [ ] loading, empty, partial, stale, error, offline
- [ ] 폐업·이전·임시 휴업
- [ ] score 미공개·review 부족
- [ ] moderation pending·hidden
- [ ] 검색 index 지연
- [ ] 외부 지도·로그인·알림 공급자 장애

### 행동

- [ ] 중복 tap·retry가 중복 write를 만들지 않음
- [ ] back/deep link가 context를 유지
- [ ] destructive action 확인·복구 가능성
- [ ] app background·process death 후 안전 복귀
- [ ] 구버전 client와 API 호환

### trust copy

- [ ] 점수 의미와 리뷰 수
- [ ] 방문 인증 의미를 사실 보증으로 과장하지 않음
- [ ] 점주 공식 정보·사용자 정보 구분
- [ ] 광고·sponsored 구분, 출시 시
- [ ] award·편집·추천 구분, 출시 시

---

## 9. 데이터 원장 준비

### coverage report

지역·장르별:

```text
known licensed establishments
normalized branch count
active/open confidence
geocoded percentage
business hours coverage
category coverage
menu/photo coverage
duplicate candidate rate
last verified age
```

정확한 denominator가 없으면 source별 coverage와 불확실성을 표시한다.

### critical quality

- [ ] 동일 지점 중복·다른 지점 오병합 sample audit
- [ ] 주소·좌표·출입구
- [ ] 폐업·이전·재개업
- [ ] franchise 지점 이름
- [ ] 영업시간·휴무 provenance
- [ ] 전화·URL 개인정보·오연결
- [ ] 인허가 번호·대표자 정보 비공개
- [ ] 공급자 license·attribution

### change workflow

- [ ] 사용자·점주 수정 제안 intake
- [ ] field별 authority와 conflict
- [ ] merge/split rollback
- [ ] source outage·staleness
- [ ] 운영 queue capacity·SLA
- [ ] 대량 오류 kill switch·source quarantine

### 공개 범위 gate

coverage가 부족한 region은 전국 마케팅보다 검색 가능·제한 label·noindex 등 공개 전략을 정한다. 데이터가 있다는 이유로 품질을 보장하지 않는다.

---

## 10. 검색 준비

- [ ] index schema와 analyzer version 고정
- [ ] 전체 reindex·alias swap rehearsal
- [ ] source DB/index count·version reconciliation
- [ ] 한국어 형태소·초성·자모·NFC/NFD
- [ ] 상호·지점·지역·메뉴 synonym
- [ ] geo distance·viewport·경계
- [ ] 폐업·hidden·정책 제외 filter
- [ ] 점수·리뷰 count freshness
- [ ] zero-result·correction
- [ ] sponsored field가 organic rank에 미유입
- [ ] p50/p95/p99 latency·timeout
- [ ] OpenSearch 장애 시 degraded fallback

golden query set은 대표 query뿐 아니라 동명·오탈자·신규·폐업·경계 사례를 포함한다.

---

## 11. 평점·리뷰 준비

### model

- [ ] active model version·config hash·input cutoff
- [ ] shadow/backtest 결과
- [ ] 소수 리뷰 shrinkage·범위
- [ ] review eligibility와 publication 분리
- [ ] 광고·구독·인기 미유입 test
- [ ] source snapshot 재현
- [ ] 급격한 score drift alert
- [ ] model rollback·recompute

### 리뷰

- [ ] rating 입력 범위·0.5 step
- [ ] visit당 review uniqueness
- [ ] revision·사진 link 이력
- [ ] disclosure
- [ ] 개인정보·위협·spam moderation
- [ ] 작성자 수정·삭제·appeal
- [ ] 점주 직접 삭제 불가

### 공개

- [ ] score 없음과 낮은 score 구분
- [ ] 리뷰 수·기준일
- [ ] 모델 변경 공지 기준
- [ ] ranking coverage 부족 시 미발행

---

## 12. 계정·인증 준비

- [ ] provider OIDC state·nonce·PKCE
- [ ] redirect allowlist·universal/app link
- [ ] identity 자동 email 병합 금지
- [ ] short access·refresh rotation·reuse revoke
- [ ] web cookie·CSRF, mobile secure storage
- [ ] session list·개별/전체 logout
- [ ] account state·restriction 이유
- [ ] login enumeration 방지
- [ ] rate limit·credential stuffing 방어
- [ ] recovery·cooling·지원 verification
- [ ] owner/operator step-up·MFA
- [ ] 마지막 identity·owner 해제 방지
- [ ] 계정 종료와 active reservation 처리

Apple·Google review 계정은 production 사용자 권한을 우회하는 backdoor가 아니라 제한된 review fixture와 명시적 접근을 사용한다.

---

## 13. 미디어 준비

- [ ] signed upload session과 owner/purpose bound
- [ ] quarantine public ACL 금지
- [ ] magic/MIME·decode·pixel/frame budget
- [ ] sandbox·timeout·malware 후보
- [ ] EXIF/GPS·민감 metadata 제거
- [ ] normalized master·variants
- [ ] moderation·parent publication sync
- [ ] 사용자·점주·editorial rights
- [ ] 영수증·claim 증빙 bucket·role·CDN 분리
- [ ] 삭제→object→CDN purge
- [ ] corrupt/oversize/offline retry UX
- [ ] 비용·queue lag·worker failure alert

원본 quarantine URL을 앱·support ticket·analytics에 노출하지 않는다.

---

## 14. 개인정보·법률 준비

- [ ] 실제 data inventory와 처리방침 일치
- [ ] 필수·선택·목적별 처리 근거 검토
- [ ] 제3자 제공·위탁·국외 이전
- [ ] 위치정보 flow·신고·약관·동의 적용 판단
- [ ] 만 14세 미만 정책
- [ ] 정보주체 access/correction/deletion/stop
- [ ] 계정 종료·법정 보존·legal hold
- [ ] 유출·가능성 통지 포함 incident runbook
- [ ] 리뷰 삭제·이의 제기 기준
- [ ] 저작권·권리 신고
- [ ] 외부 데이터 license·attribution
- [ ] 상표·도메인·앱 이름 검토
- [ ] 전자상거래·결제·광고는 해당 feature 전 별도 승인

[LEGAL_COMPLIANCE_CHECKLIST.md](../policies/LEGAL_COMPLIANCE_CHECKLIST.md)의 해당 gate가 `approved` 또는 명시 조건 상태여야 한다.

---

## 15. 보안 준비

### architecture

- [ ] threat model 최신
- [ ] internet exposure·network boundary
- [ ] IAM least privilege·production access
- [ ] secret scanning·rotation
- [ ] encryption·KMS·backup
- [ ] dependency/container/IaC scan
- [ ] API authz·object ownership
- [ ] SSRF·upload·injection·XSS·CSRF
- [ ] rate limit·abuse

### 검증

- [ ] SAST·dependency·secret scan blocker 해결
- [ ] DAST/API authorization test
- [ ] mobile local storage·log inspection
- [ ] external penetration test 또는 위험 기반 대안
- [ ] high/critical finding disposition
- [ ] restore·key revoke·session revoke rehearsal

### 운영

- [ ] security on-call·contact
- [ ] incident severity·notification decision
- [ ] forensic log·time sync
- [ ] break-glass·audit
- [ ] vendor incident path
- [ ] vulnerability disclosure intake

---

## 16. 접근성 준비

- [ ] semantic headings·landmarks
- [ ] keyboard focus·skip·modal
- [ ] screen reader labels·announcements
- [ ] contrast·색 이외 상태
- [ ] 200% 확대·text scaling
- [ ] touch target·motion·orientation
- [ ] form label·error·timeout
- [ ] 지도 대체 목록
- [ ] 사진 alt·carousel
- [ ] 점수·광고·award 의미
- [ ] 예약·결제·취소·권리 행사 E2E
- [ ] 자동 audit + 수동 + 보조기기 사용자 test

critical journey blocker는 출시 blocker다. 단순 accessibility score만으로 승인하지 않는다.

---

## 17. 국제화 준비

한국어 전용 첫 출시에도:

- [ ] BCP 47 locale과 `ko-KR` fallback
- [ ] domain enum·오류 code 언어 중립
- [ ] 날짜·시간·금액 formatter
- [ ] 지점 timezone·현지 날짜
- [ ] Unicode NFC/NFD·자모·emoji
- [ ] 긴 문자열·pseudo locale
- [ ] server/client locale 일치
- [ ] 원문 language 저장
- [ ] 외국어 content의 안전 표시·신고

영어 등 추가 locale 공개 시:

- [ ] 핵심 journey 번역 coverage
- [ ] 원문 이름·주소 보조 표시
- [ ] 기계 번역 label·원문 보기
- [ ] moderation·support coverage
- [ ] 예약 정책 공식 번역
- [ ] SEO/hreflang·store metadata

---

## 18. analytics 준비

- [ ] event schema registry·version
- [ ] user/session/device/anonymous 경계
- [ ] event time·receive time
- [ ] consent·opt-out·privacy filter
- [ ] duplicate·retry·offline queue
- [ ] trusted dining decision 정의
- [ ] search→detail→decision journey
- [ ] review·save·reservation funnel
- [ ] quality·trust·safety guardrail
- [ ] ad/organic event 분리
- [ ] internal/test/bot traffic
- [ ] dashboard denominator·freshness
- [ ] deletion·retention·warehouse propagation

analytics 장애가 핵심 거래를 중단시키지 않게 한다. 반대로 consent가 없는 event를 `출시 모니터링에 필요`하다는 이유로 보내지 않는다.

---

## 19. SLO·capacity 준비

### 서비스

- [ ] API·web·mobile crash-free
- [ ] search availability·latency
- [ ] ingestion freshness
- [ ] score freshness
- [ ] media processing
- [ ] notification
- [ ] support/moderation queues
- [ ] reservation/booking, 해당 시

### 부하

- [ ] traffic forecast와 marketing peak
- [ ] steady·burst·soak
- [ ] DB connection·lock·replica lag
- [ ] OpenSearch shard·query pressure
- [ ] Redis/queue backlog
- [ ] object/CDN egress
- [ ] third-party quota·rate
- [ ] cost ceiling·alert

### 오류 예산

SLO와 alert가 실제 dashboard에 존재하고 on-call이 읽을 수 있어야 한다. 임계값은 pilot baseline과 사용자 영향으로 조정하며 문서 속 숫자만 복사하지 않는다.

---

## 20. 인프라·배포 준비

- [ ] IaC plan review·state 보호
- [ ] environment 분리
- [ ] migration expand/migrate/contract
- [ ] backup·PITR·restore test
- [ ] search alias rollback
- [ ] outbox·consumer replay
- [ ] feature flag owner·expiry
- [ ] canary/blue-green strategy
- [ ] container provenance·SBOM 후보
- [ ] observability correlation IDs
- [ ] deploy audit·approval
- [ ] disaster recovery dependency map

schema destructive contract는 구버전 앱·worker가 사라진 뒤 별도 release로 수행한다.

---

## 21. 운영 준비

### queue

- [ ] branch create/update/merge/split
- [ ] point owner claim·dispute
- [ ] review/photo moderation
- [ ] rights/legal requests
- [ ] account recovery/restriction
- [ ] privacy rights
- [ ] security incidents
- [ ] reservation/payment, 해당 시
- [ ] ad review/billing, 해당 시

### 도구

- [ ] case 상태·SLA·assignment
- [ ] field-level redaction
- [ ] reason code·decision template
- [ ] maker-checker
- [ ] audit log
- [ ] no impersonation
- [ ] search by safe identifier
- [ ] bulk action 제한·preview

### 인력

- [ ] 예상 volume·handling time·coverage
- [ ] 한국 시간 peak·주말·휴일
- [ ] urgent escalation
- [ ] training·calibration
- [ ] abuse/harassment protection
- [ ] backlog degraded mode

---

## 22. 고객지원 준비

- [ ] public help center
- [ ] account/login/recovery
- [ ] branch info correction
- [ ] review/report/appeal
- [ ] point owner claim
- [ ] privacy/deletion
- [ ] accessibility
- [ ] reservation/payment/refund, 출시 시
- [ ] ad/subscription/billing, 출시 시
- [ ] incident/status communication

### support console

- [ ] identity verification steps
- [ ] PII default masked
- [ ] sensitive evidence secure upload
- [ ] approved templates
- [ ] refund/credit approval limits
- [ ] legal/security escalation
- [ ] support notes retention

### self-service

핵심 권리·해지·삭제·세션 해제를 이메일 요청만으로 숨기지 않는다. self-service 실패 시 접근 가능한 지원 fallback을 제공한다.

---

## 23. 알림 준비

- [ ] category와 legal basis/consent
- [ ] security·transactional·marketing 분리
- [ ] template locale/version
- [ ] provider credentials·quota
- [ ] retry·dedupe·suppression
- [ ] push token invalidation
- [ ] opt-out·withdrawal propagation
- [ ] deep link auth/context
- [ ] sensitive preview 최소화
- [ ] delivery dashboard·escalation
- [ ] test account/phone/email suppression

대량 발송 전 dry-run recipient count, sample render, approval, abort가 있어야 한다.

---

## 24. 웹 출시

- [ ] production domain·TLS·HSTS 정책
- [ ] DNS·CDN·WAF
- [ ] robots·sitemap·canonical·structured data
- [ ] branch public URL stability
- [ ] SSR/hydration·error boundary
- [ ] cache·stale invalidation
- [ ] login callback·cookie scope·CSRF
- [ ] CSP·security headers
- [ ] privacy·terms·help·contact footer
- [ ] analytics consent·preferences
- [ ] mobile responsive·browser matrix
- [ ] performance budgets·Core Web Vitals 관측
- [ ] noindex인 preview/admin/staging

점주·운영 portal이 consumer sitemap·search engine에 노출되지 않게 한다.

---

## 25. iOS 출시

- [ ] bundle ID·signing·team ownership
- [ ] production entitlements·associated domains
- [ ] universal link·OAuth redirect
- [ ] push environment
- [ ] permission usage descriptions
- [ ] camera/photo/location 실제 필요 시점 요청
- [ ] secure storage·backup behavior
- [ ] crash symbolication
- [ ] supported OS/device matrix
- [ ] TestFlight cohort·feedback
- [ ] app review demo account/mode와 sample data
- [ ] backend·review notes·contact
- [ ] privacy policy URL·privacy answers
- [ ] 계정 생성 시 app 내 계정 삭제 정책 검토
- [ ] store screenshots·description·support URL 정확성
- [ ] staged/manual release와 server flags

Apple guideline은 지속 변경되는 문서이므로 제출 직전에 최신 [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)와 [App privacy 관리 안내](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)를 다시 대조한다. third-party SDK의 data practice도 privacy 응답에 포함될 수 있음을 확인한다.

---

## 26. Android 출시

- [ ] application ID·signing key·Play App Signing
- [ ] app links·OAuth redirect
- [ ] push configuration
- [ ] runtime permission과 prominent disclosure
- [ ] target SDK·device/OS matrix 최신 정책 확인
- [ ] secure storage·backup
- [ ] crash/ANR symbol·mapping
- [ ] internal/closed test
- [ ] review 접근·sample data
- [ ] privacy policy
- [ ] Data safety form과 SDK 포함 실제 data flow 일치
- [ ] 계정 생성 시 app 내·web account deletion path
- [ ] content rating·store listing·support
- [ ] staged rollout과 halt

제출 전 최신 [Google Play Data safety 안내](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)와 [계정 삭제 요구사항](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)을 다시 확인한다. Play Console 답변은 production뿐 아니라 배포 중인 track·SDK 동작까지 실제 상태와 맞아야 한다.

---

## 27. 앱스토어 metadata

### 공통

- [ ] 앱 이름·subtitle·description이 실제 기능과 일치
- [ ] 타 서비스 상표·화면 무단 사용 없음
- [ ] screenshot에 가짜 점수·리뷰·예약을 실제처럼 표시하지 않음
- [ ] 광고·premium 기능을 숨기지 않음
- [ ] 지원 email·URL 작동
- [ ] privacy policy public·mobile readable
- [ ] locale별 번역 검수
- [ ] age/content rating
- [ ] release notes

### privacy declaration 대조

```text
app manifest permissions
network capture
SDK inventory
privacy inventory
Apple privacy responses
Google Data safety
public privacy policy
consent/preferences UI
```

이 여섯 항목의 불일치는 release blocker로 다룬다.

---

## 28. 점주 기능 출시 gate

- [ ] organization·member·branch authority
- [ ] claim proof 최소화·retention
- [ ] conflict·appeal
- [ ] official field provenance·review
- [ ] point owner response policy
- [ ] 역할별 권한·step-up
- [ ] 퇴사자·last owner·transfer
- [ ] customer reservation PII 제한
- [ ] audit·export·bulk action
- [ ] free vs paid entitlement 경계
- [ ] 점주 support·training

소비자 검색과 동시에 모든 점주 기능을 공개할 필요는 없다. 소수 지점·조직 pilot으로 권한·운영을 검증한다.

---

## 29. 예약·결제 출시 gate

### 예약

- [ ] resource·slot·hold·allocation 불변식
- [ ] concurrent last inventory test
- [ ] canonical 상태·history
- [ ] requested/confirmed/change proposal
- [ ] cancellation/no-show policy snapshot
- [ ] 연락처 access·purpose·retention
- [ ] point owner·사용자 notification
- [ ] external/phone inventory coexistence

### 결제

- [ ] 법적·계약 역할·PG·정산 구조
- [ ] amount/currency/idempotency
- [ ] authorization/capture/refund
- [ ] webhook signature·replay·out-of-order
- [ ] unknown 상태 reconciliation
- [ ] duplicate charge prevention
- [ ] invoice·receipt·tax
- [ ] chargeback·refund support

### rollout

- 제한된 지점·service period·payment method
- 낮은 일 거래 한도
- 수동 reconciliation
- 24/7 critical escalation 또는 기능 시간 제한
- oversell·duplicate charge kill switch

---

## 30. 광고·구독 출시 gate

### 독립성

- [ ] 광고 후보·rank·event가 organic과 분리
- [ ] 광고 spend가 score/review/award에 미유입
- [ ] 영업·심사·trust·재무 권한 분리
- [ ] 모든 surface의 광고 label

### billing

- [ ] contract·plan·price version
- [ ] entitlement가 무료 claim 권리를 제거하지 않음
- [ ] usage→invoice lineage
- [ ] invalid traffic·credit
- [ ] payment·refund·reconciliation
- [ ] 해지·grace·data access

### rollout

- claim된 소수 advertiser
- 수동 creative review
- 정액 또는 단순 과금
- 낮은 budget cap
- organic holdout
- fail-closed 광고, organic 정상

---

## 31. 어워드 출시 gate

- [ ] data·region·category coverage
- [ ] 방법·cutoff·snapshot
- [ ] conflict·gift·recusal
- [ ] 광고·영업 방화벽
- [ ] panel·quorum·maker-checker
- [ ] embargo·atomic publish
- [ ] 방법론·연도·badge 접근성
- [ ] correction/suspend/withdraw
- [ ] point owner mark license
- [ ] 법률·상표 검토

검색 서비스 출시 성공이 어워드 출시 승인을 뜻하지 않는다.

---

## 32. 리서치 gate

- [ ] 핵심 문제와 최근 행동 인터뷰
- [ ] 검색·상세 usability
- [ ] 점수·광고·점주 정보 이해
- [ ] 리뷰 작성 부담·privacy
- [ ] 점주 claim·정보 수정
- [ ] 접근성 핵심 journey
- [ ] 반증·제한 사항
- [ ] 미검증 가정 research debt
- [ ] finding→제품 결정 기록

critical flow가 내부 team에게만 테스트되었다면 일반 사용자 준비 완료로 표시하지 않는다.

---

## 33. 지원 지역 gate

각 지역은 독립 scorecard를 가진다.

```text
registry coverage/confidence
search golden queries
branch error reports
point owner availability
review supply/integrity
operations staffing
support volume
map/provider quality
marketing claim
```

전국 앱스토어 공개와 전국 품질 보장을 같은 것으로 표현하지 않는다. coverage 미달 지역은 검색 가능 범위, label, 마케팅을 조정한다.

---

## 34. beta 참가자 운영

- [ ] 대상·초대 기준
- [ ] beta 고지와 지원 범위
- [ ] consent·privacy가 정식 서비스와 일치
- [ ] feedback channel
- [ ] known issue page
- [ ] 계정·데이터의 정식 전환/삭제 정책
- [ ] point owner·reviewer 보상 독립성
- [ ] abuse·leak 대응
- [ ] exit survey와 cohort 분석

beta라는 label이 개인정보·보안·결제 의무를 면제하지 않는다.

---

## 35. feature flag·kill switch

### flag metadata

```text
owner
purpose
default
target cohort/region/platform
dependencies
created/expiry
safe off behavior
audit
```

### 필수 kill switch 후보

- review publish
- media upload/publication
- rating publish/recompute
- recommendation personalization
- marketing notification
- point owner writes/bulk export
- reservation new booking
- payment capture/refund automation
- ad delivery/billing
- award publication
- external provider integration

### test

- production-like environment
- off 후 in-flight 처리
- cache/index propagation
- old client behavior
- user·owner messaging
- data reconciliation

flag는 영구 architecture가 아니다. 만료·제거 backlog를 둔다.

---

## 36. rollback 전략

### code

- 이전 image·deployment artifact
- forward-compatible DB
- canary rollback
- worker·consumer version coordination

### schema

- destructive rollback 대신 expand/contract
- write path compatibility
- failed backfill resume·revert marker
- migration checksum·lock

### data

- source batch quarantine
- entity change inverse/merge split plan
- search index alias revert
- rating snapshot republish
- event replay watermark

### policy·content

- template/policy version rollback
- 잘못된 bulk moderation reversal
- CDN/search removal
- notice·appeal

### mobile

앱스토어 binary는 즉시 모든 기기에서 되돌릴 수 없다.

- server capability negotiation
- backward-compatible API
- remote flag
- mandatory update는 최후 수단
- 오래된 version 최소 지원 window
- hotfix 준비

### 금전

결제·invoice·광고 과금은 단순 DB rollback 금지. 신규 처리 중지, reconciliation, reversal·refund·credit로 교정한다.

---

## 37. dry run

출시 1~2주 전 production-like rehearsal:

1. release candidate 배포
2. migration·backfill
3. ingestion·index·score
4. synthetic 핵심 journey
5. feature flag 단계 활성화
6. alert 발생·on-call 응답
7. kill switch
8. rollback·restore
9. support·moderation case
10. 개인정보 요청
11. incident communication
12. evidence packet 갱신

예약·결제 출시에는 duplicate webhook·unknown payment·refund·정산 mismatch tabletop을 추가한다.

---

## 38. 시간표

### D-30

- scope·region·cohort freeze 초안
- legal/privacy/app store gap
- capacity·vendor quota
- support·operations staffing
- store account·signing ownership
- launch dashboard 정의

### D-14

- feature complete
- data quality audit
- security/accessibility test
- store metadata·review build
- dry run 1
- public policies·help center
- known issue triage

### D-7

- release candidate freeze
- production migration rehearsal
- app store submission, 일정 buffer 포함
- on-call·war room
- support training
- go/no-go evidence draft

### D-2

- critical regression
- data/index freshness
- backups·restore proof
- flags·kill switches
- status·communication drafts
- final legal·privacy changes

### D-1

- final go/no-go
- no nonessential deploy
- dashboard·alert test
- contact tree
- store release mode 확인

### D0

- infrastructure/code canary
- internal smoke
- cohort 1%
- health window
- 5%→25%→50%→100% 또는 계획 단계
- 각 단계 go/no-go 기록

고정 시간표는 예시다. 지표·incident·store review에 따라 pause한다.

---

## 39. 출시 dashboard

### 기술

```text
availability/error/latency
mobile crash-free/ANR
DB/search/queue health
provider errors
deploy/version distribution
```

### 제품

```text
search success/zero result
branch detail conversion
save/review completion
login/recovery failure
account deletion success
```

### 데이터·신뢰

```text
branch correction/duplicate/closure reports
index lag
score drift
review/photo moderation queue
spam/fraud signals
appeal volume
```

### 운영

```text
support contacts by severity
first response/resolution
claim queue
privacy/legal requests
operator error
```

### 거래, 출시 시

```text
slot/hold conflict
booking confirmation
payment unknown/duplicate/refund
notification delivery
reconciliation mismatch
ad spend/invalid traffic
```

절대 count와 비율, denominator, baseline, freshness를 함께 표시한다.

---

## 40. 중단 기준

즉시 pause/rollback 후보:

- 계정 간 개인정보 노출
- 권한 없는 점주·예약자 데이터 접근
- 결제 중복·잘못된 금액·광범위 unknown
- 예약 oversell·상태 손실
- 대량 branch 오병합·잘못된 폐업
- 삭제된/hidden 콘텐츠 재노출
- 공개 score의 비정상 대량 변화
- 광고를 organic으로 표시
- 동의 없는 대량 마케팅 발송
- 심각한 보안 공격·credential 유출
- 앱 crash/login failure로 핵심 task 불가
- 법률·스토어 정책상 즉시 중단 필요

제한 scope 후보:

- 특정 region data 오류
- 특정 provider 장애
- 특정 platform version
- media upload backlog
- recommendation 장애
- point owner write 문제

중단 threshold는 release 전 metric과 duration을 구체화하되, 단일 privacy·금전 critical incident는 비율 threshold를 기다리지 않는다.

---

## 41. 커뮤니케이션

### 내부

```text
launch channel
current phase
metrics/status
open incidents
decisions and owner
next checkpoint
```

명령·결정은 여러 DM에 흩어지지 않게 한다.

### 사용자

- 무엇이 영향을 받는가
- 현재 할 수 있는 것
- 결제·예약·데이터 안전 여부
- 예상 업데이트 시점, 모르면 약속하지 않음
- workaround
- 다음 공지

### 점주

지점 정보·예약·광고·정산 영향과 필요한 행동을 별도로 설명한다. 내부 오류 세부로 책임을 점주에게 전가하지 않는다.

### 규제·공급자·store

법률·계약·incident runbook에 따른 owner가 처리한다. 공개 status와 기관 통지의 내용·시점이 모순되지 않게 법무와 조율한다.

---

## 42. 첫 24시간

- 15~30분 단위 초기 health checkpoint
- cohort별 crash·login·search
- branch error·support·moderation triage
- data/index/model version 확인
- unexpected cost·quota
- store review·user review signal, 맥락 포함
- feature flag 변경 기록
- critical incident 즉시 role 전환
- 비필수 deploy freeze

마케팅 traffic을 기술 지표가 안정되기 전에 한 번에 열지 않는다.

---

## 43. 첫 7일

- cohort·region·platform 품질 비교
- 검색 query·zero-result audit
- branch correction root cause
- review 작성·moderation quality
- 로그인·recovery·deletion
- accessibility·support issue
- vendor quota·cost
- SLO/error budget
- research feedback session
- known issue 상태
- 다음 rollout decision

출시 축하 지표와 함께 trust guardrail을 검토한다. 다운로드·가입 증가가 데이터 오류·신고·탈퇴를 가리지 않게 한다.

---

## 44. 30일 review

### 결과

- 핵심 가치·retention·trusted decision
- region coverage·품질
- review supply·integrity
- point owner adoption
- support·operations capacity
- 개인정보·권리·incident
- 비용·성능·vendor
- accessibility·language

### 결정

```text
expand region/cohort
hold and improve
narrow feature
change architecture/policy
stop feature
start next gate
```

### 산출물

- launch review
- incidents·near misses
- metric definition correction
- research findings
- debt·risk register
- ADR·roadmap update
- flag cleanup

---

## 45. 최종 Go/No-Go 회의 agenda

1. 목표·scope·사용자 약속
2. 변경된 것과 미출시 기능
3. critical journey test
4. data/search/rating quality
5. privacy/security/legal
6. accessibility
7. operations/support capacity
8. SLO/capacity/cost
9. app store status
10. known risks·conditions
11. rollback·kill-switch proof
12. 각 approver vote·reason
13. next checkpoint·communication

회의에서 처음 blocker를 발견하지 않도록 evidence packet은 사전 배포한다.

---

## 46. launch decision record

```text
release id:
date/time/timezone:
scope/cohort/regions/platforms:
decision: GO | GO_WITH_CONDITIONS | PAUSE | NO_GO

critical evidence:
- product
- data/search/rating
- privacy/security/legal
- operations/support
- infrastructure/SLO
- store/distribution

accepted risks:
- issue / safeguard / owner / expiry / stop condition

rollback plan tested at:
next checkpoint:
approvers and dissent:
```

반대 의견과 조건을 회의록에서 지우지 않는다.

---

## 47. 공식 배포 기준 링크

store 정책은 바뀔 수 있으므로 제출 직전에 최신 원문을 다시 확인한다.

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple App privacy 관리](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [Apple App privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en-gb)

---

## 48. 미결정 사항

- 첫 공개 지역·동네와 coverage 기준
- closed beta 참가자 수·기간
- iOS·Android·web 동시 공개 여부
- 최소 지원 OS·browser
- initial traffic ramp 단계와 health window
- crash-free·search success·support stop threshold
- 첫 24시간 on-call coverage
- app store 계정·법인 owner
- beta 데이터의 정식 전환 방식
- 공개 status page 초기 도입 범위
- external security test 시점
- 지역 공개와 전국 store listing 문구
- 예약·결제 pilot 지점·거래 한도
- 점주·광고 기능의 별도 launch calendar

---

## 49. 연관 문서

- [ROADMAP.md](../product/ROADMAP.md)
- [PRODUCT.md](../product/PRODUCT.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [DEPLOYMENT_ENVIRONMENTS.md](./DEPLOYMENT_ENVIRONMENTS.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [SLO_RUNBOOKS.md](./SLO_RUNBOOKS.md)
- [OPERATIONS.md](./OPERATIONS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [LEGAL_COMPLIANCE_CHECKLIST.md](../policies/LEGAL_COMPLIANCE_CHECKLIST.md)
- [AUTH_IDENTITY.md](../architecture/AUTH_IDENTITY.md)
- [MEDIA_PIPELINE.md](../features/MEDIA_PIPELINE.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
- [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)
- [INTERNATIONALIZATION.md](../features/INTERNATIONALIZATION.md)
- [RESEARCH_PLAN.md](../product/RESEARCH_PLAN.md)
- [ADVERTISING_MONETIZATION.md](../features/ADVERTISING_MONETIZATION.md)
- [EDITORIAL_AWARDS.md](../features/EDITORIAL_AWARDS.md)
- [ADR_INDEX.md](../adr/README.md)
