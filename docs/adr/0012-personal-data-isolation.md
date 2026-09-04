# ADR-012: 개인정보 schema·저장소·권한 격리

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Privacy/Security
- 검토자: Backend, Platform, Operations, Booking

## 맥락

도락은 공개 프로필 외에 이메일·전화, 예약자명, 점주 증빙, 영수증, 위치 신호, 결제 참조를 처리한다. 일반 음식점·리뷰 query와 같은 schema·role에 원문 개인정보를 두면 개발·운영·분석 접근 범위가 불필요하게 넓어진다.

초기부터 물리 DB를 모두 분리하면 트랜잭션·운영 복잡도가 크지만 아무 경계 없이 두면 나중에 분리하기 어렵다.

## 결정 기준

- 목적 제한과 최소 권한
- 유출 blast radius
- 예약·계정 성능과 일관성
- 삭제·보존
- 운영자 접근 감사
- 향후 물리 분리 가능성

## 결정

개인정보를 용도별 schema/service boundary와 별도 DB role로 격리한다. 직접 식별정보는 일반 도메인 테이블에서 불투명 reference로만 사용한다.

초기 논리 경계:

```text
public/domain schema
identity/contact vault schema
evidence schema/object bucket
payment reference schema
audit/security schema
```

고위험 증빙과 키는 별도 저장소·계정·KMS key까지 강화한다. 규모·규제·팀 경계가 생기면 별도 DB/account로 이동할 수 있게 API를 둔다.

## 대안

### 하나의 public schema

구현은 단순하지만 broad role, accidental join/log/export 위험이 크다.

### 처음부터 완전 독립 개인정보 서비스/DB

격리는 강하지만 account·booking transaction과 운영 복잡도가 초기 단계에 과도하다.

### 애플리케이션 암호화만

원문 보호는 강화하지만 권한·목적·조회 감사·metadata 노출을 해결하지 못한다.

## 긍정적 결과

- 일반 query·analytics에서 개인정보 기본 제외
- DB role과 감사 경계
- 보존·삭제 목적별 적용
- 운영자 마스킹·제한 해제 구현
- 향후 물리 분리 경로

## 부정적 결과

- cross-schema transaction·reference 관리
- 암호화 key·tokenization 운영
- 지원 도구가 복잡해짐
- 삭제·법적 보존의 상태 모델 필요
- join 성능과 개발 ergonomics 비용

## 통제

- service/application interface를 통한 접근
- 목적별 DB role
- row/object access audit
- field/application encryption + KMS
- deterministic lookup은 HMAC/token, 평문 hash 금지
- 로그·APM·event allowlist
- retention job과 legal hold
- 비프로덕션 합성 데이터
- export와 마스킹 해제 추가 인증

## 데이터 예

```text
user_account -> identity_ref
reservation -> reservation_party/contact_ref
visit_verification -> evidence_ref
branch_claim -> encrypted evidence_ref
payment_intent -> provider token/reference only
```

### 저장하지 않는 것

- 카드번호 원문
- 비밀번호 원문
- 불필요한 동행자 신원
- 분석 이벤트의 검색어·요청사항 원문
- 일반 로그의 전화·이메일·증빙

## 검증

- 일반 API/analytics DB role의 직접 조회 거부
- 다른 조직/사용자 객체 권한
- 마스킹 해제 감사
- 삭제 end-to-end
- backup restore 후 tombstone
- key rotation
- 로그·Sentry redaction

## 재검토 조건

- 법률·규제·계약이 물리적 격리를 요구한다.
- 별도 Privacy/Identity 팀과 서비스가 생긴다.
- 공격·감사에서 논리 경계가 불충분하다.
- cross-schema 결합이 오히려 안전 통제를 우회한다.

## 되돌리기 비용

하나의 schema로 합치는 것은 권장하지 않는다. 별도 DB로 강화하는 비용은 reference/API 경계를 지키면 중간, 직접 join이 퍼지면 높다.

## 관련 문서

- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
