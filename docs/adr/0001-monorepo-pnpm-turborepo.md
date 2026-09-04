# ADR-001: pnpm workspace와 Turborepo 모노레포

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Platform
- 검토자: Web, Mobile, API, Data

## 맥락

도락은 Expo 앱, 공개·점주·운영 Next.js 앱, NestJS API, 공용 OpenAPI 타입, 디자인 토큰, 이벤트 스키마를 함께 개발한다. 초기 팀은 작고 하나의 제품 흐름이 여러 애플리케이션을 동시에 바꿀 가능성이 높다.

저장소를 초기에 분리하면 계약 변경을 여러 PR과 배포 순서로 조정해야 한다. 반대로 경계 없는 모노레포는 모든 앱이 내부 코드를 직접 import해 독립성을 잃을 수 있다.

## 결정 기준

- 공용 계약의 원자적 변경
- 로컬 개발과 CI 속도
- 패키지 경계와 dependency 가시성
- 작은 팀의 운영 부담
- 향후 독립 배포·저장소 분리 가능성

## 결정

pnpm workspace와 Turborepo를 사용한 단일 모노레포를 채택한다.

```text
apps/
packages/
infra/
docs/
```

공용 코드는 명시적 package로만 공유한다. 앱이 다른 앱의 내부 경로를 직접 import하지 못하게 lint와 package export로 제한한다.

## 대안

### npm/yarn workspace

가능하지만 pnpm의 엄격한 dependency 해소와 저장 효율을 선호했다.

### Nx

강력한 graph와 generator를 제공하지만 초기 복잡도·규약이 더 크다. Turborepo와 표준 package 도구로 먼저 시작한다.

### 애플리케이션별 저장소

독립 배포 경계는 명확하지만 초기 계약 변경·CI·버전 조정 부담이 크다.

## 긍정적 결과

- API·이벤트·디자인 토큰을 한 변경에서 검증한다.
- 영향을 받은 package만 빌드·테스트할 수 있다.
- 공통 lint·TypeScript·테스트 설정을 재사용한다.
- 로컬에서 전체 수직 흐름을 실행하기 쉽다.

## 부정적 결과

- CI 캐시·작업 graph 관리가 필요하다.
- 잘못된 공용 package가 결합도를 높일 수 있다.
- 저장소 checkout과 권한이 넓어진다.
- 팀 규모가 커지면 ownership과 merge queue가 병목이 될 수 있다.

## 통제

- CODEOWNERS와 domain package owner
- dependency direction lint
- public package exports
- affected CI + 주기 full CI
- 앱별 deploy pipeline
- 비밀과 환경 설정은 저장소 포함 여부와 무관하게 분리

## 검증

- 새 개발자가 1시간 안에 로컬 핵심 서비스를 실행
- 공용 계약 변경이 consumer build를 CI에서 검증
- 불필요한 전체 재빌드 비율과 CI 시간 측정
- circular dependency 0

## 재검토 조건

- 독립 팀이 서로 다른 접근권과 release cadence를 요구한다.
- 저장소 규모가 CI·도구 신뢰성을 지속적으로 저해한다.
- 법률·보안상 특정 서비스 코드를 격리해야 한다.

## 되돌리기 비용

package를 독립 저장소로 추출하고 versioned contract registry와 release process를 만들어야 한다. 명시적 경계를 지키면 중간 비용, 앱 내부 import가 퍼지면 매우 높은 비용이다.

## 관련 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [MONOREPO_ARCHITECTURE.md](../architecture/MONOREPO_ARCHITECTURE.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
