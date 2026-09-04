# 도락 인증·신원·세션·계정 복구 설계

> 상태: 초안 v0.1  
> 범위: 소비자·점주·운영자·파트너 인증, 계정 연결, 세션, 추가 인증, 복구, 계정 종료  
> 원칙: 공개 프로필, 로그인 신원, 예약 연락처, 점주 권한을 분리하고 계정 하나의 탈취가 모든 권한으로 자동 확장되지 않게 한다.  
> 연관 문서: [DATA_MODEL.md](./DATA_MODEL.md), [API_DESIGN.md](./API_DESIGN.md), [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)

---

## 1. 목적

도락의 인증 시스템은 로그인 화면을 제공하는 기능을 넘어 다음을 보장해야 한다.

- 사용자가 여러 로그인 수단을 안전하게 한 계정에 연결한다.
- 외부 로그인 공급자의 ID·이메일을 도락 계정 ID로 사용하지 않는다.
- 모바일과 웹 세션이 탈취·재사용·원격 해제에 견딘다.
- 리뷰 작성, 예약, 점주 정보·연락처, 운영자 권한에 다른 보증 수준을 적용한다.
- 전화번호 변경, 공급자 계정 상실, 기기 분실 후에도 공격자에게 계정을 넘기지 않고 복구한다.
- 점주 소유권과 조직 역할은 로그인 성공만으로 결정되지 않는다.
- 계정 종료·익명화·법적 보존을 데이터 생명주기와 연결한다.

---

## 2. 비목표

- 실명제 기반 음식 리뷰 서비스
- 전화번호 하나를 영구 사용자 ID로 사용
- 소셜 공급자의 프로필 전체를 자동 수집
- 예약 연락처를 로그인 계정으로 자동 생성
- 운영자가 사용자를 대신해 로그인하는 기능
- 위험 신호를 이유 없이 모든 팀에 공개
- 자체 구현 암호 프로토콜

---

## 3. 원칙

### 3.1 계정과 신원 수단을 분리한다

```text
user_account
 ├─ user_identity: OIDC/social/email/phone/passkey
 ├─ user_profile: public handle/name/avatar
 ├─ auth_session
 ├─ communication consent
 └─ organization_member relationships
```

로그인 수단이 바뀌어도 `user_account.id`는 유지된다.

### 3.2 인증과 권한을 분리한다

로그인 성공은 ‘누구인가’의 한 신호다. ‘이 지점의 예약 연락처를 볼 수 있는가’는 조직 구성원 상태, 역할, branch scope, 현재 claim/authority를 별도로 검사한다.

### 3.3 보증 수준을 행동에 맞춘다

공개 검색에는 로그인 불필요, 저장·리뷰·예약에는 계정 인증, owner 이전·환불·민감 내보내기에는 최근 추가 인증을 요구한다.

### 3.4 계정 연결은 로그인보다 위험하다

새 identity를 연결하면 기존 모든 데이터·권한에 접근할 수 있다. 최근 인증과 기존 채널 통지, 공급자 credential 검증을 요구한다.

### 3.5 복구가 가장 약한 인증 수단이 되지 않게 한다

강한 passkey/MFA를 설정해도 지원팀 전화 한 번으로 계정을 넘겨 주면 의미가 없다. 복구 위험을 계정 권한에 맞춘다.

### 3.6 실패 문구는 계정 존재를 누설하지 않는다

로그인 링크·복구·전화 인증 요청에서 등록 여부를 외부에 확인시켜 주지 않는다.

---

## 4. 행위자와 인증 영역

| 행위자 | 인증 | 권한 원천 |
|---|---|---|
| 익명 소비자 | 없음 또는 익명 세션 | 공개 API |
| 로그인 소비자 | 사용자 세션 | account 상태·리소스 소유 |
| 점주 구성원 | 사용자 세션 + 필요 시 MFA | organization member/role/branch authority |
| 운영자 | 사내 IdP SSO + MFA + 관리 기기 정책 | operator role·case scope |
| 파트너 | OAuth client 또는 서명 credential | client scope·branch scope |
| 내부 서비스 | workload identity | service policy |

소비자 identity와 운영자 identity를 같은 토큰 audience로 쓰지 않는다.

---

## 5. 데이터 모델

### 5.1 `user_account`

```text
id
account_status
security_level
primary_locale
created_at
last_authenticated_at
restricted_at / suspended_at / closed_at
version
```

이메일·전화·실명을 넣지 않는다.

### 5.2 `user_identity`

```text
id
user_account_id
identity_type
provider
provider_subject or credential_id
identifier_ref
verified_at
assurance_level
status
linked_at
last_used_at
metadata_safe
```

고유성:

```text
(provider, provider_subject) unique for active identity
passkey credential_id unique
verified identifier normalized token unique policy per type
```

### 5.3 `auth_session`

```text
id
user_account_id
session_family_id
client_type
device_reference
created_at
last_seen_at
absolute_expires_at
idle_expires_at
auth_time
assurance_level
risk_state
revoked_at / revoke_reason
```

### 5.4 `refresh_credential`

```text
session_id
token_hash
rotation_counter
issued_at
expires_at
consumed_at
replaced_by_hash
reuse_detected_at
```

refresh token 원문을 DB에 저장하지 않는다.

### 5.5 `authentication_event`

```text
event_type
account_id if known
identity/provider
session/device reference
risk result
success/failure reason class
occurred_at
request_id
```

비밀번호·OTP·token·전체 IP를 일반 분석 이벤트로 보내지 않는다.

### 5.6 `recovery_case`

고위험 계정 복구는 단순 토큰이 아니라 사건일 수 있다.

```text
id
account_id
requested_identity/contact refs
risk tier
evidence refs
status
cooling_until
reviewer/approver
decision
created_at / resolved_at
```

---

## 6. 로그인 수단

### 6.1 OIDC·소셜 로그인

국내·모바일 사용성을 고려해 Apple, Google, 카카오, 네이버 같은 공급자를 후보로 두되 실제 OIDC/OAuth 계약·SDK·개인정보·앱스토어 요구를 구현 시 검토한다.

원칙:

- authorization code + PKCE
- exact redirect URI allowlist
- state와 nonce 검증
- issuer, audience, signature, exp 검증
- provider access token을 장기 세션으로 사용하지 않음
- 필요한 최소 scope
- provider subject를 identity key로 사용
- 이메일이 같다는 이유만으로 계정 자동 연결 금지

OAuth authorization과 사용자 authentication을 혼동하지 않고 OIDC 또는 공급자 공식 신원 검증 계약을 사용한다.

### 6.2 이메일

후보:

- magic link
- 일회용 코드
- 비밀번호 + 검증

초기 권고는 email magic link/code 또는 관리형 인증 공급자 검증을 비교한다. 이메일만으로 점주 owner 고위험 작업을 허용하지 않는다.

### 6.3 전화

전화번호는 예약 연락·소유 증명에 유용하지만 SIM swap, 번호 재사용, 문자 탈취 위험이 있다.

- 전화 인증을 유일한 고보증 로그인·복구 수단으로 두지 않는다.
- 번호 변경에는 기존 채널 통지와 cooling을 적용할 수 있다.
- 국제 형식으로 정규화하되 공개 표시와 분리한다.
- 예약용 번호와 계정 identity를 자동 연결하지 않는다.

### 6.4 passkey/WebAuthn

passwordless 및 추가 인증 수단으로 도입을 권고한다.

- RP ID/origin을 엄격히 관리한다.
- challenge는 짧은 수명·단일 사용이다.
- 사용자 검증 결과를 확인한다.
- discoverable credential과 계정 선택 UX를 검증한다.
- attestation은 실제 필요가 없으면 최소화한다.
- 여러 passkey 등록과 이름·마지막 사용·해제를 제공한다.
- 동기화 passkey와 하드웨어 보안키의 보증 차이를 정책에서 과장하지 않는다.

### 6.5 비밀번호를 사용할 경우

- 현대적인 password hashing과 per-user salt
- 길이 중심, 불필요한 조합 규칙 최소화
- 알려진 침해 비밀번호 차단 방식 검토
- paste/password manager 허용
- 평문·복호화 가능한 저장 금지
- 비밀번호 변경 시 모든 세션 해제 선택

비밀번호 직접 운영 여부는 별도 ADR로 결정한다.

---

## 7. 로그인 흐름

### 7.1 OIDC 모바일

```text
app requests authorization session
 -> server creates state/nonce/PKCE context
 -> system browser/provider
 -> redirect to app/universal link
 -> server validates code and provider response
 -> account/identity resolution
 -> session and tokens issued
```

custom URL scheme만 의존하지 않고 universal/app link와 redirect hijack 방어를 적용한다.

### 7.2 웹

```text
browser -> Dorak auth endpoint
 -> provider
 -> server callback
 -> secure session cookie
 -> validated return path
```

사용자가 제공한 임의 return URL로 redirect하지 않는다.

### 7.3 신규 계정

1. identity 검증
2. 기존 identity exact match 확인
3. 계정 생성
4. 필수 약관·개인정보 고지
5. 선택 동의 분리
6. handle/pro필은 나중에 설정 가능
7. session 생성

가입 전 검색·저장 임시 상태를 계정에 연결할 때 privacy와 중복을 검증한다.

### 7.4 실패

```text
provider_cancelled
invalid_state
expired_attempt
provider_unavailable
identity_restricted
account_suspended
additional_verification_required
```

외부에는 안전한 문구와 재시도·지원 경로를 제공한다.

---

## 8. 계정 해소와 자동 연결 금지

### 8.1 안전한 exact match

활성 `(provider, subject)`가 있으면 기존 계정으로 로그인한다.

### 8.2 이메일 일치

두 공급자가 같은 이메일을 주장해도 자동 병합하지 않는다.

이유:

- 공급자별 검증 의미 차이
- 이메일 재사용·변경
- enterprise/relay 주소
- account takeover와 pre-hijacking

기존 계정에 로그인한 상태에서 명시적으로 새 identity를 연결한다.

### 8.3 Apple relay 등

가려진 이메일을 실제 이메일과 동일 사용자로 추론하지 않는다. provider subject가 기준이다.

### 8.4 전화 중복

번호 재사용과 공유 번호를 고려한다. verified phone이 충돌하면 자동 계정 병합이 아니라 복구/지원 flow로 보낸다.

---

## 9. identity 연결·해제

### 9.1 연결

요구:

- 활성 로그인 세션
- 최근 인증
- 새 공급자 credential의 fresh authentication
- state/nonce/PKCE
- 이미 다른 계정에 연결되지 않음
- 고위험 계정의 추가 인증
- 기존 채널 통지

### 9.2 해제

해제 전 확인:

- 남은 로그인/복구 수단이 있는가
- owner/운영 고위험 계정 정책
- 현재 session이 해제 대상 identity로만 인증됐는가
- 공급자 revoke가 필요한가

마지막 identity를 해제해 복구 불가능한 계정을 만들지 않는다.

### 9.3 identity 이전

한 계정에서 해제 후 즉시 다른 계정에 연결하는 행위는 탈취 위험이 있다. cooling, 이전 계정 통지, 위험 검토를 적용할 수 있다.

---

## 10. 세션·토큰

### 10.1 권고 구조

```text
short-lived access token
rotating opaque refresh token
server-side session family
```

access token은 JWT 또는 opaque를 구현 ADR에서 확정한다. 어떤 형식이든 즉시 해제가 필요한 고위험 권한은 서버 상태를 확인한다.

### 10.2 access token

최소 claim:

```text
issuer
subject account id
audience
issued/expiry
session id
auth time/assurance
token id
```

조직 역할·branch scope 전체를 장기 claim으로 넣지 않는다.

### 10.3 refresh rotation

1. refresh token을 한 번 사용한다.
2. 기존 token을 consumed로 표시한다.
3. 새 token을 발급한다.
4. 이미 소비된 token 재사용을 탐지하면 session family를 해제한다.
5. 사용자에게 보안 알림과 세션 검토를 제공한다.

모바일 네트워크 동시 재시도의 짧은 grace 정책은 재사용 탐지를 무력화하지 않는 범위에서 설계한다.

### 10.4 웹 저장

- Secure, HttpOnly cookie
- SameSite 정책
- 좁은 Domain/Path
- CSRF token 또는 origin/site 방어
- localStorage에 장기 bearer token 저장 금지

### 10.5 모바일 저장

- OS secure storage/keychain
- 앱 로그·analytics·clipboard 금지
- backup/restore 동작 검토
- device compromise를 완전히 방어한다고 주장하지 않음

### 10.6 만료

- 짧은 access token
- idle/absolute session expiry
- owner/operator는 더 엄격
- 장기 사용자는 refresh로 연속성
- 계정 정지·비밀번호 변경·탈취 시 server-side revoke

정확한 시간은 위협·사용성 시험 후 확정한다.

---

## 11. 세션 관리 UX

사용자는 다음을 볼 수 있다.

```text
기기/브라우저의 안전한 이름
대략적 최근 활동 시각
대략적 지역, 과도한 위치 정확도 없음
현재 세션
인증 수단
개별 로그아웃
다른 모든 세션 로그아웃
```

알 수 없는 세션을 신고하면:

- 세션 family 해제
- credential 변경/검토
- identity 연결 이력 확인
- 점주 owner/billing 변경 잠금 검토
- 보안 사건

---

## 12. 추가 인증

### 12.1 보증 수준

예시:

```text
AAL0 anonymous
AAL1 federated/email basic login
AAL2 passkey/MFA/recent strong verification
AAL3 operator managed-device strong auth, 내부 정책
```

외부 표준 AAL 용어와 정확히 대응한다고 주장하려면 별도 인증 설계를 검증한다. 여기서는 내부 정책 label이다.

### 12.2 요구 행동

- 로그인 수단·전화 변경
- identity 연결·해제
- passkey/MFA 변경
- 다른 모든 세션 해제
- owner 이전
- 고위험 점주 권한 부여
- 예약 취소·환불 정책 변경
- 예약 연락처 대량 보기·내보내기
- 결제·정산 수단 변경
- 개인정보 내보내기
- 운영자 제재·환불·병합

### 12.3 auth time

토큰 발급 시각이 아니라 실제 strong authentication 시각을 사용한다. refresh로 `auth_time`을 새로 만들지 않는다.

### 12.4 fallback

사용자가 strong factor를 잃으면 낮은 factor 하나로 즉시 우회하지 않는다. recovery flow와 cooling을 사용한다.

---

## 13. MFA와 passkey 운영

### 13.1 대상

- 소비자: 선택 권고, passkey 편의
- 점주 owner/billing: 필수화 단계 검토
- reservation manager: 연락처 접근 규모에 따라
- 운영자: 필수
- partner/admin client: 별도 강한 client auth

### 13.2 수단

우선순위 후보:

1. passkey/security key
2. authenticator TOTP
3. verified recovery code
4. SMS는 제한적 fallback

### 13.3 recovery code

- 고엔트로피
- 해시 저장
- 한 번 사용
- 다운로드/인쇄 시 노출 경고
- 재생성하면 기존 코드 무효
- 사용 시 보안 통지

### 13.4 factor 변경

- 최근 strong auth
- 기존 factor 통지
- 새 factor 확인
- 고위험 변경 cooling
- 감사 로그

---

## 14. 위험 기반 인증

### 14.1 신호

- 새 기기·브라우저
- 비정상 로그인 속도·지역 변화
- 실패·credential stuffing
- refresh 재사용
- 익명화 네트워크 등 제한 신호
- 계정/identity 최근 변경
- 점주 고위험 권한
- 대량 연락처·내보내기

IP·기기 fingerprint 하나로 사용자를 확정하거나 영구 추적하지 않는다.

### 14.2 결과

```text
allow
allow_and_notify
require_step_up
temporarily_delay
deny
open_security_case
```

### 14.3 공정성·오탐

여행, VPN, 공용 네트워크, 보조 기술 사용자를 자동 공격자로 취급하지 않는다. 대체 인증·지원 경로와 오탐 지표를 둔다.

### 14.4 설명

내부 탐지 신호를 누설하지 않으면서 `새로운 환경에서의 로그인이라 추가 확인이 필요해요` 같은 행동 가능한 문구를 제공한다.

---

## 15. 계정 복구

### 15.1 위험 등급

| 계정 | 복구 방향 |
|---|---|
| 일반 소비자, 낮은 권한 | 검증된 기존 채널 + 지연·통지 |
| 리뷰어 고가치/분쟁 중 | 추가 위험 검토 |
| 점주 editor | 조직 admin 확인 가능 |
| 점주 owner/billing | strong evidence + cooling + 이중 검토 가능 |
| 운영자 | 사내 IdP/보안 절차, 소비자 지원 경로 사용 금지 |

### 15.2 self-service

```text
recovery request
 -> generic response
 -> verified existing destination
 -> fresh challenge
 -> risk evaluation
 -> credential reset
 -> session revocation
 -> notifications
```

### 15.3 기존 채널을 잃은 경우

- 연결된 다른 identity/passkey/recovery code
- 조직 내 다른 owner/admin의 제한된 확인
- 점주 사업·위임 재검증
- manual recovery case
- cooling period

지원 상담원이 이름·생년월일·전화 일부 같은 쉽게 아는 정보만으로 owner 계정을 넘기지 않는다.

### 15.4 복구 중 보호

- owner 이전·billing·대량 export 잠금
- 신규 identity 연결 제한
- 기존 채널 통지
- 공격자가 변경한 채널을 유일 통지로 사용하지 않음
- 활성 예약 운영의 안전한 임시 연속성

### 15.5 결과

복구 후:

- 모든 또는 의심 세션 해제
- identity/factor 검토
- 점주 권한·최근 변경 검토
- 보안 알림
- 감사 기록

---

## 16. 계정 병합·분리

### 16.1 병합이 필요한 경우

사용자가 서로 다른 공급자로 별도 계정을 만들었고 같은 사람임을 확인한 경우.

### 16.2 병합 전 영향

```text
public handles
reviews/visits
lists/follows/blocks
reservations
notification preferences/consents
owner memberships
moderation/restrictions
fraud/security signals
```

### 16.3 자동 병합 금지

- 같은 이메일/전화
- 같은 기기
- 같은 결제수단
- 점주 조직 관계

### 16.4 병합 절차

1. 양 계정의 fresh authentication
2. 제한·제재·법적 보존 확인
3. survivor 선택과 handle 충돌
4. 각 관계 migration plan
5. 중복 review/예약 처리
6. identity 이전
7. 기존 sessions revoke
8. redirect/tombstone와 감사

### 16.5 잘못된 병합

계정 데이터는 매우 민감하므로 분리 복구 계획과 병합 전 snapshot을 가진다. 이미 합쳐진 비공개 데이터를 양쪽에 복사해 두지 않는다.

---

## 17. 공개 프로필과 privacy

### 17.1 handle

- 전역 또는 scope별 unique 정책
- 금지어·사칭·상표
- 변경 이력과 이전 URL redirect 정책
- 이메일/전화 형태 노출 경고
- 계정 존재 enumeration 고려

### 17.2 표시명

실명일 필요가 없다. 점주 공식 답글은 개인 표시명이 아니라 조직으로 공개한다.

### 17.3 avatar

- 공개 미디어 moderation
- EXIF 제거
- 얼굴 인증 수단으로 사용하지 않음
- 삭제·변경 cache invalidation

### 17.4 공개 profile과 로그인 분리

소셜 로그인 공급자 이름·사진을 사용자 명시적 선택 없이 공개 프로필로 자동 게시하지 않는다.

---

## 18. 점주 인증과 권한

### 18.1 로그인 후 서버 검사

```text
account active
session valid
identity assurance sufficient
organization membership active
role permission
branch scope
branch authority active
resource version/state
```

### 18.2 구성원 초대

- 초대 destination과 조직·역할·지점 범위 표시
- 짧은 수명·단일 사용 token
- 기존 계정이면 로그인 후 수락
- 새 계정이어도 초대 이메일 자체를 영구 인증으로 사용하지 않음
- 초대자가 그 권한을 부여할 수 있는지 검사
- 고위험 role은 추가 승인

### 18.3 shared account 방지

- 개인별 account
- 활동·세션 목록
- 동시·지역 이상 신호
- 교육과 쉬운 초대
- 퇴사자 즉시 해제

### 18.4 owner continuity

마지막 owner 제거 금지, 최소 2명 권고, 비상 복구 절차를 둔다. owner 복구가 지점 identity 변경을 의미하지 않는다.

---

## 19. 운영자 인증

### 19.1 분리

- 사내 IdP OIDC/SAML 후보
- MFA 필수
- 관리 기기·네트워크 조건
- 별도 token issuer/audience
- production role은 JIT/short-lived 가능

### 19.2 권한

운영자 role뿐 아니라 case assignment/scope와 행위별 승인을 검사한다.

### 19.3 break-glass

- 개인별 비상 계정
- 금고 보관 credential
- 사용 시 즉시 경보
- 사건 ID
- 자동 만료·회전
- 사후 검토

공유 `admin` 계정을 일상 사용하지 않는다.

### 19.4 impersonation 금지

운영자가 사용자로 로그인하지 않는다. 필요한 경우 안전한 read-only `view as`는 명확한 banner, 제한 데이터, 감사, 쓰기 불가를 갖는다.

---

## 20. 파트너와 서비스 인증

### 20.1 파트너 client

- OAuth client credentials 또는 서명 key
- client별 scope
- organization/branch 범위
- key rotation
- IP allowlist는 보조 통제
- rate limit
- 요청 idempotency와 감사

### 20.2 webhook

- provider/partner별 secret 또는 asymmetric key
- raw body signature
- timestamp/replay window
- event ID dedupe
- key overlap rotation

### 20.3 workload identity

cloud IAM/workload role을 우선하고 장기 service secret을 줄인다. service가 사용자 access token을 재사용하지 않는다.

### 20.4 개인 API token

초기에는 제공하지 않는다. 필요하면 scope, expiry, last-used, prefix, hash 저장, 즉시 revoke, production secret scanning을 갖춘다.

---

## 21. 계정 상태

정식 상태:

```text
pending
active
restricted
suspended
closed
```

### pending

가입·필수 확인 미완료. 공개 검색은 가능하나 리뷰·예약 등 일부 행동 제한.

### active

일반 사용 가능. 개별 기능은 별도 권한과 위험 정책.

### restricted

일부 행동 제한. 로그인·자기 데이터·이의 제기는 가능할 수 있다.

### suspended

로그인 또는 대부분 기능을 중지. 보안 잠금과 정책 제재 사유를 구분한다.

### closed

계정 종료. 법적·분쟁 보존과 공개 콘텐츠 표현은 별도 상태로 처리한다.

상태 하나에 보안 잠금, 정책 제재, 사용자 종료를 모두 의미시키지 않고 reason과 restriction records를 둔다.

---

## 22. 계정 종료

### 22.1 사용자 요청

1. 최근 인증
2. 활성 예약·환불·점주 owner 영향 표시
3. 데이터·공개 콘텐츠 처리 설명
4. 종료 요청과 cooling, 필요한 경우
5. sessions/identities 해제
6. profile·관계 처리
7. 법적 보존 격리
8. search/cache/analytics/processor 전파
9. 완료 통지

### 22.2 활성 거래

계정 종료를 막기보다 예약·환불을 수행할 제한 계정 상태와 연락 수단을 제공할 수 있다. 점주 마지막 owner는 후속 owner/권한 절차가 필요하다.

### 22.3 재가입

같은 이메일·전화가 돌아와도 무조건 과거 계정을 부활시키지 않는다. legal/fraud token과 사용자 권리, retention 정책에 따라 새 account 또는 복구를 결정한다.

---

## 23. API

### 인증

```text
POST   /v1/auth/authorization-attempts
POST   /v1/auth/provider-callbacks/{provider}
POST   /v1/auth/sessions
POST   /v1/auth/token:refresh
DELETE /v1/auth/sessions/{sessionId}
POST   /v1/auth/sessions:revoke-others
```

### identity·factor

```text
GET    /v1/me/identities
POST   /v1/me/identities:link
DELETE /v1/me/identities/{identityId}
GET    /v1/me/passkeys
POST   /v1/me/passkeys/registration-options
POST   /v1/me/passkeys
DELETE /v1/me/passkeys/{passkeyId}
POST   /v1/me/mfa/totp:begin
POST   /v1/me/mfa/totp:confirm
POST   /v1/me/recovery-codes:regenerate
```

### 복구·종료

```text
POST /v1/auth/recovery-requests
POST /v1/auth/recovery-attempts/{id}:verify
POST /v1/me/closure-requests
GET  /v1/me/closure-requests/{id}
```

오류 응답은 계정 존재를 누설하지 않는다. passkey option은 challenge와 RP/origin 문맥에 묶는다.

---

## 24. 보안 통제

### 24.1 rate limit

- IP 단독이 아니라 identity 후보·device/session·endpoint 조합
- login, code send, verify, recovery, identity link
- global과 account-specific
- 분산 공격·IPv6 고려
- 정상 사용자의 대체 경로

### 24.2 CSRF

cookie 인증 web 쓰기 요청은 SameSite만 믿지 않고 origin 검사와 CSRF token 같은 방어를 적용한다.

### 24.3 XSS

HttpOnly cookie, CSP, 출력 escaping, 외부 script 제한. XSS가 사용자 세션 행동을 수행할 수 있다는 전제로 중요 작업 추가 인증을 둔다.

### 24.4 토큰 키

- KMS/HSM-backed 또는 안전한 key management
- `kid`와 rotation
- 이전 key 검증 overlap
- signing과 encryption key 분리
- private key 접근 최소화
- 비상 회전 runbook

### 24.5 로그

금지:

- authorization code
- access/refresh/id token
- cookie
- magic link/OTP
- passkey challenge raw 필요 이상
- provider access token
- 이메일·전화 원문

### 24.6 cache

`/me`, identity, session, owner 권한 응답은 private/no-store 원칙. logout/revoke 후 CDN·browser cache에서 민감 응답이 남지 않게 한다.

---

## 25. 개인정보

### 25.1 최소 scope

소셜 공급자에서 기본적으로 필요한 안정 subject와 최소 표시/연락 정보만 요청한다. 친구 목록, 생일, 성별, 전체 연락처를 기본 요청하지 않는다.

### 25.2 provider data

provider 원문 token·profile을 무기한 보존하지 않는다. 필요한 내부 필드, source, verified timestamp로 정규화한다.

### 25.3 기기·위치

보안에 필요한 대략적 신호와 정확한 사용자 위치 기능을 분리한다. 로그인 보안이라는 이유로 장기 정확 위치 history를 만들지 않는다.

### 25.4 동의

로그인 공급자 이용은 마케팅 동의가 아니다. 전화·이메일 인증과 알림 목적·마케팅 목적을 분리한다.

### 25.5 데이터 열람

사용자는 연결 identity 유형과 세션을 볼 수 있다. 내부 risk detail, 다른 계정 존재, 보안 탐지 logic은 제한할 수 있다.

---

## 26. 알림

보안 이벤트:

- 새 기기 로그인
- identity 연결·해제
- passkey/MFA 추가·삭제
- 전화·이메일 변경
- refresh reuse
- 비밀번호/복구
- 다른 세션 해제
- owner/billing 권한 변경
- 계정 잠금·복구 결과

기존·새 채널 중 어느 곳에 보낼지 사건별로 정의한다. 연락처 변경은 기존 채널에도 통지한다.

알림 링크는 로그인 후 보안 화면으로 연결하고 한 번의 click으로 위험 변경을 확정하지 않는다.

---

## 27. 관측성

### 지표

- 공급자·플랫폼별 로그인 성공/취소/실패
- auth latency
- token refresh 성공·재사용
- session revoke 반영 시간
- MFA/passkey adoption
- recovery 요청·성공·거절·오탐
- identity 연결 충돌
- account takeover 사건
- rate limit과 정상 사용자 영향
- owner 계정 strong auth coverage

### 경보

```text
login failure spike
provider callback invalid state/nonce spike
token signing/verification errors
refresh reuse spike
OTP send abuse
recovery volume anomaly
owner/billing changes spike
operator SSO failure
session revoke lag
```

대시보드에 이메일·전화·provider token을 넣지 않는다.

---

## 28. 테스트

### OIDC/OAuth

- state/nonce/PKCE
- issuer/audience/signature/exp
- redirect allowlist
- provider cancellation/error
- code replay
- mix-up/open redirect
- 공급자 subject/email 변경

### 세션

- access expiry
- refresh rotation
- consumed token reuse
- 동시 refresh
- logout/revoke
- account suspension
- key rotation
- web CSRF/cookie
- mobile secure storage lifecycle

### 계정 연결

- 같은 provider subject
- 같은 이메일 다른 provider
- identity already linked
- last identity removal
- fresh auth expiry
- account merge conflicts

### 권한

- 다른 account session
- 다른 organization/branch
- revoked membership cached token
- owner transfer
- step-up auth time
- operator/consumer audience confusion

### 복구

- 등록 여부 enumeration
- expired/replayed token
- 변경된 contact
- SIM swap-risk flow
- 고위험 owner cooling
- 지원자 권한
- 복구 후 session revoke

### 개인정보

- token/log redaction
- identity export
- account deletion 전파
- provider revocation/deletion
- non-production data

---

## 29. 기능 저하·런북

### 공급자 장애

- 다른 연결 identity 로그인 가능
- 기존 session 유지 정책
- 신규 계정 연결 중지
- 공급자별 상태 표시
- 낮은 보증 fallback으로 owner 작업 허용 금지

### token signing 문제

- 신규 발급 중지 또는 정상 key로 failover
- 이전 key validation
- key 노출이면 전체 영향·rotation·session 전략
- Security incident

### refresh reuse 급증

- 앱 버그와 공격 구분
- 영향 session family revoke
- 사용자 보안 알림
- 특정 앱 버전 refresh concurrency 확인

### 계정 탈취

[SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)의 계정 탈취 절차와 연결한다.

---

## 30. 구현 순서

### A0. 결정·기반

1. 관리형 인증 vs 자체 session ADR
2. identity/contact schema 격리
3. session/token model
4. provider adapter
5. audit/security events

### A1. 소비자

1. 한두 개 provider 로그인
2. 웹 cookie·모바일 token
3. refresh rotation
4. session 관리
5. 계정 상태·종료

### A2. 연결·복구

1. identity list/link/unlink
2. email/phone verification
3. generic recovery
4. rate/risk
5. 보안 알림

### A3. 점주

1. organization invite
2. role/branch auth
3. strong auth/MFA
4. owner transfer/recovery
5. 민감 행동 step-up

### A4. 고도화

1. passkey
2. risk-based auth
3. operator SSO/JIT
4. partner OAuth
5. managed-device policy

---

## 31. 출시 체크리스트

- [ ] 외부 provider ID가 도락 account ID가 아니다.
- [ ] 같은 이메일·전화만으로 계정을 자동 연결하지 않는다.
- [ ] authorization code + PKCE, state, nonce, exact redirect가 검증된다.
- [ ] access token은 짧고 refresh token이 회전·재사용 탐지된다.
- [ ] 웹 token은 HttpOnly/Secure cookie와 CSRF 방어를 사용한다.
- [ ] 모바일 token이 secure storage 밖 로그·analytics에 없다.
- [ ] 계정·identity·profile·예약 연락처가 분리된다.
- [ ] 점주 권한은 token claim만이 아니라 현재 organization/branch 관계를 검사한다.
- [ ] owner·billing·연락처 내보내기에 추가 인증이 있다.
- [ ] 계정 복구가 기존 strong auth보다 쉬운 우회로가 아니다.
- [ ] 운영자는 소비자로 impersonate해 쓰기할 수 없다.
- [ ] token signing key rotation과 비상 절차가 검증된다.
- [ ] 보안 이벤트가 기존 채널에 통지되고 세션 관리 화면이 있다.
- [ ] 계정 종료가 검색·캐시·분석·알림·공급자에 전파된다.

---

## 32. 미결정 사항

- 관리형 인증 공급자 vs 자체 session/identity 계층
- 초기 소비자 로그인 공급자 조합
- 이메일 magic link/code/비밀번호 선택
- 전화 identity의 로그인·복구 범위
- access token JWT vs opaque
- access/refresh/idle/absolute 만료 시간
- passkey 초기 출시 여부
- 점주 MFA 필수 역할·시점
- owner recovery의 cooling 기간과 증거
- 계정 merge 지원 시점
- 운영자 IdP와 managed device 조건
- 파트너 OAuth authorization server 구현/공급자

---

## 33. 공식 규격 참고

- [RFC 9700: OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0-18.html)
- [W3C Web Authentication Level 3](https://www.w3.org/TR/webauthn-3/)

WebAuthn Level 3은 현재 Candidate Recommendation 단계이므로 구현은 지원 브라우저·플랫폼과 안정된 하위 규격을 함께 확인한다.

---

## 34. 연관 문서

- [DATA_MODEL.md](./DATA_MODEL.md)
- [API_DESIGN.md](./API_DESIGN.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [TEST_STRATEGY.md](./TEST_STRATEGY.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
- [GLOSSARY.md](../product/GLOSSARY.md)
