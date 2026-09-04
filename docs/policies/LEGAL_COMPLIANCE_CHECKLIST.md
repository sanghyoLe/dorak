# 도락 법률·규제·정책 출시 체크리스트

| 항목 | 내용 |
| --- | --- |
| 문서 상태 | Working Draft — 법률 검토 전 |
| 문서 버전 | 0.1.0 |
| 기준일 | 2026-09-02, Asia/Seoul |
| 적용 시장 | 대한민국 우선 |
| 주요 독자 | 창업자, 제품, 법무, 개인정보, 보안, 운영, 점주, 결제, 광고 |

## 1. 문서의 성격

이 문서는 법률 자문이나 적용 법령의 최종 해석이 아니다. 도락의 제품·데이터·운영 설계를 실제 법률 검토로 연결하기 위한 issue register와 출시 gate다.

법률 의무는 다음에 따라 달라질 수 있다.

- 도락이 거래의 당사자인지 중개자인지
- 예약금·결제대금을 직접 받거나 정산하는지
- 개인위치정보를 수집·이용·제공하는지
- 사용자 리뷰·사진을 단순 매개하는지 편집·광고에 재사용하는지
- 국내외 법인·서버·수탁자 구조
- 처리하는 개인정보의 종류·규모
- 광고·구독·예약 상품의 실제 계약 구조
- 청소년 이용 가능 범위

따라서 `법에 맞을 것 같음`을 출시 승인으로 사용하지 않는다. 각 항목에 법률 의견, 제품 증빙, 운영 절차, 책임자와 검토일을 연결한다.

---

## 2. 사용 방법

### 2.1 상태

```text
not_assessed
researching
legal_review_required
design_change_required
implementation_in_progress
evidence_pending
approved_with_conditions
approved
not_applicable_with_rationale
blocked
```

`not_applicable`에는 반드시 판단자, 근거, 적용하지 않는 제품 조건과 재검토 trigger가 있어야 한다.

### 2.2 위험

```text
critical: 출시 중단 또는 중대한 권리·금전·제재 위험
high: 기능 출시 전 법률·운영 gate 필요
medium: 단계 출시·보완 가능, 명시 조건 필요
low: 문서·표시·운영 개선 중심
```

### 2.3 증빙

```text
법률 의견서 또는 검토 메모
적용 역할·거래 flow diagram
화면·문구 snapshot과 version
정책·약관 version
DB schema·보존 rule
테스트 결과
운영 runbook과 교육 기록
계약·수탁자·공급자 부속서
신고·등록·보험·보증 문서
감사 로그 sample
```

### 2.4 register 최소 필드

```text
issue_id
domain
product surface
question
potential authority/source
applicability facts
risk
owner
legal reviewer
status
required evidence
decision and conditions
effective/review date
change triggers
linked release
```

---

## 3. 기준일과 법령 변경 경보

기준일 현재 확인된 중요한 변화:

- 개인정보 보호법 현행 기준은 2025-10-02 시행본을 확인하되, 법률 제21445호의 주요 개정이 2026-09-11부터 단계적으로 시행될 예정이므로 출시 설계는 개정 반영 여부를 별도 확인한다.
- 전자상거래법은 2026-07-21 시행 개정본과 일부 2027-01-21 시행 예정 조항을 함께 추적한다. 특히 온라인 사용후기 삭제 기준과 이의 제기 절차 관련 개정이 도락에 어떻게 적용되는지 법률 검토한다.
- 정보통신망법은 2026-07-07 시행본의 광고성 정보 전송 규율을 확인한다.
- 위치정보법은 2025-10-01 시행본을 기준으로 서비스 유형과 신고·약관·동의 적용 여부를 확인한다.
- 전자금융거래법에는 2026-12-17 시행 예정 개정이 있으므로 예약금 보유·PG·정산 구조를 확정하기 전에 다시 검토한다.
- 저작권법은 2026년 개정 시행본과 복제·전송 중단 절차를 출시 시점에 재확인한다.

법령명만 문서에 적어 두는 것으로 충분하지 않다. 효력일, 하위법령, 고시·지침, 실제 서비스 사실관계를 함께 검토한다.

---

## 4. 출시 전 법적 역할 확정

### LEG-ROLE-001. 법인과 서비스 제공자

- 계약 당사자 법인명·대표자·주소·연락처
- 도메인·앱스토어 판매자·결제 명의 일치
- 개인정보처리자와 서비스 제공자
- 국외 법인·국내대리인 적용 여부
- 점주·사용자·PG·예약 파트너와의 계약 관계

증빙:

- 법인·사업자 문서
- footer·약관·privacy·invoice snapshot
- entity relationship chart

### LEG-ROLE-002. 음식점 정보 제공자

도락이 공공·점주·사용자 자료를 정규화해 공개할 때 데이터별 역할과 책임을 정한다.

질문:

- 사실 정보와 편집 의견의 구분
- 업데이트·오류 정정 의무와 표현
- 폐업·이전·상호 분쟁 처리
- 외부 API·공공데이터 재배포 권한
- 사용자에게 정보 정확도를 보장한다고 오인시키는 표현

### LEG-ROLE-003. 통신판매업자·통신판매중개자

점주 구독, 광고, 예약금, 쿠폰·프로모션에서 도락과 음식점 중 누가 무엇을 판매하는지 flow별로 확정한다.

```text
consumer -> restaurant contract?
consumer -> Dorak booking service contract?
owner organization -> Dorak subscription/ad contract
Dorak -> restaurant settlement?
```

한 화면에서 상품마다 역할이 다를 수 있다. 약관에 `중개자`라고 쓰는 것만으로 실제 역할이 결정된다고 가정하지 않는다.

### LEG-ROLE-004. 결제·정산 역할

- 도락이 이용자 자금을 보유하는가
- PG가 merchant of record인지 단순 결제대행인지
- 예약금의 채권자가 누구인지
- 취소·환불 의무자
- 음식점에 대한 정산 시점과 상계
- chargeback·미정산·폐업 위험 부담
- 전자금융업 등록·예외·정산자금 보호 적용 여부

서비스 flow와 계약이 확정되기 전 자체 wallet·선불 balance·점주 정산금을 구현하지 않는다.

### LEG-ROLE-005. 위치정보 서비스 역할

- 단말 위치를 요청하는가
- 개인을 식별할 수 있는 계정과 위치를 결합하는가
- 위치를 제3자에게 제공하는가
- 지도 viewport만 처리하는가 장기 history를 저장하는가
- 백그라운드 위치를 사용하는가
- 위치기반서비스사업 신고 등 적용 여부

### LEG-ROLE-006. 온라인서비스제공자·게시판 운영자

리뷰·사진·프로필·댓글·점주 답글의 hosting, moderation, 권리 신고·복구, 불법정보 대응에서 도락의 의무와 보호 요건을 법률 검토한다.

---

## 5. 사업 신고·등록·조직 체크

| ID | 질문 | 출시 조건 |
| --- | --- | --- |
| LEG-REG-001 | 사업자등록 업종·종목이 실제 상품과 맞는가 | 세무 검토 |
| LEG-REG-002 | 통신판매업 신고가 필요한가 | 구독·광고·소비자 거래 flow 검토 |
| LEG-REG-003 | 부가통신사업 신고·예외가 적용되는가 | 서비스 규모·형태 검토 |
| LEG-REG-004 | 위치기반서비스사업 또는 관련 신고·약관 의무가 있는가 | 위치 data flow 확정 후 법률 검토 |
| LEG-REG-005 | 전자금융업 등록·예외 또는 PG 계약만으로 가능한가 | 자금 flow 확정 전 critical gate |
| LEG-REG-006 | CPO/CISO 지정·신고·겸직 기준이 적용되는가 | 조직·규모 기반 검토 |
| LEG-REG-007 | ISMS 또는 다른 인증 의무·예정 기준에 해당하는가 | 매출·이용자·처리 규모 정기 점검 |
| LEG-REG-008 | 국내대리인 요건이 있는가 | 법인 위치·매출·처리 규모 검토 |
| LEG-REG-009 | 세금계산서·현금영수증·부가세 처리가 준비됐는가 | 세무·PG 검토 |
| LEG-REG-010 | 책임보험·배상 준비가 필요한가 | 개인정보·결제·계약 위험 검토 |

신고 번호가 필요한 공개 문구와 변경 신고·폐업 절차까지 owner를 둔다.

---

## 6. 필수 공개 문서 세트

### 6.1 사용자

- 서비스 이용약관
- 개인정보 처리방침
- 위치기반서비스 이용약관, 적용되는 경우
- 커뮤니티·리뷰·사진 정책
- 리뷰 신고·제한·삭제·이의 제기 기준
- 예약·취소·환불·노쇼 정책
- 결제·예약금·수수료 표시
- 광고·추천·협찬 표시 정책
- 저작권·권리 신고 절차
- 청소년·주류 관련 정책, 적용되는 경우

### 6.2 점주

- 점주 플랫폼 이용약관
- claim·권한·분쟁 정책
- 공식 정보·메뉴·사진 제출 조건
- 리뷰 답글·신고·이의 제기 기준
- 예약 서비스 계약·정산·취소·개인정보 역할
- 광고 계약·심사·무효 트래픽·credit
- 구독·자동결제·해지·환불
- 데이터 처리·수탁·공동처리 역할
- API·integration·보안 조건

### 6.3 내부

- 개인정보 내부관리계획
- 보안·접근통제 정책
- 유출·침해사고 대응 plan
- 정보주체 요청 runbook
- 보존·파기 schedule
- 법적 hold·수사기관 요청 정책
- 콘텐츠 moderation·긴급 대응
- 권리 신고·복구 절차
- 광고 심사와 판매 독립 정책
- 결제 조정·refund·chargeback
- 운영자 권한·감사·break-glass

### 6.4 문서 공통

- version과 효력일
- 변경 이유·이전 version
- 언어별 공식성·우선 언어
- 동의 또는 고지 근거
- 적용 대상과 예외
- 문의·권리 행사 경로
- 화면에서 실제 동작과 일치

---

## 7. 개인정보 처리 inventory

### LEG-PRI-001. 처리활동 기록

각 처리 목적마다 다음을 작성한다.

```text
purpose
data subjects
data fields and sensitivity
source
legal basis to be reviewed
required/optional
use and decision
recipient/processor
storage region
retention and deletion
access roles
security controls
data subject controls
product owner
```

`서비스 제공` 하나에 로그인, 추천, 광고, 예약, 보안, 분석, 마케팅을 모두 넣지 않는다.

### LEG-PRI-002. 주요 dataset

- 로그인 identity·세션·복구
- 공개 프로필·팔로우·차단
- 리뷰·사진·반응·신고
- 방문·예약·예약자 연락처
- 영수증·위치·결제 방문 인증
- 점주 신원·사업자·권한 증빙
- 광고·구독·invoice 담당자
- 검색·클릭·추천·광고 event
- 고객지원·분쟁·법적 요청
- 보안·fraud·device·IP signal
- 운영자 감사 로그

### LEG-PRI-003. 공개 정보도 검토

사용자가 공개한 프로필·리뷰도 개인정보일 수 있다. 공개 상태를 무제한 재사용·판매·외부 AI 학습의 근거로 취급하지 않는다.

---

## 8. 개인정보 적법성·투명성

### LEG-PRI-010. 처리 근거

각 목적에서 동의, 계약 이행, 법적 의무 등 적용 가능한 근거를 법률 검토한다. 동의가 편하다는 이유로 모든 처리를 선택 동의로 만들거나, 계약 이행을 마케팅·행동 광고에 과도하게 확장하지 않는다.

### LEG-PRI-011. 필수·선택 분리

- 가입에 필요한 값
- 예약에만 필요한 값
- 위치·방문 인증에 필요한 값
- 개인화·분석·마케팅 선택
- 점주 권한 확인

선택 동의 거절로 핵심 서비스 전체를 부당하게 막지 않는다. 실제로 필수인지를 flow별로 설명한다.

### LEG-PRI-012. 개인정보 처리방침

- 실제 schema·SDK·vendor와 일치
- 수집 항목을 `등`으로 과도하게 숨기지 않음
- 목적·보유기간·제3자 제공·처리위탁·국외이전
- 자동화된 결정·행태정보 등 적용 항목 검토
- 위치·쿠키·광고·추천과 사용자 제어
- CPO·권리 행사·분쟁 경로
- 변경 이력

개인정보보호위원회의 최신 작성지침과 2026-09-11 이후 개정 의무를 출시 전 다시 대조한다.

### LEG-PRI-013. 목적 변경

예약 연락처를 리뷰 추천·광고 targeting·점주 CRM으로 자동 전환하지 않는다. 새로운 사용은 호환 가능성·동의·고지 등 근거를 검토하고 데이터 flow를 변경한다.

### LEG-PRI-014. 최소 수집

- 주민등록번호 기본 수집 금지 방향
- 점주 claim도 필요한 최소 사업·권한 증빙
- 영수증의 카드번호·승인번호·전화 OCR 비저장 또는 마스킹
- 위치는 요청 순간·거친 지역 우선
- 예약 동행자 정보 최소화
- 광고 fraud용 IP·device 보존 제한

---

## 9. 개인정보 권리

### 지원 flow

```text
access
correction
deletion
processing suspension
consent withdrawal
account closure
complaint/dispute
automated decision rights if applicable
representative request
```

### LEG-PRI-020. 본인 확인

권리 행사자는 안전하게 확인하되, 자기 데이터 요청을 위해 기존 처리보다 더 과도한 신분증을 상시 수집하지 않는다. 대리인·사망자·탈취 계정·점주 조직 요청을 분리한다.

### LEG-PRI-021. 제3자 권리

한 사용자의 export에서 팔로워, 동행자, 예약 메모, 점주 개인 연락처, 운영자 메모와 fraud 신호를 그대로 노출하지 않는다. 제한·거절 사유와 이의 제기 문구를 법률 검토한다.

### LEG-PRI-022. 삭제와 보존

```text
user deletion choice
 -> immediate access restriction where appropriate
 -> dataset-specific delete/anonymize/retain
 -> search/cache/CDN/vendor propagation
 -> legal/transaction/fraud hold isolation
 -> completion evidence
```

계정 종료와 공개 리뷰 삭제, 법정 거래 기록, 분쟁 증빙, 백업 만료를 하나의 `deleted_at`으로 처리하지 않는다.

### LEG-PRI-023. SLA

법정 응답 기간과 내부 더 짧은 목표를 구분한다. queue, 담당자, 연장·거절 통지, 완료 증빙을 운영 시스템으로 관리한다.

---

## 10. 위탁·제3자 제공·공동 역할

### 수탁자 후보

- cloud·database·CDN
- email·SMS·push
- 오류·관측성·분석
- 고객지원
- OCR·번역·moderation·AI
- identity provider
- PG·결제·세금 문서
- 지도·지오코딩
- 예약 partner

### LEG-PRI-030. 분류

`API를 쓴다`는 설명으로 위탁과 제3자 제공을 결정하지 않는다. 목적·지시·독립 이용·계약·사용자 기대를 기준으로 법률 검토한다.

### LEG-PRI-031. 계약

- 처리 목적·항목·기간
- 재위탁
- 접근·암호화·사고 통지
- 삭제·반환
- audit·증빙
- 국외 처리 위치
- 모델 학습 재사용 금지 또는 조건
- 종료·vendor 전환

### LEG-PRI-032. inventory 일치

privacy 문서, vendor registry, IAM, 네트워크 egress, 실제 SDK를 정기 대조한다. 승인되지 않은 SaaS·SDK를 production 데이터에 붙이지 않는다.

---

## 11. 국외 이전

### 질문

- 어느 국가·법인으로 어떤 데이터가 이전되는가
- 전송 시점·방법·목적·보유기간
- 직접 제공, 처리위탁, 보관 중 무엇인가
- 적용 가능한 이전 근거와 고지·동의
- 거부 방법과 서비스 영향
- 재이전과 정부 접근 위험
- 삭제·권리 행사·incident 협력

cloud region이 서울이어도 support, telemetry, backup, CDN log, AI API가 국외로 나갈 수 있다. 공급자의 본사 소재지만 보고 이전 여부를 단정하지 않는다.

출시 증빙:

- data transfer map
- vendor·subprocessor list
- 계약 부속서
- privacy 문구·동의 화면
- 실제 region·log 설정 screenshot
- 삭제 test

---

## 12. 개인정보 안전조치와 사고 대응

### LEG-SEC-001. 예방

- least privilege와 역할 분리
- 운영자 MFA·managed identity
- 비밀·key 관리와 회전
- 전송·저장 암호화
- field-level 보호가 필요한 identity·예약·증빙
- 로그 masking·access audit
- 취약점·dependency·container 관리
- backup·restore와 삭제 경계
- 수탁자 관리
- 정기 권한 검토

### LEG-SEC-002. 유출·가능성 통지 개정

2026-09-11 시행 예정 개정에는 유출 가능성을 알게 된 경우의 통지 등 변화가 포함되어 있으므로, 정확한 적용 조건·하위법령·통지 항목과 시한을 법률 검토한다.

runbook은 최소 다음을 갖는다.

```text
detect
contain
classify affected data/subjects
preserve evidence
legal notification decision
regulator/data subject/vendor communication
remediation
post-incident review
```

### LEG-SEC-003. 대표자·CPO 책임

2026 개정의 대표자 책임, CPO 권한·독립성, 인증 의무 적용 기준을 조직 설계에 반영한다. 명목상 지정만 하고 예산·보고 경로가 없는 구조를 피한다.

### LEG-SEC-004. 침해사고·정보통신망 의무

개인정보 유출과 정보통신망 침해사고의 신고·보고 경로가 다를 수 있다. 보안 runbook에서 기관·기준·담당을 구분한다.

---

## 13. 위치정보

### LEG-LOC-001. data flow 분류

```text
permission requested
raw coordinate received
account/session linkage
server transmission
storage duration
derived region/profile
sharing recipient
user controls
```

OS permission을 받았다는 사실만으로 위치정보법·개인정보법상 모든 처리가 해결된다고 보지 않는다.

### LEG-LOC-002. 최소화

- 현재 주변 검색은 요청 시점 처리 우선
- 지도 viewport와 단말 위치 구분
- 정확 좌표의 짧은 보존
- 장기 선호는 더 거친 지역
- 집·직장 자동 추론 금지
- 백그라운드 위치 초기 미사용
- 방문 인증 위치와 추천 위치 분리

### LEG-LOC-003. 사용자 제어

- 권한 거절 시 지역 직접 선택
- 위치 사용 중 indicator·설명
- 정확/대략 위치에 따른 기능 차이
- 철회 후 cache·profile 전파
- 위치 history 보기·삭제 범위

### LEG-LOC-004. 사업 신고·약관

개인위치정보를 이용하는 위치기반서비스에 해당하는지, 신고·약관·동의·이용·제공 사실 확인자료 보존 등 구체 의무를 출시 flow 기준으로 전문 검토한다.

---

## 14. 아동·청소년

### LEG-MIN-001. 연령 정책

제품 선택:

- 만 14세 미만 가입을 허용하는가
- 비로그인 검색만 허용하는가
- 법정대리인 동의와 확인을 구현하는가
- 리뷰·위치·예약·결제를 허용하는가

허용하지 않기로 했다면 생년월일을 무조건 수집하기보다 위험·법적 필요에 맞는 age gate를 설계한다. 우회·기존 계정·삭제·지원 절차를 마련한다.

### LEG-MIN-002. 법정대리인

만 14세 미만 아동의 개인정보 동의가 필요한 경우 법정대리인 동의·확인을 다뤄야 한다. 최소 수집, 대리인 권리, 동의 철회, 보호자 변경을 검토한다.

### LEG-MIN-003. 콘텐츠·주류

- 주류 중심 업종·프로모션의 연령 제한
- 미성년자 사진·신상·학교 정보
- 위치·팔로우·공개 profile 위험
- 타깃 광고 제한
- 긴급 위해 신고

단순 음식점 검색과 주류 구매·광고를 구분한다.

---

## 15. 사용자 리뷰와 사용후기 규율

### LEG-REV-001. 게시·삭제 기준 공개

전자상거래법 2026 개정에 온라인 사용후기 삭제 기준과 삭제 시 이의 제기 절차 관련 규율이 포함되므로 도락의 적용 여부·시행일·구체 의무를 법률 검토한다.

제품은 최소 다음을 공개한다.

- publication·limited·hidden·removed의 의미
- 정책별 조치 기준
- 작성자·점주 통지 범위
- 이의 제기 방법과 상태
- 법적 요청·긴급 위험 예외
- 점수 포함 상태와 게시 상태의 분리
- 광고·협찬 관계 표시

### LEG-REV-002. 점주 삭제권 금지

점주는 리뷰를 직접 삭제하지 못한다. 신고·반론·증빙·이의 제기 경로를 제공하고 도락 정책에 따라 판단한다. 유료 계약과 결과를 연결하지 않는다.

### LEG-REV-003. 허위·명예·사생활

사실 주장, 의견, 모욕·위협, 개인정보, 공익, 당사자 관계가 얽힐 수 있다. 자동 금칙어만으로 적법성을 판단하지 않는다.

운영 준비:

- 당사자·대리권 확인
- 구체 URL·표현·이유·증빙
- 긴급 위해·개인정보 우선 제한
- 작성자 소명과 보복 방지
- 관할·명령·법률 의견
- 최소 범위 조치
- decision·notice·appeal 기록

### LEG-REV-004. 임시조치·불법정보

정보통신망법상 불법정보·권리 침해 주장에 대한 적용 절차를 법률 검토한다. 모든 민원을 자동 삭제하거나, 법원 명령 전에는 아무 조치도 하지 않는 두 극단을 피한다.

### LEG-REV-005. 방문 인증

`인증됨`은 방문 근거의 등급이지 리뷰 내용이 사실이라는 법적 보증이 아니다. UI·약관에서 의미를 과장하지 않는다.

---

## 16. 저작권·사진·데이터베이스 권리

### LEG-IP-001. 사용자 license

약관에 필요한 범위:

- 서비스 내 저장·복제·공개·format 변환
- 검색·추천·moderation·backup
- 앱·웹·국가·기간
- 삭제 후 cache·분쟁·법적 보존
- 사용자의 소유권 유지
- 광고·외부 마케팅 재사용은 별도 범위 검토

무제한·영구·취소 불가 문구로 제품 목적 이상을 가져오지 않는다.

### LEG-IP-002. 업로드 확인

- 자신이 촬영했거나 필요한 권리를 보유
- 인물·사생활·매장 내부 촬영 고려
- 타 플랫폼 watermark·캡처
- 메뉴판·로고·미술품
- 도락이 자동 편집·thumbnail을 생성

### LEG-IP-003. 복제·전송 중단

저작권법상 권리주장자의 복제·전송 중단 요구와 게시자의 대응·재개 절차가 도락에 어떻게 적용되는지 법률 검토하고 전용 intake를 둔다.

### LEG-IP-004. 데이터 원천

- 공공데이터 이용허락·출처 표시·변경 금지 조건
- 지도·Local API의 캐시·재배포·파생 DB 제한
- 크롤링 대상 site의 약관·robots·database rights·접근 통제
- 점주 제공 데이터의 권한
- 사용자 제보의 검증과 권리
- 공급자 계약 종료 시 삭제·대체 가능성

`인터넷에 공개됨`은 자유로운 수집·영구 저장·상업 재배포 허락과 같지 않다.

### LEG-IP-005. 브랜드

- `도락`, `DORAK`, 로고의 KIPRIS 선행 조사
- 지정상품·서비스 분류
- 도메인·앱스토어·SNS handle
- 음식점 상표와 공식 관계 오인 방지
- 지점명 URL·광고 creative에서 상표 사용 검토

이름 선호가 상표 사용 가능성을 보장하지 않는다.

---

## 17. 광고·협찬·랭킹

### LEG-ADS-001. 광고 식별

인터넷 광고에도 표시광고 규율이 적용될 수 있다. sponsored card·지도 핀·추천 module·editorial sponsorship을 판단 지점에서 `광고` 등 명확한 표현으로 표시하고 법률 검토한다.

### LEG-ADS-002. 부당 표시

- 근거 없는 `1위`, `최고`, `공식`, `인증`
- 가격·기간·수량·제외 조건 은폐
- 경쟁점 비방·부당 비교
- 예약 가능·할인·재고와 실제 destination 불일치
- 도락 점수·award와 광고 관계 오인

creative revision, 근거, 심사, 표시 snapshot을 보존한다.

### LEG-ADS-003. 추천·보증 경제적 관계

금전, 무료 식사, 할인, 향후·조건부 보상 등 신뢰도에 영향을 줄 관계의 공개 범위를 검토한다. 리뷰 끝이나 약관에만 숨기지 않는다.

### LEG-ADS-004. 독립성

- 광고비가 공개 점수에 미반영
- 구독 여부가 리뷰 삭제·판정에 미반영
- 광고 결과와 organic 검색 분리
- 영업·광고 검토·moderation·평점 권한 분리
- 독립성 감사와 위반 escalation

상세 설계는 [ADVERTISING_MONETIZATION.md](../features/ADVERTISING_MONETIZATION.md)를 따른다.

---

## 18. 전자상거래·점주 구독

### LEG-COM-001. 사전 정보

거래 전 표시할 후보:

- 판매자·중개자 identity와 연락처
- 상품·서비스 내용
- 가격·세금·수수료·결제 방법
- 공급 시기·기간
- 자동 갱신
- 청약철회·해지·환불 조건
- 분쟁 처리
- 이용 제한·기술 조건

정확한 의무 항목과 표시 위치는 거래 역할별로 검토한다.

### LEG-COM-002. 주문 확인

- 최종 가격과 계약 상대방
- 체크박스·버튼 문구
- 중복 제출 방지
- 계약 내용 접근·보존
- 확인 email/화면
- 오류 정정 기회

### LEG-COM-003. 해지·철회

가입은 쉬우나 해지는 숨겨진 구조를 피한다. 구독의 즉시/기간 말 해지, prorating, digital service 제공 개시, 무료 체험 종료를 법률·상품 계약에 맞춘다.

### LEG-COM-004. 거래기록 보존

전자상거래법상 표시·광고, 계약·이행 등 거래 기록 보존 의무와 기간을 법률 검토한다. 개인정보 처리방침의 일반 삭제 기간과 충돌하지 않도록 `legal_retention_class`로 격리한다.

### LEG-COM-005. 금지행위·dark pattern

- 거짓·과장·기만 유인
- 해지·철회 방해
- 사용자가 주문하지 않은 청구
- 숨은 fee
- preselected 유료 option
- 가짜 urgency·countdown
- 동의하지 않은 정보 이용
- 고객지원 고의 방치

제품 실험도 이 경계를 우회하지 않는다.

---

## 19. 예약·취소·노쇼

### LEG-RES-001. 계약 상대방

예약만 중개하는지, 예약 서비스·deposit을 도락이 판매하는지, 음식점이 최종 계약 당사자인지 화면·약관·영수증에서 일치시킨다.

### LEG-RES-002. checkout

- 지점·날짜·시각·인원·코스
- 총액·예약금·현장 결제
- 취소 deadline·환불·노쇼
- 점주 변경 제안 절차
- 특별 요청은 보장 아님
- 연락처 제공 상대와 목적
- 정책 version·동의 증빙

### LEG-RES-003. 소비자분쟁 기준

예약 서비스와 음식업에 적용 가능한 소비자분쟁해결기준, 약관 규제와 실제 취소 정책을 전문 검토한다. 점주가 입력한 임의 정책을 검토 없이 그대로 집행하지 않는다.

### LEG-RES-004. 변경

점주가 시간·인원·코스·금액을 일방 변경하지 못한다. 새 제안, 사용자 동의, 만료, 원 예약 복구, refund를 상태로 관리한다.

### LEG-RES-005. 장애

중복 예약, 지점 폐업, 시스템 오류, 결제 unknown, 점주 미응답의 책임·대체·환불·지원 기준을 약관과 runbook에 일치시킨다.

---

## 20. 결제·정산

### LEG-PAY-001. 자금 흐름

sequence diagram과 ledger로 다음을 법무·재무·PG와 승인한다.

```text
payer
merchant/creditor
PG/acquirer
Dorak possession or control
fee deduction
settlement recipient/date
refund source
chargeback bearer
insolvency treatment
```

### LEG-PAY-002. 전자금융

전자지급결제대행, 선불전자지급수단, 정산대행 등 해당 가능성과 등록·예외를 확인한다. 2026-12-17 시행 예정 전자금융거래법 개정을 PG·정산 구조에 반영한다.

### LEG-PAY-003. 카드 정보

- 도락 server가 raw PAN/CVC를 받지 않는 hosted/tokenized 방식 우선
- PCI DSS 계약 범위 확인
- 결제 token과 예약 연락처 분리
- 로그·analytics·support에 결제 secret 금지
- 결제 인증·영수증·환불 증빙

### LEG-PAY-004. 정산자금

도락이 점주에게 정산할 자금을 보유한다면 보호·분리·대조·지연·상계·파산 위험을 중대한 법률·재무 gate로 다룬다.

### LEG-PAY-005. 세무

- 공급자와 수수료 매출 구분
- 부가가치세
- 세금계산서·현금영수증·영수증
- 광고·구독·예약금의 매출 인식
- refund·credit note
- 점주 정산 명세

---

## 21. 마케팅 메시지

### LEG-MKT-001. 범주

```text
security
transactional
service
activity
recommendation
marketing
```

제품 이름이 아니라 내용·목적을 보고 광고성 정보인지 판단한다. 예약 알림에 프로모션을 섞어 transactional로 우회하지 않는다.

### LEG-MKT-002. 동의·예외

정보통신망법 제50조 계열의 사전 동의, 예외, 수신 거부·철회, 처리 결과 통지, 정기 확인 등 적용 요건과 최신 하위 기준을 채널별 법률 검토한다.

### LEG-MKT-003. 메시지

- 광고 표시
- 전송자 명칭·연락처
- 수신 거부 방법
- 야간 전송 별도 기준
- 무료·간단한 opt-out
- locale별 법적 문구
- consent evidence와 template version

### LEG-MKT-004. 철회

앱 설정, email, SMS, 고객지원 철회가 하나의 preference 원장으로 수렴하고 provider suppression까지 전파된다. 보안·예약 필수 알림을 마케팅 철회와 함께 잘못 차단하지 않는다.

---

## 22. 음식점·메뉴 정보와 소비자 안전

### LEG-FOOD-001. 원장 사실

- 인허가·폐업 정보 출처와 갱신
- 사업자 개인정보 불필요 노출 방지
- 업종·원산지·가격·알레르기 정보의 제공 주체
- 점주 수정과 공공 원천 충돌
- 마지막 확인일·출처·면책 표현

### LEG-FOOD-002. 알레르기

도락이 구조화·번역한 알레르기 정보를 안전 보증처럼 표시하지 않는다.

- 점주 제공과 도락 추론 구분
- 정보 없음과 불포함 구분
- 교차 접촉 가능성
- 번역·갱신 시각
- 긴급 수정·회수
- 사용자에게 매장 직접 확인 안내

### LEG-FOOD-003. 가격·프로모션

메뉴 가격이 오래되었거나 지점·시간별로 다를 수 있음을 적절히 표시한다. 광고·예약 checkout의 확정 가격은 일반 메뉴 추정과 분리한다.

### LEG-FOOD-004. 영업 상태

폐업·이전·임시 휴업 오표시가 소비자·점주에게 미치는 영향을 고려해 수정·이의 제기 SLA와 provenance를 둔다.

---

## 23. 점주 claim과 사업자 정보

### LEG-OWN-001. 증빙 최소화

- 사업자등록증 전체를 장기 보관해야 하는가
- 대표자 주민등록번호 등 불필요 항목 마스킹
- 대리인 권한·위임
- franchise·agency 관계
- 검토 완료 후 원본 파기와 derived decision

### LEG-OWN-002. 권한 충돌

claim 승인과 법적 소유권 확정을 동일하게 표현하지 않는다. 복수 조직, franchise 본사·가맹점, 운영 대행사 분쟁에는 제한·증빙·통지·appeal이 필요하다.

### LEG-OWN-003. 공개 정보

점주 개인 전화·이메일·법적 이름이 공개 branch contact로 자동 노출되지 않게 한다. 공개 매장 전화와 계정 복구·청구 연락처를 분리한다.

### LEG-OWN-004. 퇴사·이전

구성원 탈퇴, 마지막 owner, 사업 양도, 폐업, 조직 해산 시 계정·예약 연락처·광고·invoice 접근을 종료하는 법적·보안 절차를 둔다.

---

## 24. 지도·외부 데이터 계약

각 공급자별 matrix:

| 항목 | 확인 |
| --- | --- |
| 호출 목적 | 검색, 지도, 좌표, 길찾기, 중복 해소 |
| 저장 가능 필드·기간 | 원문, 좌표, ID, 응답 cache |
| 화면 표시 조건 | 로고, attribution, 지도 결합 |
| 재배포 | API·점주 export·검색 engine |
| 파생 데이터 | 정규화 주소·entity resolution |
| rate·batch | offline ingestion 허용 여부 |
| 개인정보 | query·위치·IP 처리 |
| 계약 종료 | 삭제·migration |
| 감사 | 호출·license version 증빙 |

공급자 A에서 받은 좌표를 공급자 B 지도 위에 표시하거나 독립 DB로 영구화하는 것이 허용된다고 가정하지 않는다.

---

## 25. 추천·평점·자동화

### LEG-AUTO-001. 공개 점수

- 사용자가 입력한 평균과 보정 점수의 구분
- 모델 목적·주요 요소 설명
- 광고와 독립
- 오류·조작·appeal
- version·재현성
- `객관적`, `공식`, `절대적` 표현 제한

### LEG-AUTO-002. 개인화

- 행동·위치 사용 목적과 선택권
- 민감 추론 금지·제한
- profile 초기화
- 외부 model 공급자
- 작은 집단·재식별
- 광고 개인화와 organic 추천 분리

### LEG-AUTO-003. 자동화된 결정

계정 정지, 리뷰 삭제, 점주 claim 거절, fraud·결제 차단처럼 개인에게 중대한 영향을 줄 자동 결정에 적용되는 설명·검토·이의 제기 의무를 개인정보법 및 관련 규율 기준으로 검토한다.

### LEG-AUTO-004. 모델 공급자

사용자 데이터의 학습 재사용, prompt·response 보존, 국외이전, 삭제, incident, IP, 출력 책임을 계약에서 확인한다.

---

## 26. 접근성·차별 방지

법적 적용 범위는 서비스·사업자 규모와 최신 기준을 검토한다. 적용 여부와 무관하게 핵심 탐색·예약·결제·권리 행사를 접근 가능하게 설계한다.

- keyboard·screen reader
- 색상 대비와 확대
- 광고 label
- 지도 대체 목록
- 사진 alt text
- form 오류·timeout
- 예약 특수 요청의 민감정보 최소화
- 언어 선택과 번역
- 장애를 이유로 과도한 의료정보 요구 금지

접근성 statement, 문의·대체 경로, 수정 SLA를 준비한다.

---

## 27. 수사기관·법적 요청·보존 명령

### intake

- 요청 기관·담당자 확인
- 법적 근거·관할·문서 진위
- 대상·기간·데이터 범위
- 긴급성
- 비밀유지·사용자 통지 제한
- 법무 승인

### 최소 제공

- 요청 범위 축소
- export review
- 제3자 데이터 분리
- 암호화 전달
- 제공 기록·수령 확인

### legal hold

일반 retention을 무기한 바꾸지 않는다.

```text
hold id
legal owner
scope and reason
custodians/datasets
start/review/end
access
release and resumed deletion
```

운영자가 임의 메모로 삭제를 영구 중지하지 못한다.

---

## 28. 고객지원·분쟁

### 채널

- 개인정보 권리
- 결제·예약·refund
- 리뷰·권리 침해
- 저작권
- 점주 claim
- 광고·구독
- 보안·탈취
- 접근성

### 공통 원칙

- 사건 유형별 SLA와 escalation
- 담당자 최소 권한
- 사용자 identity 검증
- 언어·접근성 지원
- 증빙 upload 격리
- 결정 이유 code
- 이의 제기와 재검토자 분리
- 법정 분쟁조정 안내
- support 대화 보존·파기

고객지원이 약관·정책을 즉흥적으로 약속하지 않도록 승인된 response template과 예외 승인 절차를 둔다.

---

## 29. 계약 관리

### 계약 registry

```text
counterparty
service/purpose
effective/renewal/termination
data role and location
SLA/security/privacy annex
IP/license
payment/settlement
liability/insurance
subcontractor
audit
exit/data return/deletion
owner
```

### 변경 trigger

- 공급자 새 subprocessor
- 데이터 region 변경
- 약관·API license 변경
- 새 AI 학습 정책
- PG 정산 방식 변경
- 가격·자동 갱신 변경
- 회사 인수·사업 양도

자동 갱신 60~90일 전에 검토 alert를 둔다. 계약상 삭제 약속을 실제 기술 test로 확인한다.

---

## 30. 기록·증거 보존 matrix

정확한 기간은 법률 검토로 확정한다.

| 기록 | 목적 | 시작점 | 종료·파기 trigger | 접근 |
| --- | --- | --- | --- | --- |
| 약관 동의 | 계약·동의 증빙 | 동의 시각 | 법정·분쟁 기간 | 법무·privacy |
| 예약 계약 snapshot | 거래·분쟁 | 예약 확정 | 거래 보존 만료 | 예약·지원 제한 |
| 결제·refund | 회계·분쟁 | 거래 | 법정 기간 | 재무 제한 |
| 광고 creative·표시 | 표시광고 증빙 | 승인·노출 | 법률 확정 | 광고·법무 |
| 리뷰 revision·판정 | 콘텐츠 이의 | 게시·조치 | 정책·분쟁 | trust 제한 |
| 권리 신고 | IP·명예 | 접수 | 법정·분쟁 | 법무 제한 |
| location access fact | 위치정보 의무 후보 | 이용·제공 | 적용 기간 | privacy 제한 |
| auth·security event | 보안 | event | 위험 기반 | security 제한 |
| 증빙 원본 | claim·visit 판정 | upload | 판정 후 짧은 기간 | 고도 제한 |
| audit log | 책임성 | 운영 행위 | 정책 기간 | 감사 제한 |

법정 기간을 `영구 보존`으로 번역하지 않는다. 만료 후 자동 파기·예외 hold·파기 증빙을 갖춘다.

---

## 31. 출시 decision gate

### Gate A. 검색·원장 공개

- [ ] 법인·서비스 제공자 정보가 확정됐다.
- [ ] 공공·지도·외부 데이터 license matrix가 승인됐다.
- [ ] 상호·주소·폐업·사진 정정·권리 신고 절차가 있다.
- [ ] privacy inventory와 최소 처리방침이 실제 flow와 일치한다.
- [ ] `도락/DORAK` 상표·도메인 선행 검토가 완료됐다.

### Gate B. 계정·리뷰

- [ ] 이용약관·privacy·커뮤니티 정책 version이 승인됐다.
- [ ] 만 14세 미만 정책과 flow가 확정됐다.
- [ ] 리뷰 삭제·제한·통지·이의 제기 기준이 공개된다.
- [ ] 명예·사생활·불법정보·긴급 위해 escalation이 있다.
- [ ] 저작권 신고·중단·복구 절차가 법률 검토됐다.
- [ ] 계정 종료·콘텐츠 선택·법적 보존이 구현됐다.

### Gate C. 위치·개인화

- [ ] 위치 data flow와 보존이 문서화됐다.
- [ ] 위치 관련 사업 신고·약관·동의 적용 여부가 승인됐다.
- [ ] 거절 fallback과 철회·삭제가 동작한다.
- [ ] 추천·광고 목적과 제어가 분리된다.
- [ ] 외부 analytics·AI 국외 이전이 검토됐다.

### Gate D. 점주

- [ ] claim 증빙 항목과 파기 기준이 최소화됐다.
- [ ] 조직·지점 권한 분쟁·이전 절차가 있다.
- [ ] 점주 privacy·예약 data 역할이 계약과 일치한다.
- [ ] 기본 정보 수정·리뷰 이의가 유료벽 밖이다.
- [ ] 사업자 정보·구성원 개인정보 노출이 제한된다.

### Gate E. 예약

- [ ] 거래·중개 역할이 화면·약관·invoice에서 일치한다.
- [ ] checkout 사전 정보와 정책 version이 고정된다.
- [ ] 취소·환불·노쇼 정책이 소비자법 검토를 통과했다.
- [ ] 예약 연락처의 제공·보존·점주 접근이 검토됐다.
- [ ] 장애·폐업·중복 예약 보상 runbook이 있다.

### Gate F. 결제·정산

- [ ] 자금 flow와 전자금융 적용 의견이 승인됐다.
- [ ] 2026-12-17 시행 예정 개정을 재검토했다.
- [ ] PG·정산·chargeback·refund 계약이 완료됐다.
- [ ] 세무·영수증·invoice 구조가 승인됐다.
- [ ] 원장 대조와 수동 조정 이중 승인이 시험됐다.

### Gate G. 광고·구독

- [ ] 광고 표시와 추천·보증 관계 공개가 검토됐다.
- [ ] organic·점수·review와 광고 독립성이 시험됐다.
- [ ] creative 근거·revision·심사 기록이 보존된다.
- [ ] 자동 갱신·해지·환불이 소비자·사업자 계약에 맞는다.
- [ ] 무효 트래픽·credit·광고주 이의 제기 절차가 있다.

### Gate H. 운영 준비

- [ ] CPO/CISO와 법률 escalation owner가 지정됐다.
- [ ] 2026-09-11 개인정보법 개정 대응을 재확인했다.
- [ ] 유출·침해·법적 요청 tabletop을 수행했다.
- [ ] 정보주체 요청·권리 신고·refund SLA가 시험됐다.
- [ ] vendor·계약·법령 변경 monitoring이 운영된다.

---

## 32. 정기 감사

### 월간

- 신규 SDK·vendor·data field
- 광고·예약·결제 정책 예외
- 권리 요청 SLA·미처리
- 콘텐츠·저작권·점주 분쟁
- 법률 blocker와 release 변경

### 분기

- 법령·고시·지침·판례 변화
- privacy notice와 실제 data flow 대조
- 위치·마케팅 consent evidence sample
- 광고 표시·평점 독립성 감사
- 계약·subprocessor·국외 이전
- retention·파기·legal hold
- 사업 신고·인증 threshold

### 연간 또는 중대한 변경 전

- 약관·privacy 전체 검토
- 사고·권리 요청 tabletop
- 결제·정산·세무 구조
- 상표·콘텐츠·데이터 license
- 접근성·아동 위험
- 보험·책임 한도

---

## 33. 변경 시 재검토 trigger

- 자체 예약금 수취·점주 정산 시작
- wallet·credit·gift card 도입
- 백그라운드 위치 수집
- 외부 광고망·행동 광고
- 생체·신분증·실명 인증
- 만 14세 미만 가입 허용
- 사용자 리뷰를 외부 광고에 사용
- generative AI 학습·외부 모델 전송
- 해외 사용자 대상 유료 거래
- 새 법인·M&A·사업 양도
- 대규모 데이터 수집·크롤링
- 건강·알레르기·종교 식이 profile
- 점주 CRM·전화 recording
- 공개 댓글·DM
- worker·운영 센터의 국외 이전

위 변경은 일반 feature review가 아니라 법률·privacy·security design review를 다시 연다.

---

## 34. 우선 법률 질문 목록

1. 도락의 초기 검색·리뷰 모델에서 전자상거래법상 온라인 사용후기 규율이 어느 시점·범위로 적용되는가?
2. 자체 예약에서 도락과 음식점의 계약·통신판매중개 역할은 어떻게 나뉘는가?
3. 예약금을 PG를 통해 받고 점주에게 정산할 때 전자금융·정산자금 보호 의무는 무엇인가?
4. 주변 검색·방문 인증·추천별 위치정보법상 역할과 신고·동의·보존 의무는 무엇인가?
5. 리뷰 명예·사생활 주장과 정보통신망법상 임시조치·불법정보 대응 절차는 어떻게 설계해야 하는가?
6. 저작권법상 사진 중단·복구 절차와 사용자 약관 license의 적절한 범위는 무엇인가?
7. 2026-09-11 개인정보법 개정 중 도락 설립·규모 단계부터 반영할 항목은 무엇인가?
8. 광고·협찬 리뷰·editorial sponsor의 구체 표시 문구와 위치는 무엇이어야 하는가?
9. 만 14세 미만을 배제하는 경우 필요한 age assurance와 개인정보 최소화의 균형은 무엇인가?
10. 공공데이터·지도 API·사용자 제보를 결합한 음식점 DB의 이용·재배포 조건은 무엇인가?
11. 점주 사업자등록증·권한 위임 증빙을 어디까지 수집·보존할 수 있는가?
12. 외부 번역·moderation·analytics·AI 공급자의 국외 이전과 위탁 고지·동의 요건은 무엇인가?

---

## 35. 공식 기준 링크

기준일 후 반드시 최신 효력일과 하위 규정을 다시 확인한다.

- [개인정보 보호법 현행 본문](https://law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=011357)
- [개인정보 보호법 2026-09-11 시행 개정문](https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=283839&viewCls=lsRvsDocInfoR)
- [개인정보보호위원회](https://www.pipc.go.kr/np/default/page.do?mCode=G010010000)
- [위치정보의 보호 및 이용 등에 관한 법률](https://www.law.go.kr/lsInfoP.do?lsId=009882)
- [정보통신망 이용촉진 및 정보보호 등에 관한 법률](https://www.law.go.kr/lsInfoP.do?lsId=000030)
- [전자상거래 등에서의 소비자보호에 관한 법률 2026 개정 본문](https://www.law.go.kr/LSW/lsInfoP.do?ancNo=21312&ancYd=20260120&efYd=20260721&lsiSeq=282793)
- [표시·광고의 공정화에 관한 법률](https://law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=002011)
- [공정거래위원회 추천·보증 등에 관한 표시·광고 심사지침](https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=6&key=20&nttSn=9048&pageIndex=3&pageUnit=10&searchCnd=all)
- [저작권법](https://www.law.go.kr/LSW/lsSc.do?query=%EC%A0%80%EC%9E%91%EA%B6%8C%EB%B2%95&tabMenuId=tab18&x=0&y=0)
- [저작권법 제103조 복제·전송 중단 관련 조문](https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsId=000798&lsJoLnkSeq=900605727&print=print)
- [전자금융거래법 개정이유](https://www.law.go.kr/LSW/lsRvsRsnListP.do?chrClsCd=010102&lsId=010199)

---

## 36. 연관 문서

- [PRODUCT.md](../product/PRODUCT.md)
- [PRIVACY_SECURITY.md](./PRIVACY_SECURITY.md)
- [AUTH_IDENTITY.md](../architecture/AUTH_IDENTITY.md)
- [MODERATION_POLICY.md](./MODERATION_POLICY.md)
- [MEDIA_PIPELINE.md](../features/MEDIA_PIPELINE.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [ADVERTISING_MONETIZATION.md](../features/ADVERTISING_MONETIZATION.md)
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md)
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)
- [INTERNATIONALIZATION.md](../features/INTERNATIONALIZATION.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [ROADMAP.md](../product/ROADMAP.md)
