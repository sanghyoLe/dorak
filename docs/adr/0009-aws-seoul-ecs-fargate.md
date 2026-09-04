# ADR-009: AWS 서울 리전과 ECS/Fargate 배포

- 상태: Superseded by ADR-017
- 결정일: 2026-09-02
- owner: Platform/SRE
- 검토자: Security, Privacy, Backend, Finance

> 2026-09-03: 개인 프로젝트의 월 고정비 0원 목표에 따라 [ADR-017](./0017-cost-first-personal-project.md)이 현재 배포 결정을 대체했다. AWS 구성은 규모 확장 시 다시 비교할 후보안으로만 보존한다.

## 맥락

도락 초기 사용자는 대한민국에 집중되고 API, 검색, 예약의 낮은 지연과 국내 운영이 중요하다. 작은 팀은 Kubernetes cluster 자체 운영보다 관리형 컴퓨팅·DB·객체 저장소를 활용할 필요가 있다.

## 결정 기준

- 서울 사용자 지연
- 데이터 위치·공급자 계약
- 관리형 PostgreSQL/Redis/OpenSearch/객체 저장
- 컨테이너 배포와 autoscaling
- 팀의 운영 역량
- 비용 가시성
- 재해 복구

## 결정

AWS 서울 리전을 주 리전으로 사용하고 주요 컨테이너 workload는 ECS/Fargate에 배포한다.

후보 구성:

```text
VPC private subnets
ALB/CloudFront/WAF
ECS/Fargate API and workers
RDS/Aurora PostgreSQL + PostGIS support 검증
ElastiCache Redis
managed OpenSearch
S3 + CloudFront
KMS/Secrets Manager
CloudWatch + OpenTelemetry export
```

정확한 서비스 SKU와 규모는 Terraform·부하 시험으로 결정한다.

## 대안

### EKS/Kubernetes

생태계와 이식성은 강하지만 초기 cluster 운영·upgrade·보안 비용이 크다.

### 서버리스 함수 중심

burst workload에 유리하지만 장기 실행 worker, 연결, OpenSearch, 예약 latency의 일관된 운영이 복잡해질 수 있다.

### 다른 국내/글로벌 cloud

지도·통신 생태계나 비용 이점이 있을 수 있다. 요구·계약·팀 역량 비교 후 AWS를 선택했으며 공급자 종속을 감수한다.

## 긍정적 결과

- 서울 리전 지연
- 관리형 DB·cache·search·object storage
- 컨테이너 단위 독립 확장
- IAM/KMS/로그 생태계
- Kubernetes 운영 부담 회피

## 부정적 결과

- AWS 서비스·가격 종속
- Fargate cold scale·비용
- 관리형 서비스의 version/extension 제약
- 리전 장애에 대한 별도 복구 설계
- cloud IAM 복잡도

## 통제

- Terraform
- 계정·환경 분리
- private networking과 최소 IAM
- 비용 budget/tag/alerts
- data egress·backup·exit plan
- 서비스 interface adapter
- 실제 restore/game day
- 특정 관리형 기능에 domain logic 종속 금지

## 개인정보·보안

- 개인정보 처리 위치·재위탁자·국외 이전 여부를 현재 계약으로 확인
- KMS key와 민감 저장소 역할 분리
- 운영자 접근은 SSO·감사
- production data를 development에 복제하지 않음
- 로그·backup 보존과 삭제 tombstone

## 검증

- 서울 네트워크 latency
- PostGIS/extension/version 지원
- ECS deploy/rollback/autoscaling
- AZ failure와 DB failover
- backup restore
- 비용 model

## 재검토 조건

- 데이터 위치·법률 요구 변화
- AWS 비용이 사업 모델을 지속적으로 침해
- Kubernetes가 필요한 workload·조직 규모
- 해외 region 또는 active-active 요구

## 되돌리기 비용

Terraform과 컨테이너는 일부 이식 가능하지만 managed DB/search/IAM/CDN 이전은 높다. 정기 export·restore와 provider-neutral domain contract로 낮춘다.

## 관련 문서

- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
