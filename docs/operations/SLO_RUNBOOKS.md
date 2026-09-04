# 도락 서비스 목표·경보·런북 설계

> 실행 우선순위 안내: 현재 운영 대상은 Vercel의 단일 Next.js 배포와 Neon PostgreSQL이다. Redis·OpenSearch·AWS 전용 런북은 미도입 서비스의 확장 참고안이며 현재 출시 gate가 아니다.

> 상태: 초안 v0.1  
> 범위: 소비자·점주·운영 서비스의 SLI/SLO, 오류 예산, 경보, 기능 저하, 장애별 복구 절차  
> 원칙: 인프라가 켜져 있는지가 아니라 사용자가 신뢰 가능한 결정을 완료할 수 있는지를 측정한다.  
> 연관 문서: [TECH_STACK.md](../architecture/TECH_STACK.md), [DEPLOYMENT_ENVIRONMENTS.md](./DEPLOYMENT_ENVIRONMENTS.md), [OPERATIONS.md](./OPERATIONS.md), [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md), [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md), [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)

---

## 1. 목적

SLO는 ‘99.9%’ 숫자를 붙이는 문서가 아니라 다음을 합의하는 계약이다.

- 어떤 사용자 행동을 좋은 이벤트와 나쁜 이벤트로 셀 것인가
- 어느 시간 창에서 어느 수준까지 실패를 허용할 것인가
- 오류 예산을 다 쓸 때 제품 출시 속도를 어떻게 조절할 것인가
- 누구를 언제 깨우는 경보가 필요한가
- 장애 시 무엇을 유지하고 무엇을 안전하게 닫을 것인가
- 복구 완료를 어떤 증거로 확인할 것인가

---

## 2. 원칙

### 2.1 사용자 여정 SLI와 컴포넌트 지표를 구분한다

CPU, 메모리, pod 수는 원인 진단 지표다. 사용자가 검색 결과를 받고, 리뷰를 저장하고, 예약을 확정하는지가 SLI다.

### 2.2 가용성과 정확성을 함께 본다

200 응답이 와도 폐업 지점만 나오거나 예약을 중복 판매하면 좋은 이벤트가 아니다.

### 2.3 Q0 불변식은 오류 예산으로 거래하지 않는다

다음은 ‘월 0.01%까지 허용’ 대상이 아니다.

- 활성 예약 자원의 중복 배정
- 이중 결제
- 다른 조직의 예약 연락처 노출
- 승인 없이 공개 점수 모델 변경
- 삭제·철회 대상의 의도적 재노출

0건 목표 불변식과 탐지·대응 목표를 별도로 둔다.

### 2.4 의존성 SLO를 그대로 약속하지 않는다

지도·결제·문자 공급자의 SLA와 도락 사용자 SLO는 다르다. 캐시, fallback, 기능 차단, 조정으로 도락의 약속을 설계한다.

### 2.5 측정 가능해진 뒤 숫자를 확정한다

이 문서의 수치는 초기 설계 목표다. 트래픽·지연·사용 패턴을 측정한 뒤 분기별 검토한다. 목표를 낮춰 장애를 숨기지 않는다.

---

## 3. 용어

### SLI

서비스 수준을 계산하는 측정값. 예: 28일 동안 성공한 검색 요청 비율.

### SLO

SLI의 내부 목표. 예: 검색 가용성 99.9%.

### SLA

외부 계약상 보상·책임이 연결된 약속. 내부 SLO와 동일하지 않다.

### 좋은 이벤트 `good event`

정의된 시간·정확성·권한 조건을 만족한 사용자 작업.

### 유효 이벤트 `valid event`

SLI 분모에 포함할 실제 사용자 요청. 봇, load test, 명백한 잘못된 요청, 사용자가 취소한 일부 요청은 정책에 따라 제외한다.

### 오류 예산 `error budget`

목표 기간에 허용되는 나쁜 이벤트 비율 또는 시간.

### burn rate

오류 예산을 목표보다 얼마나 빠르게 쓰는지 나타낸 비율.

### 기능 저하 `degraded mode`

일부 의존성이 실패해도 안전한 읽기·대체 행동만 유지하는 상태.

---

## 4. 측정 창

### 4.1 기본 창

- 운영 대시보드: 5분, 1시간, 24시간
- SLO 평가: rolling 28일
- 장기 추세: 월·분기
- 데이터 품질: source 주기·일·주
- 평점 발행: 발행 회차와 28일

### 4.2 트래픽 없는 기간

요청 기반 SLI에서 트래픽이 없으면 100%로 임의 계산하지 않고 `no data`로 표시한다. 예약 지점별 SLO는 작은 표본 때문에 지역·전체 집계를 함께 본다.

### 4.3 제외

제외 기준은 사전에 명시한다.

- 내부 synthetic와 load test
- 승인된 bot/crawler의 별도 지표
- 4xx 중 사용자 입력 오류
- rate limit이 정상 정책 집행인 경우
- 공급자 장애라도 도락 사용자가 실패했다면 사용자 SLI에서는 제외하지 않음

장애 후 유리하게 분모를 바꾸지 않는다.

---

## 5. 서비스 카탈로그

| 서비스          | 사용자 결과           | owner               | 중요도   |
| --------------- | --------------------- | ------------------- | -------- |
| Auth            | 안전한 로그인·세션    | Platform            | Critical |
| Branch Registry | 정확한 지점 상세      | Data Platform       | High     |
| Search          | 의도에 맞는 결과·지도 | Discovery           | High     |
| Review          | 초안·게시·조회        | Trust               | High     |
| Rating          | 승인된 점수·랭킹      | Trust/Data          | High     |
| Media           | 사진 업로드·표시      | Platform            | Medium   |
| Owner           | 지점·권한·운영        | Merchant            | High     |
| Booking         | 가용성·예약 상태      | Booking             | Critical |
| Payments        | 결제·환불·조정        | Booking/Finance     | Critical |
| Notifications   | 거래·보안 전달        | Platform/Booking    | High     |
| Operations      | 사건·복구 명령        | Operations Platform | High     |
| Analytics       | 지표·점주 집계        | Data                | Medium   |

각 서비스는 코드 저장소 경로, dashboard, alert, runbook, on-call, dependency, data classification을 카탈로그에 연결한다.

---

## 6. 공통 SLI 설계

### 6.1 가용성

```text
good valid requests / all valid requests
```

좋은 요청:

- 예상된 HTTP 상태
- 내부 timeout 이내
- 요청 의미가 실제로 처리됨
- 권한 bypass나 stale success 아님

### 6.2 지연

임계치 이하의 유효 요청 비율 또는 p95/p99. 평균 latency를 사용하지 않는다.

### 6.3 최신성

```text
now - source/domain change occurred_at
```

검색 색인, 점주 예약대장, 분석 집계, 알림 queue에 적용한다.

### 6.4 정확성

자동화된 불변식과 표본 검수로 측정한다.

예:

- search result에 closed branch가 정책 위반으로 노출되지 않음
- rating snapshot과 공개 score 일치
- reservation allocation overlap 0
- 분석 예약 수와 원장 일치

### 6.5 내구성

승인된 쓰기가 이후 조회·복구에서 손실되지 않는 비율. outbox·backup·restore로 검증한다.

---

## 7. 소비자 읽기 SLO

### 7.1 음식점 상세

초기 목표:

| SLI                        |         목표 |
| -------------------------- | -----------: |
| 유효 상세 요청 성공        | 99.9% / 28일 |
| 서버 p95                   |   300ms 이하 |
| 서버 p99                   |   800ms 이하 |
| branch 변경→공개 상세 반영 | p99 2분 이하 |

좋은 상세 응답은 branchId와 필수 공개 상호·운영 상태를 포함하고 권한 없는 비공개 필드가 없어야 한다.

### 7.2 리뷰 읽기

| SLI                      |                       목표 |
| ------------------------ | -------------------------: |
| 첫 페이지 성공           |                      99.9% |
| 서버 p95                 |                 350ms 이하 |
| 제거 결정→공개 노출 중지 | P0/P1 정책은 1분 이내 목표 |

### 7.3 공개 웹

- 주요 상세의 LCP/INP/CLS를 실제 사용자 데이터로 측정
- SEO crawler 성공과 실제 사용자 성공을 분리
- JS 실패 시 핵심 음식점 정보 fallback 범위 정의

---

## 8. 검색 SLO

### 8.1 온라인

| SLI              |              목표 |
| ---------------- | ----------------: |
| 검색 API 가용성  |      99.9% / 28일 |
| 검색 서버 p95    |        400ms 이하 |
| 자동완성 p95     |        150ms 이하 |
| branch 변경→색인 |      p99 2분 이하 |
| 색인 이벤트 손실 | 0 목표, 일일 대조 |

### 8.2 품질

운영 SLO와 별도 품질 목표:

- 판단 세트 NDCG/MRR의 승인 기준
- 결과 없음 비율의 정상 범위
- 폐업·이전 오노출 표본
- 지역·장르 coverage
- 광고/자연 구분 100%

검색이 빠르더라도 품질 회귀 gate를 실패하면 모델 배포를 중단한다.

### 8.3 검색 좋은 이벤트

다음은 나쁜 이벤트다.

- 5xx/timeout
- query는 유효하지만 내부 장애로 빈 결과
- response schema 오류
- 요청한 지도 경계와 다른 결과 집합
- 광고 placement를 자연 결과로 표시

정상적으로 결과가 없는 쿼리는 가용성 실패가 아니다.

---

## 9. 리뷰 쓰기 SLO

| SLI                   |         목표 |
| --------------------- | -----------: |
| 초안 저장 성공        |        99.9% |
| 게시 명령 성공        |        99.9% |
| 초안 저장 p95         |   500ms 이하 |
| 게시 접수 p95         |     1초 이하 |
| 게시 이벤트→공개 반영 | p99 2분 이하 |

사용자 정책 오류 422는 가용성 실패가 아니지만 잘못된 정책 판단이나 모호한 오류율은 제품 품질 지표로 본다.

불변식:

- 같은 멱등키 게시로 리뷰 중복 없음
- revision 손실 없음
- 공개 상태와 score eligibility 분리
- 증빙 원문이 공개 응답·로그에 없음

---

## 10. 평점 SLO

평점은 요청 가용성보다 발행 정확성이 중요하다.

| SLI                       |                   목표 |
| ------------------------- | ---------------------: |
| 예정 계산 완료            |             99.5% 회차 |
| 승인된 snapshot 발행      | 목표 시각 + 2시간 이내 |
| 발행 결과 재현            |                   100% |
| partial branch missing    |                 0 목표 |
| 모델·입력 없는 공개 score |                 0 목표 |

기능 저하:

- 계산 실패 시 마지막 승인 score 유지
- 일부 지점만 새 버전으로 섞어 발행하지 않음
- 잘못된 score 발견 시 발행 freeze와 이전 snapshot 복구

---

## 11. 점주 SLO

| SLI                          |                                  목표 |
| ---------------------------- | ------------------------------------: |
| 점주 핵심 조회 가용성        |                                 99.9% |
| 정보 저장 p95                |                            700ms 이하 |
| low-risk 공식 정보 공개 반영 |                          p99 2분 이하 |
| 권한 해제 효력               |                          p99 1분 이하 |
| 분석 최신성                  | 정상 시 24시간 이내, 실시간 항목 별도 |

예약대장은 Booking SLO를 따른다.

점주 제출이 운영 검토 중인 시간은 API 가용성 실패가 아니지만 처리 SLA와 backlog 지표에 포함한다.

---

## 12. 예약 SLO

### 12.1 가용성과 latency

| SLI                   |                                   목표 |
| --------------------- | -------------------------------------: |
| 가용성 조회 성공      |                          99.95% / 28일 |
| 예약 쓰기 성공        |                          99.95% / 28일 |
| 가용성 p95            |                             500ms 이하 |
| 예약 명령 서버 p95    | 1.5초 이하, 외부 사용자 인증 대기 제외 |
| 상태 이벤트→점주 보드 |                          p99 30초 이하 |

### 12.2 불변식

```text
overlapping active allocation = 0
confirmed reservation without allocation where required = 0
consumed hold linked to one reservation
same idempotency key linked to one canonical response
status history version monotonic
```

### 12.3 요청형 운영 SLI

- 점주 승인 요청 알림 생성 p99 1분
- 응답 기한 전 에스컬레이션 성공
- 기한 만료 자동 상태 전환
- 점주 응답시간 percentile

### 12.4 기능 저하

예약 정확성을 확신할 수 없으면 신규 확정을 닫는다.

- 음식점 상세 유지
- 마지막 가용성을 판매 가능으로 캐시 표시하지 않음
- 전화/외부 링크는 유효성과 책임 주체를 분리 표시
- 기존 예약 조회는 원장에서 제공
- 점주에게 기능 저하와 지원 경로 표시

---

## 13. 결제·환불 SLO

| SLI                        |                   목표 |
| -------------------------- | ---------------------: |
| 결제 명령 접수 가용성      |                 99.95% |
| webhook 유효 이벤트 처리   |                p99 1분 |
| 결제 성공-예약 불일치 탐지 |               5분 이내 |
| 환불 요청 공급자 제출      | p99 15분, 자동 가능 건 |
| 장기 unknown 조정 시작     |    정책 임계치 내 100% |

불변식:

```text
duplicate captured payment = 0
refund total > captured total = 0
provider movement duplicate accounting = 0
payment token in logs = 0
```

공급자 처리 시간은 사용자에게 별도 기대값으로 표시한다. 내부 SLO와 법적·계약상 환불 기한을 혼동하지 않는다.

---

## 14. 알림 SLO

| 유형           | intent 생성 |     공급자 접수 |          최종 추적 |
| -------------- | ----------: | --------------: | -----------------: |
| 보안           |     p99 1분 | 생성 후 p99 1분 |        5분 내 상태 |
| 예약 확정·취소 |     p99 1분 | 생성 후 p99 1분 |        5분 내 상태 |
| 점주 승인      |     p99 1분 | 생성 후 p99 1분 | 기한 전 escalation |
| 활동           |    p99 15분 |       일정 기준 |        best effort |
| 마케팅         | 캠페인 일정 |       속도 제한 |          보고 주기 |

사용자 실제 전달을 알 수 없는 채널은 provider accepted, delivered receipt, open을 각각 표시한다.

불변식:

- 취소 후 오래된 확정 알림 억제
- 철회된 마케팅 대상 발송 0
- 비프로덕션 allowlist 외 발송 0
- 퇴사 구성원 거래 알림 0

---

## 15. 데이터 수집·원장 SLO

### 15.1 출처별

각 source에 기대 주기를 둔다.

```text
scheduled snapshot completion
source freshness lag
schema drift detection
quarantine rate
records processed
```

### 15.2 공개 품질

- 핵심 필드 coverage
- 중복 branch 표본
- 폐업 반영 시간
- 사용자 수정 제보 SLA
- assertion conflict backlog
- 매칭 false merge 표본

### 15.3 대량 오염 방지

한 source run에서 다음이 임계치를 넘으면 자동 공개 반영을 중지한다.

- branch close/reopen 변화
- 좌표 대규모 이동
- record count 하락
- category 대량 변경
- 자동 link/merge 비율 변화

---

## 16. 개인정보 작업 SLO

법적 기한은 최신 법률 검토로 별도 관리하며 내부 목표는 그보다 여유 있게 설정한다.

측정:

- 요청 접수→신원 확인
- 시스템 발견 완전성
- 내보내기 생성
- 삭제·정정 실행
- processor 전파
- 검증 완료
- 법적 보존 예외 설명

불변식:

- 만료 export URL 접근 불가
- 다른 사용자의 데이터 포함 0
- 삭제 tombstone 복원 후 재적용
- 처리 로그에 요청 데이터 원문 복제 없음

---

## 17. 오류 예산 정책

### 17.1 계산

99.9% 요청 성공 SLO는 28일 동안 유효 요청의 0.1%를 오류 예산으로 가진다. 시간 기반 가용성으로 단순 환산하지 않고 요청 기반과 중요 시간대 영향을 함께 본다.

### 17.2 burn rate 경보

다중 창 경보 예:

| 심각도      |       짧은 창 |      긴 창 | 의미        |
| ----------- | ------------: | ---------: | ----------- |
| Page        | 5분 높은 burn | 1시간 확인 | 예산 급소진 |
| Page/Ticket |          30분 |      6시간 | 지속적 문제 |
| Ticket      |         6시간 |        3일 | 느린 회귀   |

정확한 배수는 트래픽과 SLO로 계산해 관측 도구에 구현한다.

### 17.3 예산 소진 대응

```text
<25%: 정상 개발
25~50%: 반복 원인 분석
50~75%: 위험 변경 강화, 신뢰성 작업 우선
75~100%: 해당 서비스 비필수 출시 제한
>100%: 신뢰성 회복 계획과 리더 승인 전 고위험 출시 중지
```

보안 패치와 피해 완화는 출시 제한의 예외다.

### 17.4 예산 면제 금지

공급자 장애, 트래픽 급증, 특정 앱 버전을 편의상 제외하지 않는다. 사용자 약속 밖의 명시된 트래픽만 사전에 제외한다.

---

## 18. 경보 원칙

### 18.1 페이지 조건

페이지는 즉시 사람이 행동해야 하고 행동 방법이 있을 때만 보낸다.

좋은 page:

- 예약 중복 allocation 탐지
- 이중 결제 후보
- 인증 전체 실패
- 검색 오류 예산 급소진
- 데이터 침해 신호

나쁜 page:

- CPU 80% 하나
- 단일 실패 로그
- 조치할 runbook 없는 예측
- 이미 자동 복구됐고 영향 없는 순간 spike

### 18.2 경보 필수 정보

```text
service and environment
user impact
SLI/burn or invariant
start time
scope/region/version
dashboard
runbook
recent deploy/config
acknowledgement/incident link
```

### 18.3 개인정보

경보 메시지에 전화, 이메일, 리뷰 원문, 예약 요청사항, 결제 토큰을 넣지 않는다. 불투명 ID와 제한 사건 링크를 사용한다.

### 18.4 경보 품질

- 실제 조치로 이어진 비율
- 중복 page
- false positive
- missed incident
- 야간 page 분포
- acknowledgment time
- runbook 유용성

---

## 19. 공통 런북 템플릿

```text
제목·서비스·owner
증상과 사용자 영향
자동 경보/수동 신고
전제 권한과 안전 주의
즉시 확인할 dashboard/query
최근 변경 확인
피해 확산 차단
진단 순서
복구 선택지
데이터 불변식 검증
사용자·점주 공지 기준
에스컬레이션
복구 완료 기준
사후 작업
마지막 훈련일·문서 owner
```

런북은 명령을 복사해 실행하기 전에 environment·대상을 확인하도록 명시한다. 폭넓은 삭제·재시작 명령을 기본 대응으로 두지 않는다.

---

## 20. Runbook — API 오류율 급증

### 증상

- 5xx/timeout burn rate 경보
- 여러 도메인 요청 실패

### 즉시 확인

1. 영향 route, region, app version, deployment를 확인한다.
2. DB, Redis, OpenSearch, queue, provider 중 공통 의존성을 본다.
3. 최근 deploy, migration, config, secret rotation을 확인한다.
4. 오류 샘플에 개인정보가 없는 안전한 trace를 연다.

### 완화

- 특정 route/feature flag 차단
- 최근 배포 rollback 또는 forward fix
- 과부하 비핵심 traffic 제한
- 읽기 cache/fallback 활성
- 의존성 timeout·circuit 설정의 승인된 변경

### 금지

- 원인 모른 채 모든 캐시 삭제
- DB connection을 무제한 확대
- 예약 처리 중 인스턴스 강제 종료 반복

### 완료

- burn rate 정상
- 핵심 synthetic 성공
- outbox/queue backlog 수렴
- 예약·결제 불변식 확인

---

## 21. Runbook — PostgreSQL 장애·포화

### 증상

- connection pool 고갈
- lock/deadlock 급증
- replica lag
- failover
- storage/CPU 포화

### 즉시 확인

1. write/read 어느 경로인지 구분한다.
2. active query, lock wait, connection owner를 본다.
3. migration/backfill/analytics query를 확인한다.
4. 예약·결제 트랜잭션 영향을 확인한다.

### 완화 우선순위

- 비핵심 backfill·분석 중지
- 과도한 route rate limit
- read traffic의 안전한 cache/replica 전환
- 문제 query/배포 제한
- 관리형 failover 절차

### 검증

- write 성공과 replication
- outbox 단조성
- 예약 allocation overlap
- 결제 movement
- failover 중 응답 unknown 조정

DB가 복구됐다는 지표만으로 종료하지 않는다.

---

## 22. Runbook — Redis 장애

### 영향

- cache miss 증가
- rate limit/session 보조 기능
- queue 구성에 따라 작업 지연
- reservation slot 보조 cache

### 원칙

Redis는 예약·권한의 최종 진실이 아니다.

### 완화

- cache bypass와 DB 보호 rate limit
- 비핵심 추천·활동 기능 제한
- queue persistence/복구 확인
- 예약 availability latency 상승 표시 또는 제한

### 검증

- DB 재고 정확성
- 세션 보안 정책
- queue job 중복의 멱등 처리
- 복구 후 stale cache가 최신 값을 덮지 않음

---

## 23. Runbook — OpenSearch 장애

### 영향

- 검색·자동완성·지도 결과
- 음식점 상세 원장과 예약은 유지 가능

### 완화

- 복잡 필터와 자동완성 제한
- 승인된 인기/근처 fallback, 최신성 표시
- 직접 branch URL·저장 목록·예약 내역 유지
- 신규 색인 이벤트 outbox 보존

### 복구

1. cluster health, rejection, disk, heap, shard를 확인한다.
2. 최근 mapping/analyzer/reindex를 본다.
3. write alias와 read alias를 확인한다.
4. 필요하면 이전 정상 index alias로 전환한다.
5. 누락 이벤트 재생 또는 전체 재색인한다.

### 완료

- 판단 smoke query
- closed branch 정책
- index version 대조
- outbox lag 수렴
- alias 단일성

---

## 24. Runbook — 검색 품질 급락

### 신호

- zero result 급증
- 상세 전환 급락
- 특정 지역 결과 소실
- 폐업 지점 상위 노출
- 자동완성 이상

### 진단

- query class/locale/app version
- source data vs index vs ranking
- analyzer/synonym/model change
- 광고 placement 변화
- data source 대량 상태 변경

### 완화

- 이전 ranking config/index alias
- 문제 synonym 비활성
- 특정 source assertion 반영 중지
- 품질 낮은 필터 임시 제한

### 검증

golden query diff와 실제 대표 쿼리를 함께 확인한다.

---

## 25. Runbook — 음식점 데이터 대량 오염

### 예

- 수천 지점 폐업 처리
- 좌표가 한 지점으로 이동
- 카테고리 소실
- 잘못된 자동 병합

### 즉시

1. source·job·model version을 식별한다.
2. 해당 source 반영과 downstream 색인을 중지한다.
3. 영향 assertion/branch/search 문서 수를 계산한다.
4. 신규 예약·claim 영향이 있으면 별도 사건을 연다.

### 복구

- 원본 삭제가 아니라 잘못된 assertion/decision을 supersede/reverse
- 이전 canonical snapshot 또는 선택 규칙으로 재계산
- 검색 재색인
- 병합이면 분리 계획 사용

### 완료

- 표본·불변식
- 리뷰/예약/권한 관계
- 사용자 제보 영향
- source 재개 조건

---

## 26. Runbook — 평점 발행 이상

### 신호

- 점수 분포 급변
- 많은 branch 점수 누락
- 모델 버전 혼합
- 특정 장르·지역 비정상 이동

### 즉시

- 신규 발행 중지
- 현재 공개 snapshot 고정
- input cutoff/model/config hash 확인
- 광고·계약 필드 입력 여부 검사

### 복구

- 이전 승인 snapshot 유지/재활성
- 실패 batch 재계산
- contribution diff
- 승인 후 원자적 발행

### 완료

- 전체 branch coverage
- golden portfolio
- 모델·입력 재현
- 검색 ranking cache/index 갱신

점수 오류를 개별 DB 수동 수정으로 해결하지 않는다.

---

## 27. Runbook — 예약 중복 배정

### 등급

한 건이라도 Q0/P0 후보로 취급하고 범위를 확인한다.

### 즉시

1. 영향 branch/resource/time을 식별한다.
2. 해당 지점·구간 신규 확정을 차단한다.
3. allocation·status history·idempotency·외부 channel을 보존한다.
4. Booking Ops와 지점 담당자를 호출한다.
5. 임박한 사용자 영향 순서로 대응한다.

### 복구

- 사용 가능한 자원·시간 대안 확인
- 양측 동의 없는 임의 변경 금지
- 점주 귀책 취소·환불 처리
- 외부 채널 conflict 조정

### 기술 진단

- DB exclusion/conditional update
- transaction isolation
- hold expiry race
- resource combination
- manual/external booking path
- migration/backfill

### 완료

- 전체 영향 예약 처리
- overlap 0 재검산
- 문제 경로 차단/수정
- 동시성 회귀 테스트
- 사용자·점주 후속 통지

---

## 28. Runbook — 결제 성공, 예약 없음

### 신호

reconciliation이 성공 payment intent/charge에 대응하는 requested/confirmed reservation을 찾지 못함.

### 즉시

1. provider reference와 내부 intent를 중복 없이 조회한다.
2. 새 결제 재시도를 사용자에게 유도하지 않는다.
3. hold·재고·예약 commit trace를 확인한다.
4. 예약을 안전하게 확정할 수 있는지 현재 재고를 원자 검사한다.

### 분기

- 재고와 정책이 유효: 승인된 보상 명령으로 예약 생성/연결
- 불가능: 환불 의무 생성, 사용자 통지
- 공급자 상태 불명: 조회·조정 계속, 추측 금지

### 완료

- 모든 성공 금액이 예약 또는 환불과 연결
- 사용자에게 현재 상태 전달
- 공급자·내부 원장 일치
- 재발 방지 테스트

---

## 29. Runbook — 결제 이중 청구

### 즉시

- 영향 결제수단 원문 없이 provider/internal reference로 범위 식별
- 문제 endpoint/partner 경로 중지
- 추가 capture 차단
- Payment Ops/Security/Incident Commander 호출

### 처리

- 실제 capture인지 authorization 표시 중복인지 구분
- canonical 결제와 중복 movement 결정
- 승인된 환불
- 사용자 통지와 예상 시간
- 정산 파일까지 추적

### 완료

- 중복 금액 환불·정산 확인
- idempotency/provider key 원인 수정
- 전체 기간 재조정

---

## 30. Runbook — 알림 지연·실패

### 즉시

- category, channel, provider, queue age, template version 확인
- 예약·보안 intent를 우선 분리
- 앱 inbox와 도메인 상태 조회 정상 여부 확인

### 완화

- 보조 provider 또는 허용 channel
- 점주 console task와 operations case
- 만료된 활동·reminder 억제
- 마케팅 캠페인 중지

### 복구

과거 큐를 무조건 drain하지 않는다. 각 intent의 현재 자격·aggregate version·expiresAt을 재평가한다.

### 완료

- critical backlog 0
- 오래된 상태 발송 0
- duplicate rate 정상
- consent suppression 검산

---

## 31. Runbook — 인증 장애·계정 탈취

### 인증 장애

- 로그인 provider, token signing/validation, DB, Redis 범위 구분
- 기존 세션과 신규 로그인 영향 분리
- 보안 약화 fallback 금지
- 점주·운영자 고위험 작업 필요 시 일시 중지

### 계정 탈취

- 의심 세션 폐기
- 민감 변경 잠금
- 연락처·owner·billing 변경 이력
- 사용자 안전한 복구
- 점주 claim/예약 데이터 영향
- Security/Privacy 사건

복구를 위해 공격자가 이미 바꾼 이메일 하나만 신뢰하지 않는다.

---

## 32. Runbook — 개인정보 노출

### 즉시

1. Security/Privacy incident 선언
2. 노출 경로 차단
3. 로그·객체·캐시 등 증거 보존
4. 데이터 유형·대상·기간·접근자를 범위화
5. 추가 유출 방지와 자격증명 회전

### 주의

- 증거를 일반 채팅·티켓에 복사하지 않는다.
- 성급한 삭제로 조사 증거를 없애지 않는다.
- 통지 의무는 현재 법률·계약과 전문가 검토에 따라 처리한다.

### 완료

- 노출 차단
- 영향 범위 검증
- 통지·지원 결정
- 데이터 삭제/회수 가능 범위
- 근본 원인과 통제 개선

---

## 33. Runbook — 큐·outbox 적체

### 진단

- producer 증가 vs consumer 저하
- poison event
- schema version
- downstream 장애
- partition/hot key
- retry storm

### 완화

- 비핵심 consumer 중지
- poison event 격리
- 처리량의 안전한 확장
- downstream rate limit 존중
- DLQ와 checkpoint

### 복구

- aggregate version/idempotency 검증
- 예약·결제·알림 우선순위
- backlog age별 만료 정책
- 재처리 후 원장 대조

큐를 비워 보이게 하기 위해 메시지를 삭제하지 않는다.

---

## 34. Runbook — 미디어 처리 장애

### 유지

- 리뷰 text draft/게시 정책 범위
- 음식점 검색·상세의 기존 이미지

### 제한

- 신규 이미지 상태 `processing`
- 검사 전 공개 금지
- 점주·사용자에게 지연 표시

### 진단

- object storage
- malware/format scanner
- resize worker
- CDN purge
- malformed file spike

복구 후 원본 해시로 멱등 처리하고 중복 asset을 만들지 않는다.

---

## 35. Runbook — 분석 데이터 지연·오류

### 원칙

분석 오류가 거래 원장을 변경하지 않는다.

### 즉시

- 잘못된 dashboard에 `degraded/provisional` 표시
- 자동 의사결정·점주 export 중지 여부
- source event vs transform vs semantic definition 구분

### 복구

- eventId 중복 제거
- watermark 재설정의 영향 검토
- backfill
- 원장 reconciliation
- 지표 버전·annotation

잘못된 0을 확정값으로 점주에게 제공하지 않는다.

---

## 36. 재해 복구

### 36.1 RPO/RTO 후보

실제 구조·비용 시험 후 확정한다.

| 계층           | RPO 방향    | RTO 방향         |
| -------------- | ----------- | ---------------- |
| 예약·결제·권한 | 거의 0      | 최우선           |
| 리뷰·원장      | 낮음        | 우선             |
| 검색 색인      | 재생성 가능 | 수시간 범위 가능 |
| 분석           | 재처리 가능 | 후순위           |

### 36.2 복구 순서

1. 계정·권한과 비밀
2. PostgreSQL 원장
3. 예약·결제 조정
4. outbox/queue
5. API 핵심 읽기
6. 검색 재색인
7. 미디어
8. 분석

### 36.3 복원 검증

- backup checksum만이 아니라 실제 restore
- schema/migration 호환
- 사용자 synthetic journey
- 예약·결제 불변식
- 삭제 tombstone 재적용
- 검색·분석 재생성

---

## 37. 상태 페이지·커뮤니케이션

### 37.1 외부 컴포넌트

```text
로그인
검색·지도
음식점 상세·리뷰
점주 서비스
예약
결제·환불
알림
```

내부 공급자명이나 보안 세부는 공개하지 않는다.

### 37.2 업데이트

- 확인 중
- 원인 범주·영향
- 완화 적용
- 복구 모니터링
- 해결
- 사후 설명 예정

확실하지 않은 복구 시각을 약속하지 않는다. 다음 업데이트 시각을 제공한다.

### 37.3 점주·예약 사용자

일반 상태 페이지 외에 실제 예약 영향 대상에게 거래 채널로 별도 통지할 수 있다. 장애 공지를 마케팅 캠페인과 섞지 않는다.

---

## 38. 장애 종료 기준

다음을 모두 확인한다.

- 사용자 SLI 정상화
- 오류 예산 burn 정상
- 핵심 synthetic journey
- backlog 수렴 또는 통제된 계획
- 예약·결제·권한·점수 불변식
- 데이터 손실·개인정보 영향 확인
- feature flag/fallback 상태 기록
- 운영자·사용자 후속 사건 owner
- 모니터링 기간 지정

그래프가 잠시 내려갔다는 이유만으로 종료하지 않는다.

---

## 39. 사후 검토

SEV-0/1과 반복 SEV-2는 사후 검토를 한다.

```text
executive summary
user/merchant/data/financial impact
detection and response timeline
root cause and contributing factors
what limited impact
what increased impact
communication
corrective actions: immediate/mid/structural
owners and due dates
regression tests/alerts/runbook changes
```

후속 작업은 일반 backlog에 묻히지 않고 완료 증거를 추적한다.

---

## 40. 런북 유지관리

- owner와 백업 owner
- 분기별 검토
- 마지막 실제 사용·훈련일
- 필요한 권한과 도구 링크
- 명령·화면의 현재성
- 이전 사고 학습
- 자동화 가능 단계

사용하지 않은 런북도 정기 tabletop/game day로 검증한다.

---

## 41. 구현 순서

### S0. 기반

1. service catalog
2. request/trace IDs
3. structured metrics/logs/traces
4. 공통 SLI 계산
5. dashboard/alert routing
6. incident template

### S1. Foundation

1. API·DB·search SLO
2. ingestion freshness/quality
3. outbox lag
4. 검색·데이터 오염 runbook
5. restore exercise

### S2. Trust

1. review write/read
2. moderation backlog
3. rating publish
4. media
5. 점수 이상 runbook

### S3. Booking

1. reservation availability/write
2. allocation invariant monitor
3. payment reconciliation
4. notification critical delivery
5. 24/7 escalation

### S4. Maturity

1. error budget governance
2. multi-window burn alerts
3. game days
4. capacity forecast
5. external status/history

---

## 42. 출시 체크리스트

- [ ] 서비스별 owner, SLI, dashboard, alert, runbook이 연결된다.
- [ ] 사용자 여정 SLI와 인프라 진단 지표가 구분된다.
- [ ] 유효 요청 분모와 제외 기준이 정의된다.
- [ ] Q0 불변식에 실시간 또는 주기 탐지가 있다.
- [ ] 예약·결제·권한·평점 장애는 안전한 기능 저하를 갖는다.
- [ ] page 경보에 즉시 행동 가능한 runbook이 있다.
- [ ] 경보와 로그에 개인정보가 없다.
- [ ] 오류 예산 소진 시 출시 정책이 합의된다.
- [ ] 검색·분석·알림 backlog 복구가 현재 상태를 재검증한다.
- [ ] 복구 종료 전에 원장 불변식을 확인한다.
- [ ] 백업이 실제 복원 시험을 통과한다.
- [ ] 장애 외부·내부 커뮤니케이션 owner가 있다.
- [ ] 런북을 tabletop 또는 game day로 훈련했다.

---

## 43. 미결정 사항

- 서비스별 최종 SLO와 유료 고객 SLA
- 온콜 시간과 1·2차 교대 구성
- 관측성 공급자와 보존기간
- burn rate 구체 배수와 paging threshold
- status page 공급자
- 국내/해외 region 확장 시 SLO 분리
- 점주 분석 데이터 최신성 상품 약속
- 자동 incident 생성·지휘 도구
- 리전 장애의 목표 RPO/RTO와 비용
- 프로덕션 chaos 허용 범위

---

## 44. 연관 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)
- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [RATING_SYSTEM.md](../features/RATING_SYSTEM.md)
- [OWNER_PLATFORM.md](../features/OWNER_PLATFORM.md)
- [RESERVATION_SYSTEM.md](../features/RESERVATION_SYSTEM.md)
- [NOTIFICATION_SYSTEM.md](../features/NOTIFICATION_SYSTEM.md)
- [OPERATIONS.md](./OPERATIONS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [ANALYTICS.md](../product/ANALYTICS.md)
