# ADR-016: Production account 격리와 immutable artifact 승격

- 상태: Superseded by ADR-017
- 결정일: 2026-09-02
- owner: Platform/SRE
- 검토자: Security, Backend, Data, Product Operations

> 2026-09-03: [ADR-017](./0017-cost-first-personal-project.md)이 개인 프로젝트 단계의 환경·배포 방식을 대체했다. 개인정보·예약·결제 규모가 커질 때 이 문서의 강한 계정 격리와 artifact 승격 원칙을 다시 검토한다.

## 맥락

도락은 고객 계정, 위치, 리뷰, 예약 연락처, 점주 증빙을 처리한다. development와 production을 같은 AWS account·credential·data store에 두면 실수와 침해의 blast radius가 커진다. 또한 환경마다 코드를 다시 build하면 staging에서 검증한 binary와 production binary가 달라질 수 있다.

## 결정 기준

- 고객 데이터와 권한 격리
- 배포 artifact 동일성
- 감사·승인 가능성
- 롤백 속도
- 초기 비용과 운영 복잡도
- AWS 서울 리전 가용성

## 결정

1. Production workload와 데이터는 non-production과 별도 AWS account에 둔다.
2. AWS Organizations 안에서 production/non-production OU와 control을 분리한다.
3. 초기 runtime은 서울 리전 단일 region, stateless workload와 production DB/search는 다중 AZ로 구성한다.
4. commit에서 한 번 만든 immutable image/artifact digest를 development → staging → production으로 승격한다.
5. GitHub Actions는 장기 AWS key 대신 OIDC와 환경별 단기 role을 사용한다.
6. production migration은 API startup이 아니라 승인된 one-off task로 실행한다.
7. ECS rolling deployment circuit breaker를 기본 후보로 하고 고위험 service는 blue/green/canary를 사용한다.
8. database rollback보다 expand/migrate/contract와 application rollback·forward fix를 우선한다.

## 대안

### 하나의 AWS account에서 environment tag만 분리

저렴하고 단순하지만 IAM·quota·데이터·실수의 강한 격리 경계를 잃는다.

### 환경마다 artifact rebuild

환경별 build-time config는 쉽지만 staging에서 검증한 artifact와 production artifact의 동일성을 증명하기 어렵다.

### Multi-region active-active를 즉시 구축

region 장애 대응은 강하지만 쓰기 충돌, 예약 재고, 개인정보 이전, 비용·운영 복잡도가 초기 요구보다 크다.

### API task startup migration

자동화는 간단하지만 다중 task 경쟁, DDL 권한 확대, 장시간 lock, rollback 순서가 위험하다.

### 장기 AWS access key를 CI secret으로 저장

초기 설정은 쉽지만 credential 수명·유출·rotation 위험이 커 OIDC 단기 신원을 선택한다.

## 긍정적 결과

- production 데이터·권한·quota가 non-production 사고에서 격리된다.
- 검증한 동일 digest가 production에 배포된다.
- 환경별 deploy role과 승인을 감사할 수 있다.
- app rollback과 DB 호환성 경계가 명확하다.
- 단일 리전 운영 복잡도를 유지하며 AZ 장애를 완화한다.

## 부정적 결과

- AWS account, federation, Terraform state, 로그 집계 비용이 늘어난다.
- build-time 환경 설정을 runtime으로 재설계해야 할 수 있다.
- single-region 광역 장애에는 restore 시간이 필요하다.
- staging과 production의 capacity 차이를 test로 보완해야 한다.

## 보안·개인정보·운영 영향

- production DB·bucket·secret에 non-production role 접근 금지
- production OIDC trust를 정확한 repository/environment subject로 제한
- management account에 workload 금지
- 사람은 federation/MFA와 시간 제한 role 사용
- artifact와 deploy manifest에 commit·contract·migration digest 기록
- RDS PITR와 search rebuild를 실제 rehearsal

## 구현과 검증

1. Organizations/account baseline
2. environment별 Terraform state와 deploy role
3. GitHub OIDC trust/permission test
4. immutable ECR digest promotion
5. staging ECS circuit breaker·canary rehearsal
6. one-off migration task와 lock
7. RDS PITR 격리 복원
8. OpenSearch full rebuild·alias 전환
9. production preflight·post-deploy gate

## 재검토 조건

- 측정된 regional outage RTO가 사업 요구를 만족하지 못한다.
- 규제·계약이 별도 data/identity/payment account를 요구한다.
- blue/green 비용이 위험 감소 가치보다 지속적으로 크다.
- GitHub Actions 외 배포 control plane이 필요하다.
- server artifact의 environment-independent build가 framework 제약으로 불가능하다.

## 되돌리기 비용

계정 병합은 데이터·IAM·감사 경계를 약화하므로 사실상 되돌리지 않는다. multi-region 확장은 추가 설계로 가능하다. artifact promotion 방식 변경은 CI/CD 전체와 provenance에 영향을 주므로 중간 이상이다.

## 관련 문서

- [DEPLOYMENT_ENVIRONMENTS.md](../operations/DEPLOYMENT_ENVIRONMENTS.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
- [ADR-009](./0009-aws-seoul-ecs-fargate.md)
