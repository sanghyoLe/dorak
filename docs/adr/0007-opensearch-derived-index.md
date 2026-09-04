# ADR-007: OpenSearch 파생 검색 인덱스

- 상태: Superseded by ADR-017
- 결정일: 2026-09-02
- owner: Discovery
- 검토자: Data Platform, Backend, Operations

> 2026-09-03: [ADR-017](./0017-cost-first-personal-project.md)에 따라 현재 검색은 PostgreSQL FTS, `pg_trgm`, PostGIS로 구현한다. OpenSearch 설계는 도입 문턱을 넘겼을 때의 확장 참고안이다.

## 맥락

도락 검색은 한글 형태소, 초성·오탈자, 상호·메뉴·장르·지역 가중치, geo filter, 자동완성, facet, function score가 필요하다. PostgreSQL만으로 초기 exact/nearby 검색은 가능하지만 전국 규모의 검색 품질 실험과 운영에는 전용 엔진이 유리하다.

## 결정 기준

- 한글 분석기
- 텍스트+geo+filter
- 관련도 설명·실험
- facet·자동완성
- 독립 확장
- 파생·재색인 운영

## 결정

OpenSearch를 branch 검색의 파생 read model로 사용한다. PostgreSQL이 원장이며 OpenSearch에서 원장 데이터를 직접 변경하지 않는다.

```text
PostgreSQL canonical change
 -> transactional outbox
 -> indexer
 -> versioned index
 -> alias switch
```

## 대안

### PostgreSQL FTS + pg_trgm + PostGIS

Foundation spike와 fallback에는 유용하다. 전국 한글 analyzer·facet·ranking 실험 요구가 커지면 복잡해진다.

### Elasticsearch

유사 기능을 제공한다. 라이선스·관리형 서비스·팀 선택을 고려해 OpenSearch를 선택했다.

### SaaS search

운영 단순성이 높지만 데이터 위치·비용·한글/랭킹 제어·종속성을 검토해야 한다.

## 긍정적 결과

- Nori 기반 한글 분석
- geo query와 filter/facet
- 랭킹 function과 explain
- alias 기반 재색인
- API DB 읽기 부하 격리

## 부정적 결과

- 별도 cluster 비용·운영
- 최종 일관성과 index lag
- mapping/analyzer 변경 시 재색인
- 원장과 불일치 가능성

## 통제

- aggregate version으로 stale event 거부
- index version·alias
- 정기 원장 대조
- DLQ/replay
- 전체 재생성
- 검색 장애 degraded mode
- 검색 문서에 비공개 필드 금지

## 검증

- 한국어 judgment set
- 예상 지점 수와 query load
- 재색인 중 무중단 alias switch
- indexer 중복·역순
- cluster 장애 fallback

## 재검토 조건

- 초기 규모에서 운영비가 검색 가치보다 크다.
- 관리형 서비스나 PostgreSQL만으로 요구를 더 단순하게 충족한다.
- semantic/vector 요구가 검증되어 엔진 비교가 필요하다.

## 되돌리기 비용

검색 문서·query DSL 종속이 있어 중간~높음이다. 내부 Search API와 canonical field 모델로 격리한다.

## 관련 문서

- [SEARCH_SYSTEM.md](../features/SEARCH_SYSTEM.md)
- [DATA_INGESTION.md](../architecture/DATA_INGESTION.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
