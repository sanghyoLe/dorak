# 도락 API 설계

> 실행 우선순위 안내: API 계약과 보안 원칙은 유지하되 현재 HTTP 실행점은 단일 Next.js 앱의 Route Handler다. 별도 NestJS 서버와 Redis 장애 항목은 전환·확장 참고안이다.

> 상태: 초안 v0.1  
> 대상: 모바일 앱, 공개 웹, 점주 콘솔, 운영자 콘솔, 내부 워커  
> 기준: REST/JSON, OpenAPI 3.1.2, `/v1`  
> 연관 문서: [PRODUCT.md](../product/PRODUCT.md), [DATA_MODEL.md](./DATA_MODEL.md), [TECH_STACK.md](./TECH_STACK.md), [CONTRACTS_AND_SCHEMAS.md](./CONTRACTS_AND_SCHEMAS.md), [DATABASE_SCHEMA_BLUEPRINT.md](./DATABASE_SCHEMA_BLUEPRINT.md), [FOUNDATION_VERTICAL_SLICE.md](./FOUNDATION_VERTICAL_SLICE.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)

---

## 1. 목적

이 문서는 도락의 각 클라이언트와 서버 도메인 사이에 지켜야 할 계약을 정의한다. 단순한 URL 목록이 아니라 다음 문제를 일관되게 해결하는 것이 목적이다.

- 모바일, 웹, 점주, 운영자 화면이 같은 의미의 데이터를 사용한다.
- 예약, 결제, 리뷰 등록처럼 재시도가 발생하는 쓰기 작업을 안전하게 처리한다.
- 리소스 변경 충돌과 중복 요청을 예측 가능한 방식으로 표현한다.
- 개인정보와 내부 판단 근거가 공개 응답으로 새지 않게 한다.
- 서버 구현과 SDK, 문서, 계약 테스트가 하나의 OpenAPI 원본을 공유한다.
- 외부 공급자나 내부 테이블 구조가 공개 API 계약으로 노출되지 않게 한다.

---

## 2. 설계 원칙

### 2.1 API 리소스와 데이터베이스 테이블을 동일시하지 않는다

API는 사용자 행동과 제품 개념을 표현한다. 내부 조인 테이블이나 공급자 응답 형태를 그대로 노출하지 않는다.

예를 들어 음식점 상세 응답은 `branch`, 영업시간, 대표 메뉴, 공개 점수의 읽기 모델을 합쳐 제공할 수 있다. 그렇다고 이 데이터를 한 트랜잭션 테이블에 저장한다는 뜻은 아니다.

### 2.2 지점이 소비자 행동의 기본 대상이다

검색 결과, 리뷰, 저장, 방문, 예약의 식별자는 `branchId`를 사용한다. 브랜드 또는 음식점 개념인 `restaurantId`는 묶음 탐색에만 사용한다.

### 2.3 중요한 쓰기는 명령으로 취급한다

예약 생성, 예약 취소, 리뷰 게시, 점주 권한 변경은 단순 필드 덮어쓰기가 아니다. 권한 검사, 정책 검사, 상태 전환, 감사 기록, 이벤트 발행을 하나의 명령 처리로 정의한다.

### 2.4 재시도는 정상 상황이다

모바일 네트워크 단절, 프록시 타임아웃, 결제사 콜백 재전송을 전제로 한다. 클라이언트가 결과를 받지 못했다고 해서 서버 처리가 실패한 것은 아니다.

### 2.5 공개 정보와 제한 정보를 명시적으로 분리한다

같은 예약이라도 소비자, 점주 직원, 고객지원 담당자가 볼 수 있는 필드가 다르다. 범용 엔터티 직렬화 후 필드를 제거하지 않고, 용도별 응답 DTO를 별도로 정의한다.

### 2.6 호환성을 우선한다

필드 추가는 가능하지만 기존 의미 변경, 필드 타입 변경, 열거형 값 삭제는 버전 변경 없이 하지 않는다. 클라이언트는 알 수 없는 열거형 값과 추가 필드를 안전하게 무시해야 한다.

---

## 3. API 경계

### 3.1 외부 경계

| 경계       | 기본 경로      | 사용 주체             | 인증                            |
| ---------- | -------------- | --------------------- | ------------------------------- |
| 소비자 API | `/v1`          | 모바일, 공개 웹       | 선택 또는 사용자 토큰           |
| 점주 API   | `/v1/owner`    | 점주 콘솔             | 사용자 토큰 + 조직 권한         |
| 운영 API   | `/v1/ops`      | 운영자 콘솔           | 사내 인증 + 역할 + 추가 인증    |
| 파트너 API | `/v1/partners` | 승인된 외부 파트너    | OAuth client 또는 서명 자격증명 |
| 웹훅 수신  | `/v1/webhooks` | 결제·문자·예약 공급자 | 공급자 서명 검증                |

운영 API는 인터넷에 공개된 일반 사용자 인증만으로 접근할 수 없게 네트워크, 기기, 신원 정책을 추가한다.

### 3.2 내부 도메인 호출

모듈형 모놀리스 단계에서는 프로세스 내부 애플리케이션 서비스를 호출한다. 향후 서비스를 분리하더라도 외부 REST DTO를 내부 메시지 계약으로 재사용하지 않는다.

### 3.3 GraphQL을 기본으로 삼지 않는 이유

- 예약과 리뷰 명령의 트랜잭션 의미가 REST 명령 엔드포인트로 더 명확하다.
- 공개 상세 페이지는 서버에서 목적별 읽기 모델을 조합할 수 있다.
- CDN 캐시, HTTP 상태 코드, OpenAPI 기반 SDK 생성이 단순하다.
- 점주 대시보드의 복잡한 분석 조회는 별도 집계 API로 해결한다.

필요해지면 내부 분석 전용 쿼리 계층을 추가할 수 있으나 v1의 공개 계약은 REST로 통일한다.

---

## 4. 공통 HTTP 규칙

### 4.1 기본 형식

- HTTPS만 허용한다.
- 요청과 응답 본문은 `application/json; charset=utf-8`을 기본으로 한다.
- JSON 필드명은 `camelCase`를 사용한다.
- 리소스 경로는 복수 명사를 사용한다.
- 서버 시각은 UTC로 저장하고 RFC 3339 문자열로 전송한다.
- 한국 현지 날짜는 `YYYY-MM-DD`, 현지 시각은 `HH:mm`으로 별도 표현한다.
- ID는 의미가 없는 불투명 문자열로 취급한다.

### 4.2 메서드 의미

| 메서드   | 사용                                                   |
| -------- | ------------------------------------------------------ |
| `GET`    | 조회, 서버 상태 변경 없음                              |
| `POST`   | 생성 또는 명령 실행                                    |
| `PATCH`  | 일부 필드 변경                                         |
| `PUT`    | 명시적으로 전체 표현을 교체할 때만 사용                |
| `DELETE` | 삭제 또는 관계 해제, 제품 의미에 따라 soft delete 가능 |

`POST /reservations/{id}:cancel` 같은 콜론 명령은 상태 머신 전환처럼 일반 CRUD로 의미를 충분히 전달하기 어려운 경우에만 사용한다.

### 4.3 상태 코드

|                코드 | 의미                                     |
| ------------------: | ---------------------------------------- |
|               `200` | 조회 또는 동기 명령 성공                 |
|               `201` | 리소스 생성 성공                         |
|               `202` | 비동기 작업 접수                         |
|               `204` | 본문 없는 성공                           |
|               `304` | 캐시된 표현 사용 가능                    |
|               `400` | 구문 또는 기본 요청 형식 오류            |
|               `401` | 유효한 인증 없음                         |
|               `403` | 인증되었으나 권한 없음                   |
|               `404` | 리소스가 없거나 존재를 숨겨야 함         |
|               `409` | 상태 충돌, 중복, 현재 조건에서 실행 불가 |
|               `412` | `If-Match` 버전 조건 불일치              |
|               `422` | 형식은 맞지만 도메인 규칙 위반           |
|               `429` | 요청 한도 초과                           |
|               `500` | 예기치 않은 서버 오류                    |
| `502`, `503`, `504` | 의존 서비스 장애 또는 일시적 처리 불가   |

결제 승인 여부가 불명확한 경우 임의로 `500`만 반환하지 않는다. 서버는 처리 상태를 조회 가능한 결제 시도로 남기고 클라이언트가 안전하게 재조회하도록 한다.

---

## 5. 요청 문맥과 헤더

### 5.1 표준 요청 헤더

| 헤더                | 필수 조건        | 목적                                        |
| ------------------- | ---------------- | ------------------------------------------- |
| `Authorization`     | 인증 API         | Bearer access token                         |
| `Idempotency-Key`   | 중요한 생성·명령 | 중복 실행 방지                              |
| `If-Match`          | 충돌 가능한 수정 | 리소스 버전 조건                            |
| `Accept-Language`   | 선택             | 표시 언어 선호                              |
| `X-Client-Platform` | 앱 요청          | `ios`, `android`, `web`, `owner-web`        |
| `X-Client-Version`  | 앱 요청          | 호환성과 장애 분석                          |
| `X-Request-Id`      | 선택             | 클라이언트 생성 추적 ID                     |
| `X-Device-Timezone` | 선택             | 일정 표시 보조, 권한 판단에는 사용하지 않음 |

앱 설치 ID와 광고 식별자는 기본 헤더에 넣지 않는다.

### 5.2 응답 헤더

- `X-Request-Id`: 서버 추적 ID
- `ETag`: 캐시 또는 낙관적 동시성 버전
- `Cache-Control`: 공개·개인 캐시 정책
- `Retry-After`: 429 또는 일시적 제한 해제 예상
- `Deprecation`, `Sunset`: 폐기 예정 계약 공지 시 사용

---

## 6. 인증과 권한

### 6.1 토큰 원칙

- access token은 짧은 수명으로 유지한다.
- refresh token은 회전시키고 재사용을 탐지한다.
- 토큰에는 최소 식별자와 세션 수준만 넣고 가변 권한 전체를 장기 캐시하지 않는다.
- 계정 정지, 점주 권한 해제, 조직 범위는 서버에서 다시 확인한다.
- 운영자 권한은 소비자 토큰과 분리한다.

### 6.2 주요 권한 문맥

```text
anonymous
consumer(accountId)
ownerMember(accountId, organizationId, branchScopes, roles)
operator(operatorId, roles, caseScopes)
partner(clientId, scopes)
system(serviceIdentity)
```

### 6.3 객체 단위 권한

엔드포인트 접근 권한만 검사해서는 안 된다. 항상 대상 리소스의 소유 또는 범위를 함께 확인한다.

예:

- 사용자는 자기 예약만 조회한다.
- 점주 직원은 소속 조직 중 허용된 지점 예약만 조회한다.
- 메뉴 편집자는 예약 연락처를 조회할 수 없다.
- 고객지원 담당자는 배정 또는 긴급 승인된 사건의 제한 필드만 조회한다.

### 6.4 재인증

다음 작업은 최근 추가 인증 시각을 요구할 수 있다.

- 전화번호 또는 로그인 수단 변경
- 점주 조직의 소유자 이전
- 예약금·환불 정책 변경
- 대량 개인정보 내보내기
- 운영자 제재와 권한 부여

---

## 7. 응답 표현

### 7.1 단일 리소스

```json
{
  "id": "br_01K...",
  "name": "도락면옥 성수점",
  "operationalStatus": "open",
  "createdAt": "2026-09-02T05:31:12Z",
  "updatedAt": "2026-09-02T06:10:44Z",
  "resourceVersion": 17
}
```

### 7.2 목록 응답

```json
{
  "items": [],
  "page": {
    "nextCursor": "opaque-token",
    "hasMore": true
  },
  "meta": {
    "requestId": "req_01K..."
  }
}
```

목록 전체 개수는 계산 비용과 의미가 명확할 때만 제공한다. 검색 결과는 정확한 전체 개수처럼 오해될 수 있으므로 `estimatedTotal`을 별도 표기한다.

### 7.3 선택적 포함

고정된 소수의 관계만 `include`로 허용한다.

```text
GET /v1/branches/{branchId}?include=topMenus,scoreSummary
```

임의 중첩이나 필드 단위 쿼리를 허용하지 않는다. 응답 형태 폭증을 막고 캐시 키를 안정적으로 유지하기 위해 엔드포인트별 허용 목록을 둔다.

### 7.4 금액

부동소수점 숫자로 금액을 전송하지 않는다.

```json
{
  "amount": 30000,
  "currency": "KRW"
}
```

`amount`는 통화의 최소 단위 정수다. 가격이나 수수료에는 세금 포함 여부와 적용 시점의 정책 스냅샷을 함께 보존한다.

### 7.5 위치

```json
{
  "latitude": 37.5446,
  "longitude": 127.0559,
  "accuracyMeters": 25
}
```

좌표 순서 혼동을 피하기 위해 외부 JSON에서는 이름 있는 필드를 사용한다. 내부 GeoJSON을 쓸 때만 `[longitude, latitude]` 순서를 따른다.

### 7.6 값의 부재

- 모르는 값과 적용되지 않는 값을 구분한다.
- 제거된 비밀 필드는 `null`로 채우지 않고 응답에서 제외한다.
- 빈 목록은 `[]`로 반환한다.
- 사용자가 아직 평가하지 않은 항목은 0점으로 반환하지 않는다.

---

## 8. 오류 계약

### 8.1 Problem Details 기반 형식

```json
{
  "type": "https://api.dorak.example/problems/reservation-slot-unavailable",
  "title": "선택한 예약 시간이 마감되었습니다",
  "status": 409,
  "code": "RESERVATION_SLOT_UNAVAILABLE",
  "detail": "다른 시간이나 인원을 선택해 주세요.",
  "instance": "/v1/reservations",
  "requestId": "req_01K...",
  "errors": [
    {
      "field": "slotId",
      "reason": "sold_out"
    }
  ]
}
```

### 8.2 오류 코드 규칙

- 기계 판독용 `code`는 안정적으로 유지한다.
- 사용자 문구는 서버 또는 클라이언트의 현지화 계층에서 변경할 수 있다.
- 내부 예외명, SQL, 공급자 원문 오류를 노출하지 않는다.
- `detail`에 계정 존재 여부나 제재 탐지 규칙을 누설하지 않는다.

### 8.3 대표 도메인 오류

| 코드                               | HTTP | 의미                     |
| ---------------------------------- | ---: | ------------------------ |
| `AUTHENTICATION_REQUIRED`          |  401 | 로그인 필요              |
| `ADDITIONAL_VERIFICATION_REQUIRED` |  403 | 추가 인증 필요           |
| `RESOURCE_NOT_FOUND`               |  404 | 없거나 접근 불가         |
| `RESOURCE_VERSION_MISMATCH`        |  412 | 수정 버전 충돌           |
| `IDEMPOTENCY_KEY_REUSED`           |  409 | 다른 요청에 같은 키 사용 |
| `REVIEW_ALREADY_EXISTS`            |  409 | 허용 범위의 중복 리뷰    |
| `REVIEW_VISIT_REQUIRED`            |  422 | 방문 정보 필요           |
| `RESERVATION_SLOT_UNAVAILABLE`     |  409 | 재고 소진                |
| `RESERVATION_TRANSITION_INVALID`   |  409 | 불가능한 상태 전환       |
| `CANCELLATION_DEADLINE_PASSED`     |  422 | 취소 정책상 제한         |
| `PAYMENT_STATE_UNKNOWN`            |  409 | 결제사 확인 필요         |
| `RATE_LIMITED`                     |  429 | 요청 한도 초과           |

---

## 9. 페이지네이션과 정렬

### 9.1 커서 기반 페이지네이션

피드, 리뷰, 예약 내역, 운영 큐에는 커서를 사용한다.

```text
GET /v1/branches/{branchId}/reviews?limit=20&cursor=opaque-token
```

커서에는 정렬 값, tie-breaker ID, 쿼리 버전이 서명되어 들어갈 수 있다. 클라이언트가 커서 내부를 해석하거나 수정할 수 없게 한다.

### 9.2 안정적인 정렬

모든 정렬에는 최종 tie-breaker로 고유 ID를 추가한다.

```text
publishedAt DESC, reviewId DESC
```

### 9.3 검색 페이지네이션

검색은 [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)의 `search_after` 계약을 따른다. 지도 이동으로 검색 범위가 달라지면 이전 커서를 재사용하지 않는다.

### 9.4 제한값

- 기본 `limit`: 20
- 일반 최대: 100
- 운영 내보내기: 비동기 작업으로 분리
- 너무 큰 `limit`은 자동 절삭하지 않고 400으로 알려 클라이언트 오류를 드러낸다.

---

## 10. 멱등성

### 10.1 적용 대상

다음 요청에는 `Idempotency-Key`를 필수로 한다.

- 예약 생성
- 예약 변경·취소 명령
- 결제 및 환불 시도
- 리뷰 게시
- 점주 초대 발송
- 데이터 내보내기 작업 생성

### 10.2 서버 동작

멱등성 레코드는 다음을 저장한다.

```text
actor scope
endpoint and method
idempotency key hash
canonical request hash
processing status
response status and safe response body
created_at and expires_at
```

처리 규칙:

1. 같은 행위자, 경로, 키가 처음 오면 처리권을 획득한다.
2. 같은 키와 같은 요청 본문이면 기존 결과를 반환한다.
3. 같은 키에 다른 요청 본문을 사용하면 `IDEMPOTENCY_KEY_REUSED`를 반환한다.
4. 첫 요청이 처리 중이면 완료까지 짧게 기다리거나 `409/202`와 조회 위치를 반환한다.
5. 서버가 결과를 확정할 수 없는 상태를 성공이나 실패로 임의 재분류하지 않는다.

### 10.3 키 범위와 보존

키는 계정 또는 파트너 범위 안에서 유일하다. 예약·결제 관련 키는 일반 콘텐츠 요청보다 길게 보존하며, 정확한 기간은 분쟁·결제 운영 정책과 맞춘다.

---

## 11. 동시성 제어

### 11.1 낙관적 잠금

점주가 메뉴, 영업시간, 예약 정책을 수정할 때 `resourceVersion` 또는 `ETag`를 사용한다.

```http
PATCH /v1/owner/branches/br_123/hours
If-Match: "17"
```

버전이 달라졌다면 `412 RESOURCE_VERSION_MISMATCH`와 현재 안전한 요약을 반환한다. 서버가 마지막 저장으로 조용히 덮어쓰지 않는다.

### 11.2 강한 재고 제약

예약 확정은 ETag만으로 처리하지 않는다. 데이터베이스 잠금, 원자적 조건부 갱신, 고유 제약을 이용해 실제 좌석 또는 용량이 음수가 되지 않게 한다.

### 11.3 변경 명령의 사전 조건

예약 취소 요청에는 사용자가 마지막으로 본 버전을 함께 보낼 수 있다. 이미 점주가 예약을 변경한 경우 최신 정책과 상태를 다시 보여 주고 재확인을 요구한다.

---

## 12. 비동기 작업

대량 데이터 내보내기, 지점 병합, 대량 메뉴 업로드는 비동기 작업으로 처리한다.

```json
{
  "jobId": "job_01K...",
  "status": "queued",
  "statusUrl": "/v1/owner/jobs/job_01K..."
}
```

작업 상태:

```text
queued -> running -> succeeded
                  -> failed
                  -> partially_succeeded
queued/running -> cancellation_requested -> cancelled
```

작업 결과 파일은 짧은 수명의 서명 URL로 제공하고 권한을 다시 확인한다. 실패 항목에는 개인정보 원문 대신 행 번호와 안전한 오류 코드를 제공한다.

---

## 13. 미디어 업로드

### 13.1 3단계 흐름

1. 클라이언트가 업로드 세션을 생성한다.
2. 허용된 객체 경로에 직접 업로드한다.
3. 완료 명령을 보내 서버가 크기, MIME, 해시, 소유권을 검증한다.

```text
POST /v1/media-upload-sessions
POST /v1/media-upload-sessions/{id}:complete
```

### 13.2 상태

```text
created -> uploaded -> scanning -> ready
                             -> rejected
created -> expired
```

검사 전 객체는 공개 버킷 또는 공개 CDN 경로에 두지 않는다. 이미지의 EXIF 위치 정보는 제품상 필요한 경우를 제외하고 제거한다.

### 13.3 제한

업로드 세션은 파일 종류, 최대 크기, 개수, 목적(`review`, `menu`, `official`)을 고정한다. 점주 메뉴 사진용 세션을 리뷰 증빙 업로드에 재사용할 수 없다.

---

## 14. 소비자 API 목록

### 14.1 세션과 계정

```text
POST   /v1/auth/sessions
POST   /v1/auth/token:refresh
DELETE /v1/auth/sessions/{sessionId}
GET    /v1/me
PATCH  /v1/me/profile
GET    /v1/me/consents
PATCH  /v1/me/consents/{consentType}
POST   /v1/me/data-exports
POST   /v1/me/closure-requests
```

### 14.2 검색과 음식점

```text
GET /v1/search/branches
GET /v1/search/autocomplete
GET /v1/branches/{branchId}
GET /v1/branches/{branchId}/hours
GET /v1/branches/{branchId}/menus
GET /v1/branches/{branchId}/photos
GET /v1/branches/{branchId}/score-summary
GET /v1/branches/{branchId}/reservation-availability
```

`score-summary`는 점수와 신뢰 구간, 유효 리뷰 수, 모델 표시 버전을 제공하되 개별 리뷰 가중치나 부정행위 탐지 신호는 공개하지 않는다.

### 14.3 리뷰와 방문

```text
GET    /v1/branches/{branchId}/reviews
POST   /v1/reviews
GET    /v1/reviews/{reviewId}
PATCH  /v1/reviews/{reviewId}
POST   /v1/reviews/{reviewId}:publish
DELETE /v1/reviews/{reviewId}
POST   /v1/reviews/{reviewId}/reactions
DELETE /v1/reviews/{reviewId}/reactions/{reactionType}
POST   /v1/visits
POST   /v1/visits/{visitId}/verification-attempts
GET    /v1/visits/{visitId}/verification
```

리뷰 초안 저장과 공개 게시를 분리한다. 게시 명령에서 최신 정책 동의, 경제적 이해관계 공개, 방문 연결을 최종 검증한다.

### 14.4 저장과 목록

```text
GET    /v1/me/lists
POST   /v1/me/lists
PATCH  /v1/me/lists/{listId}
DELETE /v1/me/lists/{listId}
POST   /v1/me/lists/{listId}/branches
DELETE /v1/me/lists/{listId}/branches/{branchId}
GET    /v1/lists/{publicSlug}
```

### 14.5 소셜

```text
GET    /v1/reviewers/{handle}
GET    /v1/reviewers/{handle}/reviews
POST   /v1/me/following/{reviewerId}
DELETE /v1/me/following/{reviewerId}
GET    /v1/me/feed
```

차단된 사용자 관계는 단순 빈 목록이 아니라 프라이버시 정책에 맞춰 존재 노출을 최소화한다.

### 14.6 신고

```text
POST /v1/reports
GET  /v1/me/reports/{reportId}
```

신고 응답은 접수 상태와 결과의 큰 범주만 제공한다. 내부 위험 점수, 제보자 신원, 조사 증거는 공개하지 않는다.

### 14.7 예약

```text
GET  /v1/branches/{branchId}/reservation-availability
POST /v1/reservation-holds
GET  /v1/reservation-holds/{holdId}
POST /v1/reservations
GET  /v1/me/reservations
GET  /v1/reservations/{reservationId}
POST /v1/reservations/{reservationId}:request-change
POST /v1/reservations/{reservationId}:cancel
POST /v1/reservations/{reservationId}:confirm-attendance
```

세부 계약과 상태 전이는 [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)에서 정의한다.

---

## 15. 점주 API 목록

### 15.1 조직과 지점 권한

```text
GET    /v1/owner/organizations
GET    /v1/owner/organizations/{organizationId}
POST   /v1/owner/organizations/{organizationId}/invitations
GET    /v1/owner/organizations/{organizationId}/members
PATCH  /v1/owner/organizations/{organizationId}/members/{memberId}
DELETE /v1/owner/organizations/{organizationId}/members/{memberId}
POST   /v1/owner/branch-claims
GET    /v1/owner/branch-claims/{claimId}
```

### 15.2 공식 정보

```text
GET   /v1/owner/branches/{branchId}
PATCH /v1/owner/branches/{branchId}/official-profile
PUT   /v1/owner/branches/{branchId}/regular-hours
POST  /v1/owner/branches/{branchId}/special-hours
POST  /v1/owner/branches/{branchId}/menus
PATCH /v1/owner/branches/{branchId}/menus/{menuId}
POST  /v1/owner/branches/{branchId}/photos
```

점주 수정은 출처가 명시된 assertion으로 기록하며, 법적 상호나 영업 상태처럼 검증이 필요한 필드는 즉시 공개되지 않을 수 있다.

### 15.3 리뷰 대응

```text
GET    /v1/owner/branches/{branchId}/reviews
POST   /v1/owner/reviews/{reviewId}/responses
PATCH  /v1/owner/reviews/{reviewId}/responses/{responseId}
DELETE /v1/owner/reviews/{reviewId}/responses/{responseId}
POST   /v1/owner/reviews/{reviewId}/reports
```

### 15.4 예약 운영

```text
GET  /v1/owner/branches/{branchId}/reservation-board
POST /v1/owner/branches/{branchId}/reservations
GET  /v1/owner/reservations/{reservationId}
POST /v1/owner/reservations/{reservationId}:confirm
POST /v1/owner/reservations/{reservationId}:reject
POST /v1/owner/reservations/{reservationId}:propose-change
POST /v1/owner/reservations/{reservationId}:seat
POST /v1/owner/reservations/{reservationId}:complete
POST /v1/owner/reservations/{reservationId}:mark-no-show
```

전화·현장 예약을 수동 등록할 때는 최소 연락처, 수집 출처, 고지 상태를 구분한다.

### 15.5 분석

```text
GET /v1/owner/branches/{branchId}/analytics/overview
GET /v1/owner/branches/{branchId}/analytics/discovery
GET /v1/owner/branches/{branchId}/analytics/reservations
POST /v1/owner/branches/{branchId}/analytics/exports
```

작은 집단에서 개인을 추론할 수 있는 분석 항목은 임계치 이하를 숨기거나 기간을 합친다.

---

## 16. 운영자 API 원칙

운영자 API는 기능 편의보다 오용 방지와 감사 가능성을 우선한다.

### 16.1 공통 요구

- 사건 또는 작업 티켓 ID를 변경 사유에 연결한다.
- 조회만 해도 민감도가 높은 화면은 접근 로그를 남긴다.
- 제재, 병합, 환불, 개인정보 열람은 역할을 분리한다.
- 대량 조회와 내보내기는 추가 승인과 워터마크를 요구할 수 있다.
- 원본 증빙의 다운로드보다 제한된 뷰어를 우선한다.

### 16.2 대표 엔드포인트

```text
GET  /v1/ops/cases
GET  /v1/ops/cases/{caseId}
POST /v1/ops/cases/{caseId}:assign
POST /v1/ops/cases/{caseId}:request-evidence
POST /v1/ops/cases/{caseId}:decide
POST /v1/ops/cases/{caseId}:close

GET  /v1/ops/entity-changes
POST /v1/ops/branches/{branchId}:merge-plan
POST /v1/ops/merge-plans/{planId}:approve
POST /v1/ops/merge-plans/{planId}:execute

GET  /v1/ops/reservation-cases
POST /v1/ops/reservation-cases/{caseId}:resolve
```

실행 전 영향 미리보기와 실행 후 결과 보고서를 별도 리소스로 남긴다.

---

## 17. 상세 계약 예시

### 17.1 리뷰 생성

```http
POST /v1/reviews
Authorization: Bearer ...
Idempotency-Key: 01K_REVIEW_CREATE
Content-Type: application/json
```

```json
{
  "branchId": "br_01K...",
  "visitId": "vis_01K...",
  "content": {
    "body": "국물이 깔끔하고 면 익힘이 좋았다.",
    "ratings": {
      "overall": 4.0,
      "taste": 4.5,
      "service": 3.5,
      "ambience": 4.0,
      "value": 4.0
    }
  },
  "disclosure": {
    "type": "self_paid"
  },
  "mediaIds": ["med_01K..."]
}
```

응답은 기본적으로 `draft`다. 공개 게시 여부를 생성과 묶지 않아 자동 저장, 정책 오류 수정, 검수 상태를 명확히 한다.

### 17.2 예약 가능 시간 조회

```text
GET /v1/branches/br_123/reservation-availability
    ?date=2026-09-12
    &partySize=2
    &courseId=course_123
```

```json
{
  "branchId": "br_123",
  "localDate": "2026-09-12",
  "timezone": "Asia/Seoul",
  "partySize": 2,
  "slots": [
    {
      "slotId": "slot_1830",
      "localTime": "18:30",
      "available": true,
      "confirmationMode": "instant",
      "deposit": {
        "amount": 20000,
        "currency": "KRW"
      },
      "policyVersionId": "cp_7"
    }
  ],
  "availabilityVersion": "av_91"
}
```

가용성 조회는 판매 보장이 아니다. 생성 시 재고를 다시 검사하고 필요하면 짧은 hold를 획득한다.

### 17.3 예약 생성

```http
POST /v1/reservations
Authorization: Bearer ...
Idempotency-Key: 01K_BOOK_ABC
```

```json
{
  "holdId": "hold_01K...",
  "party": {
    "size": 2,
    "bookerName": "홍길동",
    "mobilePhoneToken": "contact_token_01K..."
  },
  "requests": "창가 자리가 가능하면 부탁드립니다.",
  "policyAcceptance": {
    "cancellationPolicyVersionId": "cp_7",
    "acceptedAt": "2026-09-02T07:10:00Z"
  },
  "paymentMethodToken": "pm_tok_01K..."
}
```

클라이언트가 카드번호나 민감 결제 인증값을 도락 서버로 직접 전송하지 않게 결제사 토큰화를 사용한다.

---

## 18. 캐시와 조건부 요청

### 18.1 공개 상세

- 음식점 기본 정보: 짧은 CDN 캐시 + stale-while-revalidate
- 공개 리뷰 목록: 정렬별 짧은 캐시
- 점수 요약: 점수 발행 버전까지 캐시 키에 포함
- 실시간 예약 가용성: 공유 CDN 장기 캐시 금지
- `me`, 예약 내역, 점주 응답: `private, no-store` 또는 목적별 엄격한 개인 캐시

### 18.2 ETag

공개 읽기에는 콘텐츠 기반 또는 표현 버전 기반 ETag를 제공할 수 있다. 점주 수정의 ETag는 권한과 무관한 리소스 버전이어야 하며 비밀값을 해시 입력으로 노출하지 않는다.

### 18.3 무효화

점주 변경이 승인되면 상세 읽기 모델과 검색 색인 갱신 이벤트를 발행한다. 캐시 삭제 성공을 DB 트랜잭션의 일부로 가정하지 않으며 짧은 TTL과 버전 키를 함께 사용한다.

---

## 19. 요청 제한과 남용 방지

한도는 IP 하나만으로 판단하지 않는다. 인증 계정, 기기 위험 신호, 파트너, 엔드포인트 비용, 지점 범위를 함께 고려한다.

| 유형           | 정책 방향                       |
| -------------- | ------------------------------- |
| 공개 검색      | 버스트 허용, 자동화 탐지        |
| 로그인 시도    | 계정과 IP 조합으로 강한 제한    |
| 리뷰 게시      | 계정 신뢰·방문·속도 기반        |
| 예약 생성      | 계정·연락처·결제수단·지점 기반  |
| 신고           | 남용 방지와 긴급 신고 통로 균형 |
| 점주 대량 수정 | 조직별 동시 작업 제한           |
| 운영자 조회    | 역할별 목적 제한과 감사         |

429 응답은 가능한 경우 `Retry-After`를 포함한다. 제한 임계치와 탐지 신호는 공개 API 문서에 세부 노출하지 않는다.

---

## 20. 웹훅

### 20.1 수신

결제사와 메시지 공급자 웹훅 처리 순서:

1. 원본 본문을 보존한 상태로 서명을 검증한다.
2. 공급자 이벤트 ID와 유형을 기록한다.
3. 이미 처리한 이벤트면 기존 처리 결과를 반환한다.
4. 수신 응답은 빠르게 끝내고 무거운 처리는 큐로 넘긴다.
5. 내부 상태 전환은 현재 상태와 이벤트 순서를 검증한다.
6. 알 수 없는 결제 상태는 조회 API로 재조정한다.

웹훅 도착 순서는 보장하지 않는다. `paid` 후 늦게 도착한 `pending` 이벤트가 상태를 되돌리지 못하게 공급자 발생 시각과 상태 전이 규칙을 사용한다.

### 20.2 발신 파트너 웹훅

- 이벤트별 고유 ID
- HMAC 또는 비대칭 서명
- 타임스탬프와 재전송 공격 방지 범위
- 지수 백오프 재시도
- 고객별 dead-letter와 재생 도구
- 비밀 회전 시 중첩 유효 기간

개인정보 전체 객체를 보내지 않고 이벤트 처리에 필요한 최소 식별자와 변경 요약만 보낸다.

---

## 21. 버전 관리와 폐기

### 21.1 버전 범위

주 버전은 경로 `/v1`에 둔다. 사소한 호환 추가마다 버전을 올리지 않는다.

### 21.2 호환 가능한 변경

- 선택 필드 추가
- 새 엔드포인트 추가
- 응답 열거형 새 값 추가
- 선택 쿼리 파라미터 추가

클라이언트는 알 수 없는 값에 대한 fallback을 가져야 한다.

### 21.3 호환되지 않는 변경

- 필수 요청 필드 추가
- 기존 필드 삭제 또는 타입 변경
- 필드 의미 변경
- 기존 상태 전이 제거
- 기존 오류 코드의 의미 변경

### 21.4 폐기 절차

1. 사용량과 영향 클라이언트를 확인한다.
2. 대체 계약과 이행 가이드를 먼저 제공한다.
3. 서버 헤더와 개발자 공지로 폐기를 알린다.
4. 지원 중인 앱 최소 버전이 이행했는지 측정한다.
5. 유예 기간 후 제거한다.

긴급 보안 차단은 예외지만, 가능한 범위에서 명시적인 오류와 복구 경로를 제공한다.

---

## 22. OpenAPI와 SDK

### 22.1 원본 관리

- 서버 DTO와 분리된 검토 가능한 OpenAPI 문서를 유지한다.
- 엔드포인트별 소유 도메인을 표시한다.
- 예시에는 실사용자 데이터나 실제 토큰을 넣지 않는다.
- 생성된 SDK는 수동 편집하지 않는다.
- 모바일과 웹 타입은 같은 스키마에서 생성한다.

### 22.2 CI 검증

```text
OpenAPI lint
breaking change detection
schema examples validation
generated client build
consumer contract tests
authorization test matrix
```

### 22.3 스키마 규칙

- 열거형은 공개 계약에 실제로 필요한 값만 포함한다.
- 내부 `fraudScore`, `moderationSignals`, 공급자 토큰은 스키마에 존재하지 않게 한다.
- `oneOf` 남용을 피하고 클라이언트 코드 생성 호환성을 검증한다.
- nullable과 optional을 구분한다.

---

## 23. 관측성과 감사

### 23.1 요청 추적

모든 요청은 추적 ID를 갖고 다음 이벤트에 연결된다.

- API 요청 로그
- 데이터베이스 변경 감사
- outbox 이벤트
- 비동기 작업
- 공급자 호출
- 고객지원 사건

### 23.2 로그 제한

기본 로그에 다음 값을 남기지 않는다.

- Authorization, cookie, refresh token
- 예약자 이름, 전화번호, 동행자 정보
- 리뷰 비공개 초안 원문
- 영수증 및 방문 증빙
- 결제 토큰
- 정확한 사용자 위치

경로에 이메일이나 전화번호를 넣지 않는다. 필요한 오류 분석용 식별자는 내부 불투명 ID나 일관된 비가역 토큰을 사용한다.

### 23.3 변경 감사

중요 변경에는 다음을 기록한다.

```text
actor type and id
authority context
target type and id
before/after safe diff
reason code
request id
occurred_at
```

민감 필드의 원문 before/after는 감사 로그에도 복제하지 않고 변경 여부나 별도 보안 저장소 참조만 남긴다.

---

## 24. 성능과 가용성 목표

초기 설계 목표이며 실제 트래픽 측정 후 조정한다.

| 작업          | 서버 p95 목표 | 비고                           |
| ------------- | ------------: | ------------------------------ |
| 자동완성      |    150ms 이하 | 공급자 외부 호출 제외          |
| 검색          |    400ms 이하 | 일반 쿼리, 검색 엔진 응답 포함 |
| 음식점 상세   |    300ms 이하 | 캐시 적중 시 더 낮음           |
| 리뷰 목록     |    350ms 이하 | 첫 페이지                      |
| 예약 가용성   |    500ms 이하 | 재고 DB 조회 포함              |
| 예약 생성     |    1.5초 이하 | 3DS 등 사용자 인증 대기 제외   |
| 점주 예약대장 |    500ms 이하 | 하루 또는 제한 기간            |

예약 생성 타임아웃은 처리 취소를 의미하지 않는다. 결과 조회 가능한 리소스를 남기고 멱등 재시도를 지원한다.

---

## 25. 테스트 전략

### 25.1 계약 테스트

- 모든 예시 요청·응답의 스키마 검증
- 앱이 사용하는 필드와 서버 응답의 호환성
- 알 수 없는 열거형 값 fallback
- 오류 응답의 안정된 `code`
- 페이지 커서 변조와 만료

### 25.2 권한 테스트

행위자 × 리소스 관계 × 상태를 표로 관리한다.

```text
anonymous / owner / other user / owner editor / reservation manager / operator
own resource / same organization / other branch / restricted account
draft / published / hidden / cancelled / completed
```

403만 테스트하지 않고 다른 조직의 ID를 바꿔 접근하는 객체 권한 취약점을 집중 검증한다.

### 25.3 멱등·동시성 테스트

- 동일 키 동시 100회 요청
- 같은 키에 다른 본문
- 커밋 직후 응답 단절
- 결제 성공 후 웹훅 중복·역순 도착
- 마지막 예약 좌석 동시 구매
- 점주 수정과 소비자 예약 동시 실행

### 25.4 복원력 테스트

- 검색 장애 시 데이터베이스 fallback 범위
- Redis 장애 시 핵심 읽기·쓰기 동작
- 큐 지연 중 outbox 적체
- 결제사 타임아웃과 재조정
- 미디어 검사 지연이 리뷰 텍스트 저장을 막지 않는지 확인

---

## 26. 구현 순서

### 단계 1. 계약 기반

1. 공통 ID, 시간, 금액, 위치 스키마
2. 오류 형식과 요청 ID
3. 사용자 세션과 권한 미들웨어
4. 커서와 멱등성 저장소
5. OpenAPI lint 및 변경 탐지

### 단계 2. 탐색과 리뷰

1. 검색·자동완성
2. 음식점 상세 읽기 모델
3. 리뷰 초안·게시·수정
4. 저장 목록
5. 신고

### 단계 3. 점주

1. 조직과 지점 범위 권한
2. 지점 claim
3. 공식 정보와 영업시간
4. 메뉴·미디어
5. 리뷰 답글

### 단계 4. 예약

1. 가용성 조회
2. hold와 예약 생성
3. 결제·환불 웹훅
4. 변경·취소·노쇼
5. 점주 예약대장

### 단계 5. 운영과 파트너

1. 사건 처리 API
2. 데이터 병합 계획
3. 분석 내보내기
4. 승인된 파트너 API와 발신 웹훅

---

## 27. 출시 전 체크리스트

- [ ] 모든 공개 API가 OpenAPI에 존재한다.
- [ ] 모바일과 웹 SDK가 같은 계약에서 생성된다.
- [ ] 소비자·점주·운영자 권한 매트릭스 테스트가 통과한다.
- [ ] 예약·결제 명령이 멱등성 테스트를 통과한다.
- [ ] 오류 로그와 APM에서 개인정보가 제거된다.
- [ ] API 응답에 내부 부정행위·검수 신호가 노출되지 않는다.
- [ ] 캐시 정책이 공개/개인 응답별로 검토되었다.
- [ ] 폐기 및 최소 앱 버전 운영 절차가 있다.
- [ ] 결제·문자 웹훅의 서명, 중복, 역순 테스트가 통과한다.
- [ ] 운영자 민감 조회와 변경에 감사 로그가 남는다.
- [ ] 부하 테스트에서 커넥션 풀과 하위 시스템 제한이 검증되었다.

---

## 28. 미결정 사항

- 공개 API를 제3자에게 언제, 어떤 범위로 제공할지
- 모바일 BFF를 별도로 둘 트래픽·조직 임계점
- 파트너 인증에 OAuth 2.1 client credentials와 요청 서명을 함께 요구할지
- 공개 사용자 프로필의 삭제된 콘텐츠 표현 방식
- 예약 결제의 동기 응답 최대 대기 시간
- 점주 분석 내보내기의 최소 집계 임계치
- 다국어 필드를 동일 응답에 넣을지 locale별 표현을 분리할지

---

## 29. 공식 참고 규격

- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [OpenAPI Specification 3.1.2](https://spec.openapis.org/oas/v3.1.2.html)
- [RFC 3339: Date and Time on the Internet](https://www.rfc-editor.org/rfc/rfc3339)

규격 링크는 구현 선택의 근거다. 인증·전자상거래·개인정보의 국내 법적 의무는 출시 시점의 정책과 법률 검토를 별도로 거친다.
