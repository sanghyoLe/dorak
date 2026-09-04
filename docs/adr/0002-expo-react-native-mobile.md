# ADR-002: Expo 기반 React Native 모바일 앱

- 상태: Accepted
- 결정일: 2026-09-02
- owner: Mobile
- 검토자: Product, Design, Platform

## 맥락

도락 앱은 iOS와 Android에서 검색, 지도, 위치 권한, 카메라·사진, 푸시, 딥링크, 예약을 제공해야 한다. 초기 팀은 두 개의 완전한 네이티브 코드베이스를 별도로 운영하기 어렵다.

## 결정 기준

- iOS/Android 동시 개발 속도
- 지도·위치·미디어·푸시 지원
- OTA와 스토어 배포 통제
- 네이티브 모듈 확장 가능성
- 웹·API TypeScript 계약 재사용
- 성능과 접근성

## 결정

TypeScript 기반 React Native와 Expo를 채택한다. Expo Router, EAS Build/Update 사용 여부는 구현 시 세부 승인하되 Expo managed tooling을 기본으로 한다.

Expo를 네이티브 코드가 없는 제약으로 이해하지 않는다. 필요한 경우 development build와 config plugin, 제한된 native module을 사용한다.

## 대안

### Swift + Kotlin

최고 수준의 플랫폼 제어를 제공하지만 초기 인력·기능 동기화 비용이 높다.

### Flutter

일관된 렌더링과 성능이 강점이나 팀의 React/TypeScript 재사용과 웹 생태계 연계가 낮다.

### 모바일 웹/PWA만

초기 검증에는 사용하지만 지도·위치·푸시·저장 경험과 앱 배포 요구를 최종적으로 충분히 충족하지 못할 가능성이 높다.

## 긍정적 결과

- 하나의 주요 코드베이스로 두 플랫폼 지원
- React·TypeScript 역량 공유
- 권한·빌드·업데이트 도구 단순화
- 공용 API 타입·디자인 토큰 재사용

## 부정적 결과

- 특정 네이티브 SDK의 Expo/React Native 호환성 위험
- 지도·긴 목록·이미지의 성능 최적화 필요
- React Native/Expo upgrade cadence 의존
- OTA로 바꿀 수 있는 코드와 스토어 심사가 필요한 변경을 구분해야 함

## 통제

- 지도·결제·인증 SDK를 spike로 검증
- 지원 기기 성능 예산
- 실제 iOS/Android 접근성 테스트
- native module 최소화와 owner 지정
- OTA update compatibility/runtime version 정책
- 앱 버전별 API 호환 테스트

## 검증

- 검색→지도→상세→저장 수직 슬라이스
- 카메라·사진·위치 권한 거부/허용
- 딥링크와 알림
- 저사양 Android와 구형 지원 iPhone 성능
- 화면 읽기와 큰 글자

## 재검토 조건

- 핵심 지도·AR·백그라운드 기능이 반복적으로 framework 제약에 막힌다.
- 성능 목표가 현실적 최적화 후에도 충족되지 않는다.
- 네이티브 팀을 별도로 운영할 조직·제품 필요가 생긴다.

## 되돌리기 비용

완전 네이티브로 전환하면 UI·navigation·상태·테스트를 재작성해야 해 높다. 도메인 계약과 서버 상태를 앱 밖에 유지해 비용을 낮춘다.

## 관련 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)

