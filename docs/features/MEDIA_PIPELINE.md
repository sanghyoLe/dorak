# 도락 이미지·미디어 처리 설계

> 상태: 초안 v0.1  
> 초기 범위: 음식점·리뷰·메뉴·프로필 이미지, 비공개 영수증·점주 증빙  
> 원칙: 공개 사진과 인증 증빙을 다른 저장·권한·보존 경계로 운영하며 검사 완료 전 공개하지 않는다.  
> 연관 문서: [DATA_MODEL.md](../architecture/DATA_MODEL.md), [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md), [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md), [TECH_STACK.md](../architecture/TECH_STACK.md)

---

## 1. 목적

도락의 미디어 파이프라인은 사용자가 올린 파일을 CDN에 옮기는 기능이 아니다. 비신뢰 파일을 안전하게 처리하고, 출처·권리·개인정보·모더레이션·파생 이미지·삭제를 하나의 생명주기로 관리해야 한다.

목표:

- 악성·손상·과대 파일이 API와 worker를 위협하지 않는다.
- 사진 EXIF의 위치·기기 정보가 의도 없이 공개되지 않는다.
- 리뷰 사진, 점주 공식 사진, 메뉴, 프로필, 영수증, 점주 서류가 역할별로 분리된다.
- 원본·변환본·thumbnail이 한 asset으로 추적된다.
- 중복·도용·스팸·개인정보 노출을 탐지하고 운영자가 복구 가능하게 조치한다.
- 삭제·보존·법적 hold가 객체 저장소, CDN, 검색, 분석에 전파된다.
- 사진 처리 지연이 리뷰 글 초안이나 음식점 검색 전체를 막지 않는다.

---

## 2. 초기 범위와 비범위

### 포함

- JPEG, PNG, HEIC/HEIF 등 승인된 정지 이미지 입력
- review, official, menu, branch, profile 이미지
- receipt evidence와 owner claim evidence
- direct upload, 검사, decode, orientation, metadata 제거
- thumbnail·responsive variant
- moderation과 공개 상태
- CDN delivery
- 삭제·권리 신고

### 초기 비범위

- 사용자 동영상
- 라이브 스트리밍
- 오디오 리뷰
- 360도 공간
- 원본 RAW 파일
- 사용자에게 범용 파일 다운로드 제공

동영상은 트랜스코딩·오디오·자막·저작권·비용이 별도이므로 독립 ADR과 파이프라인이 필요하다.

---

## 3. 미디어 분류

### 3.1 공개 사용자 미디어

```text
review_photo
branch_photo_contribution
menu_photo_contribution
profile_avatar
list_cover
```

### 3.2 공개 점주 미디어

```text
official_logo
official_exterior
official_interior
official_dish
official_menu
official_seat_room
official_accessibility
```

점주 사진은 `공식` 출처로 표시하며 사용자 사진과 권한·moderation actor를 구분한다.

### 3.3 도락 editorial

직원·계약 제작자가 사용 권리를 확인한 이미지. 사용자 리뷰와 혼합 표시하지 않는다.

### 3.4 비공개 증빙

```text
receipt_evidence
visit_evidence
owner_claim_document
identity_or_authority_document
moderation_evidence
payment_dispute_evidence
```

증빙은 공개 asset과 다른 bucket, CDN, key, role, retention을 갖는다.

### 3.5 운영 내부

사건 screenshot 등. 장기 기록이 필요한지와 개인정보를 평가하며 사용자의 공개 콘텐츠로 전환하지 않는다.

---

## 4. 원칙

### 4.1 파일 확장자를 믿지 않는다

MIME header, magic bytes, 실제 decoder 결과, 허용 codec을 검증한다.

### 4.2 원본은 공개하지 않는다

공개 CDN에는 검사·metadata 제거·재인코딩한 variant만 제공한다. 원본은 제한 저장소에 두고 필요에 따라 짧게 보존한다.

### 4.3 upload 완료와 asset 공개는 다르다

```text
uploaded != safe != moderated != published
```

### 4.4 URL이 곧 권한이 아니다

비공개 증빙 URL이 길고 추측 어렵다는 이유로 공개하지 않는다. 인증·권한·짧은 signed URL을 사용한다.

### 4.5 파생본은 재생성 가능하다

variant는 원본 또는 승인된 보존 source와 transformation recipe에서 다시 만들 수 있다. 원본을 조기 삭제한 공개 asset은 보존할 master variant를 명시한다.

### 4.6 콘텐츠 엔터티와 파일을 분리한다

한 asset이 review revision, menu item, branch gallery에 어떤 역할로 연결되는지 `media_link`로 관리한다. 객체 key를 domain foreign key처럼 사용하지 않는다.

---

## 5. architecture

```text
client
 -> create upload session
 -> direct upload to quarantine object storage
 -> complete upload
 -> ingest validator
 -> security/format scan
 -> decode + metadata extraction
 -> normalized master + variants
 -> automated policy signals
 -> moderation when required
 -> asset ready/published
 -> CDN

delete/takedown
 -> link visibility
 -> CDN invalidate/version
 -> search/cache removal
 -> object retention/deletion
```

증빙 pipeline은 `ready` 후에도 public publish 단계가 존재하지 않는다.

---

## 6. 데이터 모델

### 6.1 `media_asset`

```text
id
media_class
purpose
owner_actor_type and id
source_type
source_reference
original_filename_safe
detected_mime
width / height
orientation_applied
byte_size
content_hash
perceptual_hash
capture_time_safe
metadata_status
security_status
moderation_status
publication_status
rights_status
retention_class
created_at / ready_at / published_at / deleted_at
version
```

원본 filename은 표시·로그 전에 제어 문자·경로·개인정보 위험을 처리한다.

### 6.2 `media_object`

```text
id
asset_id
object_role: original_quarantine/master/variant/evidence
storage_class
bucket reference
object_key
content_hash
mime
width / height
byte_size
transformation_recipe_version
encryption_key_ref
created_at / expires_at / deleted_at
```

### 6.3 `media_variant`

개념적으로 `media_object`의 공개 변형 metadata다.

```text
variant_code
format
width/height
fit mode
quality version
cdn path version
```

### 6.4 `media_link`

```text
asset_id
target_type and id
role
sort_order
caption
alt_text
link_status
linked_by
valid_from / valid_to
```

하나의 review revision이 수정될 때 사진 연결 이력도 재현해야 한다.

### 6.5 `media_processing_job`

```text
asset_id
stage
processor_version
attempt
status
safe_error_code
started_at / completed_at
```

### 6.6 `media_rights_record`

```text
asset_id
rights_basis
uploader_attestation_version
license_scope
credit_requirement
valid period
dispute/takedown status
```

### 6.7 `media_moderation_result`

자동 signal과 사람 결정을 분리한다.

```text
asset_id
model/rule version
signal codes
confidence
human case/decision refs
effective action
```

---

## 7. 상태 머신

### 7.1 asset 처리 상태

```text
created
 -> uploading
 -> uploaded
 -> validating
 -> scanning
 -> processing
 -> moderation_pending
 -> ready
 -> rejected
 -> quarantined
 -> processing_failed
 -> expired
```

### 7.2 공개 상태

```text
unpublished
pending_parent_publish
published
limited
hidden
removed
deleted
```

처리 상태와 공개 상태를 하나의 enum으로 합치지 않는다.

### 7.3 증빙 상태

```text
active
consumed_for_decision
retention_pending
legal_hold
expired
destroyed
```

### 7.4 권리 상태

```text
declared
verified_if_required
disputed
restricted
expired
withdrawn
```

---

## 8. 업로드 세션

### 8.1 생성

```text
POST /v1/media-upload-sessions
```

요청:

```text
purpose
target draft type/id
declared mime and size
file count
client checksum optional
```

서버가 고정:

```text
allowed content types
max bytes/pixels/count
quarantine object prefix
expiry
owner
required completion fields
```

### 8.2 direct upload

- 짧은 signed PUT/multipart URL
- 단일 object key
- 제한 content length/type 조건
- public ACL 금지
- quarantine bucket/prefix
- server-side encryption
- 다른 asset key overwrite 금지

### 8.3 완료

```text
POST /v1/media-upload-sessions/{id}:complete
```

서버는 객체 존재, owner/session, size, checksum, 만료를 확인하고 asset processing을 시작한다.

### 8.4 멱등성

같은 upload session 완료를 재시도해도 한 asset과 한 processing chain으로 수렴한다.

### 8.5 multipart

초기 정지 이미지에는 단순 upload를 우선한다. 큰 파일/동영상에서 multipart를 사용하면 미완료 part 정리와 비용 정책을 둔다.

---

## 9. 입력 제한

목적별 별도 제한을 둔다.

| 목적 | 파일 수 | 크기·pixel 방향 | 특성 |
|---|---:|---|---|
| 리뷰 | 여러 장 | 모바일 사진 현실적 상한 | 공개 moderation |
| 메뉴 | 여러 장 | OCR 후보 | 공식/사용자 구분 |
| 프로필 | 1 | 작은 상한 | 얼굴·사칭 policy |
| 영수증 | 적은 수 | 글자 판독 가능 | 비공개·짧은 보존 |
| 점주 서류 | 적은 수 | 문서 판독 | 매우 제한 |

정확한 수치는 실제 사진 분포와 비용·UX 시험 후 정한다.

### 9.1 pixel bomb

파일 bytes가 작아도 decode pixel 수가 매우 클 수 있다. width×height, frame count, compression ratio, memory/time budget을 검사한다.

### 9.2 animated image

초기에는 animated GIF/APNG를 정지 첫 frame으로 변환하거나 거절한다. 예기치 않은 animation·CPU 비용을 피한다.

### 9.3 투명도

PNG transparency와 색공간을 표준 배경/format으로 안전하게 변환한다. 로고와 사진의 정책이 다를 수 있다.

---

## 10. 보안 검사

### 10.1 단계

1. object metadata·size
2. magic bytes와 MIME
3. container/codec allowlist
4. 안전한 decoder sandbox
5. pixel/frame/resource budget
6. malware scanning, 필요성·한계 포함
7. metadata parse
8. 재인코딩

### 10.2 격리

- worker는 API와 다른 task/container
- 최소 IAM: quarantine read, output write
- network egress 제한
- CPU/memory/time limit
- 임시 디스크 한도·정리
- decoder library patch
- crash/timeout quarantine

### 10.3 polyglot·확장자

파일명과 Content-Type이 정상이어도 실제 decoder allowlist가 실패하면 거절한다. 원본을 브라우저가 inline 해석하도록 제공하지 않는다.

### 10.4 SVG

사용자 SVG는 script·external reference·parser 위험 때문에 초기 비허용. 도락 자체 icon은 code review된 asset pipeline을 사용한다.

### 10.5 문서 파일

점주 증빙 PDF를 허용한다면 이미지 pipeline과 별도 sandbox·renderer·active content 제거를 설계한다. 초기에는 승인된 정지 이미지로 제한하는 방안을 우선 검토한다.

---

## 11. metadata와 개인정보

### 11.1 제거 대상

- GPS
- 기기 serial/model 필요 이상
- 촬영자·소프트웨어 개인값
- thumbnail 원본
- comment/user fields
- orientation은 적용 후 제거

### 11.2 보존 가능한 최소 정보

- width/height
- 안전한 orientation 결과
- 색공간
- 촬영 시각은 제품 목적이 있고 위험 검토된 경우
- content hash

촬영 시각을 review 방문일로 자동 확정하지 않는다.

### 11.3 영수증

OCR이 필요하면 다음 값을 별도 추출한다.

```text
merchant candidate
transaction date/time
amount bucket or amount, 목적에 따라
receipt identifier token
```

카드번호, 승인번호, 전화, 이름 등 불필요한 텍스트는 마스킹·비저장한다. OCR 원문을 일반 로그·분석에 넣지 않는다.

### 11.4 얼굴·차량번호

공개 사진의 우연한 인물·번호판 처리 기준을 moderation 정책과 연결한다. 자동 blur를 도입하면 오탐·복구·원본 접근·model version을 관리한다.

---

## 12. 정규화 master

### 12.1 처리

- orientation 적용
- 색공간 sRGB 표준화
- metadata 제거
- 안전한 format 재인코딩
- 최대 dimension 제한
- alpha 처리
- visual 품질 확인

### 12.2 원본 보존

목적별:

- 공개 사용자 사진: 분쟁·재처리 목적의 제한 기간 후 normalized master만 유지 가능
- 점주 공식: 권리·계약에 따라 master 유지
- editorial: 원본 보존 가능, 별도 권리
- 영수증·증빙: 판정 후 짧은 보존, legal hold 예외

원본 삭제 후 새 codec variant를 만들 수 있도록 충분한 품질의 normalized master를 정의한다.

### 12.3 hash

- cryptographic content hash: exact duplicate/무결성
- perceptual hash: 유사·재업로드 후보

hash는 개인정보·콘텐츠 fingerprint가 될 수 있으므로 접근·보존·외부 공유를 통제한다.

---

## 13. variant

초기 후보:

```text
thumb_square_160
card_320
card_640
detail_960
detail_1440
original_ratio_master_limited
avatar_96/192
```

### 13.1 format

- AVIF/WebP/JPEG를 client 지원·품질·CPU 기준으로 제공
- fallback
- content negotiation 또는 명시 URL
- 변환 version을 path/cache key에 포함

### 13.2 crop

- center crop만으로 음식·간판이 잘리지 않게 focal point 후보
- 사용자가 대표 crop을 조정할 수 있는 목적
- 원본 비율 view 제공
- 얼굴 자동 crop을 기본 의존하지 않음

### 13.3 upscaling

원본보다 큰 variant를 생성하지 않거나 제한한다. AI upscaling은 실제 메뉴를 왜곡할 수 있어 기본 사용하지 않는다.

### 13.4 sharpen/색 보정

일관된 기술적 보정만 적용한다. 채도·음식 색을 과장해 사실을 왜곡하지 않는다.

---

## 14. 중복과 재사용

### 14.1 exact duplicate

같은 사용자·목적 내 중복 업로드를 감지해 기존 asset 연결을 제안할 수 있다. 다른 사용자의 asset을 권한 확인 없이 재사용하지 않는다.

### 14.2 perceptual duplicate

후보 용도:

- spam 반복
- 인터넷 사진 도용 가능성
- 다른 지점 잘못 업로드
- 이미 삭제된 위반 콘텐츠 재업로드

자동 삭제의 단독 근거로 사용하지 않는다.

### 14.3 동일 사진의 여러 지점

프랜차이즈 공식 메뉴 사진은 권리가 있다면 여러 branch link가 가능하다. 사용자 현장 사진이 무관한 지점 여러 곳에 붙으면 위험 신호다.

### 14.4 삭제 효과

한 asset을 여러 대상이 link하면 link 삭제와 underlying asset 삭제를 분리한다. 모든 권리·보존 link가 끝났을 때 객체를 파기한다.

---

## 15. moderation

### 15.1 자동 signal

- 노출·성적 콘텐츠
- 폭력·혐오 symbol
- 개인정보 텍스트·얼굴·번호판
- spam/도용/duplicate
- 음식점과 무관
- screenshot·홍보물
- watermark/연락처
- 조작·합성 가능성

자동 signal은 최종 결정이 아니며 목적별 threshold를 다르게 한다.

### 15.2 공개 timing

위험 기반:

- 낮은 위험 review photo: 처리 후 공개 + 사후 검토
- 신규/위험 계정: moderation pending
- profile avatar: 별도 policy
- 점주 official ad-like image: 공식/광고 기준 검토
- 증빙: 공개 불가

### 15.3 사람 검토

- thumbnail blur
- 원본 자동 로드 금지
- 민감 warning
- target/review/branch 문맥
- 정책 version
- 유지/제한/숨김/제거
- 이의 제기

### 15.4 부모 콘텐츠

리뷰가 제거됐다고 asset을 즉시 물리 삭제하지 않는다. 이의·법적 보존 후 link와 object lifecycle을 처리한다.

### 15.5 잘못된 지점

좋은 사진이지만 다른 branch라면 정책 제재 대신 link 귀속 수정이 가능하다. 작성자에게 결과와 이의 경로를 제공한다.

---

## 16. 권리·저작권

### 16.1 업로드 확인

사용자는 직접 촬영했거나 사용할 권리가 있음을 확인한다. 점주는 브랜드 본사 asset의 지점 사용 권한이 있는지 조직 관계와 계약을 따를 수 있다.

### 16.2 license

이용약관에서 도락의 표시·변환·배포에 필요한 범위를 정의하되 소유권 이전처럼 표현하지 않는다. 사용자 삭제·계정 종료·서비스 종료 시 처리도 명시한다.

### 16.3 권리 신고

```text
report received
 -> identity/authority check
 -> asset and uses frozen/snapshotted
 -> temporary action if needed
 -> uploader response
 -> decision
 -> links/CDN action
 -> appeal/counter process as applicable
```

법적 절차는 현재 법률과 전문가 검토가 필요하다.

### 16.4 credit

editorial/partner asset의 credit 요구를 asset metadata와 UI component로 관리한다. caption 자유 텍스트에만 의존하지 않는다.

---

## 17. 공개 전달

### 17.1 CDN URL

```text
https://media.dorak.example/{assetPublicId}/{variant}/{version}.{ext}
```

실제 bucket key, 사용자 ID, 원본 filename을 노출하지 않는다.

### 17.2 cache

- immutable versioned variant: 장기 cache
- 공개 상태 변경: 새 manifest/link와 CDN invalidation
- 삭제·법적 제거: 긴 TTL만 믿지 않고 긴급 purge 경로
- private 증빙: public CDN 금지

### 17.3 hotlink

공개 사진의 일반 web 표시와 abuse 비용을 균형 있게 통제한다. referer만 보안 통제로 사용하지 않는다.

### 17.4 signed URL

비공개 증빙:

- 요청 시 객체 권한 재검사
- 짧은 expiry
- actor/case 목적 기록
- Content-Disposition/Content-Type 안전
- download 제한·워터마크 후보
- URL 로그·analytics 금지

---

## 18. client 표시

### 18.1 responsive image

- width/scale에 맞는 variant
- layout dimensions 사전 제공
- lazy load
- 우선순위 hero 제한
- blur/solid placeholder
- slow/error fallback

### 18.2 접근성

- 의미 있는 음식·외관 사진에 alt/caption
- 장식 이미지는 적절히 숨김
- 자동 생성 alt는 오류·편견을 검토하고 수정 가능
- gallery keyboard/screen reader
- 현재 위치와 전체 개수
- pinch zoom과 close

### 18.3 출처

사용자, 점주 공식, 도락 editorial을 표시한다. 사진 metadata를 너무 작게 숨기지 않는다.

### 18.4 메뉴 사진

가격·메뉴를 이미지 안 텍스트에만 맡기지 않는다. 구조화 메뉴가 있으면 함께 제공하고 OCR은 사실 추출 후보로만 사용한다.

---

## 19. 업로드 UX

### 19.1 상태

파일별:

```text
대기
업로드 중
검사 중
처리 완료
다시 시도 가능 오류
지원하지 않는 파일
정책 검토 중
거절
```

### 19.2 오프라인·재개

리뷰 text draft와 media upload를 분리한다. 사진 실패로 글을 잃지 않는다. 앱 재시작 시 upload session 만료와 object 상태를 조회한다.

### 19.3 편집

- 순서
- caption
- 대표 사진
- crop/focal point, 필요한 목적
- 삭제

필터·피부 보정 같은 이미지 편집기는 초기 제공하지 않는다.

### 19.4 오류

`업로드 실패`보다:

```text
이 사진은 크기가 너무 커 처리할 수 없어요.
원본을 조금 줄이거나 다른 사진을 선택해 주세요.
리뷰 글은 저장되어 있어요.
```

---

## 20. API

```text
POST /v1/media-upload-sessions
GET  /v1/media-upload-sessions/{id}
POST /v1/media-upload-sessions/{id}:complete
POST /v1/media-upload-sessions/{id}:abort
GET  /v1/media/{assetId}
PATCH /v1/media/{assetId}
DELETE /v1/media/{assetId}
POST /v1/media/{assetId}:appeal
```

점주·운영자·증빙 endpoint는 별도 namespace·DTO·권한을 사용한다.

응답에는 내부 object key·security signal·evidence URL을 포함하지 않는다.

---

## 21. 이벤트

```text
media.uploaded
media.validation_failed
media.security_scan_completed
media.processing_completed
media.moderation_required
media.ready
media.published
media.limited
media.removed
media.deletion_requested
media.destroyed
```

각 이벤트는 asset version과 purpose를 갖고 consumer가 오래된 공개 상태로 되돌리지 않게 한다.

소비자:

- review/branch read model
- search
- notification
- moderation
- analytics
- retention/deletion

---

## 22. 보존·삭제

### 22.1 목적별

| 종류 | 방향 |
|---|---|
| 공개 사용자 master | 공개·분쟁 정책 기간 |
| 변환 variant | master/link 생명주기, 재생성 가능 |
| quarantine 실패 파일 | 매우 짧게 또는 즉시 파기 |
| receipt evidence | 판정 후 최소 기간 |
| owner document | claim·분쟁 목적 기간 |
| moderation evidence | 사건·이의 기간 |
| legal hold | 해제 전 파기 금지 |

정확한 기간은 [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)와 법률 검토에서 확정한다.

### 22.2 삭제 흐름

```text
request/decision
 -> link hidden
 -> public manifest/search/cache update
 -> CDN purge if required
 -> object retention evaluation
 -> variants delete
 -> master/original delete when eligible
 -> processor/backup tombstone
 -> verification
```

### 22.3 CDN

삭제 완료는 DB flag만으로 증명하지 않는다. public URL, variant manifest, CDN edge를 synthetic로 확인한다.

### 22.4 backup

복원 시 삭제 tombstone을 다시 적용한다. backup에서 개별 객체를 즉시 제거하기 어려운 범위와 정책을 문서화한다.

---

## 23. 비용

### 비용 원인

- 원본 bytes
- variant 수
- decode/transcode CPU
- CDN egress
- moderation model/API
- 중복 업로드
- 긴 quarantine·증빙 보존
- cache miss

### 통제

- 목적별 size/pixel 제한
- 실제 client width에 맞는 variant
- 장기 cache version
- exact duplicate 최적화, 권리 경계 유지
- 미사용 variant 제거
- storage class lifecycle
- 처리 queue autoscaling 상한
- 사용자/조직 abuse quota

비용 때문에 증빙 보안 검사나 삭제 검증을 제거하지 않는다.

---

## 24. SLO·관측성

초기 목표:

| SLI | 목표 |
|---|---:|
| upload session 생성 | 99.9% |
| 정상 이미지 처리 완료 | p95 30초, p99 2분 방향 |
| 기존 공개 이미지 전달 | 99.95% CDN/API 조합 |
| removal 결정→public link 차단 | 긴급도별, P0 1분 방향 |
| private evidence unauthorized access | 0 목표 |

지표:

```text
uploads by purpose/format/size
validation/security failure
decode time/memory
queue age
variant failure
moderation pending age
CDN hit/error
orphan object/link
deletion overdue
signed URL access
cost per asset/GB
```

---

## 25. 기능 저하

### 처리 worker 장애

- 새 asset `processing` 유지
- 리뷰 text draft/게시 정책 범위 유지
- 기존 사진 전달
- 완료 이벤트 재시도
- 처리 지연 표시

### object storage 장애

- upload session 중지
- text 기능 유지
- 기존 CDN cache 가능 범위
- 공개 URL 오류 fallback

### moderation 공급자 장애

- 위험 목적은 pending
- low-risk 사후 검토 policy가 승인된 경우 제한 운영
- 증빙 검증 결과를 자동 성공으로 처리하지 않음

### CDN 장애

- 이미지 없는 layout 유지
- origin 직접 공개 bypass 금지
- 검색·예약 핵심 동작 유지

---

## 26. 테스트

### 입력

- MIME/확장자 불일치
- truncated/corrupt
- huge dimensions
- decompression bomb
- animated/multi-frame
- CMYK/색공간
- orientation
- transparency
- unusual Unicode filename
- duplicate content

### 보안

- polyglot
- SVG/script
- malformed decoder fuzz corpus
- object key traversal/overwrite
- signed URL expiry/권한
- public ACL
- logs/metadata

### pipeline

- complete 중복
- worker crash/retry
- stage 역순
- version stale event
- partial variants
- queue backlog
- master deletion/variant regeneration

### privacy

- EXIF GPS 제거
- 영수증 OCR sensitive field
- private bucket/CDN
- 마스킹·워터마크
- deletion propagation
- backup tombstone

### moderation

- parent review state
- appeal/reversal
- wrong branch relink
- exact/perceptual false positive
- official vs user policy

### client

- 느린 네트워크
- 앱 종료/재개
- permission denial
- large text/screen reader gallery
- error fallback

---

## 27. 운영 도구

- asset metadata와 안전한 preview
- original/private 접근 사유·권한
- 처리 stage와 retry
- link 대상·revision
- exact/perceptual duplicate 후보
- automated signal과 model version
- moderation case/decision
- rights/takedown
- CDN purge
- deletion/retention status

운영자가 object storage console에서 직접 파일을 삭제하는 것을 일반 절차로 삼지 않는다.

---

## 28. 구현 순서

### M0. 공개 이미지 기반

1. upload session/direct upload
2. quarantine bucket
3. format/pixel validation
4. safe decode/re-encode
5. normalized master/variants
6. media link
7. CDN

### M1. 리뷰·점주

1. review revision link
2. official source
3. moderation state
4. caption/alt/sort
5. removal/cache

### M2. 증빙

1. separate bucket/key/role
2. signed viewer
3. receipt processing
4. retention job
5. access audit

### M3. 품질·권리

1. perceptual duplicate
2. privacy detection/blur 후보
3. rights record/takedown
4. model evaluation
5. advanced formats

### M4. 확장

동영상이 제품 가치와 운영 비용을 정당화하면 별도 설계·ADR 후 도입한다.

---

## 29. 출시 체크리스트

- [ ] 공개 이미지와 비공개 증빙이 다른 bucket·role·delivery 경계다.
- [ ] signed upload가 public ACL·임의 object key를 허용하지 않는다.
- [ ] 확장자·Content-Type이 아니라 실제 format/decoder를 검증한다.
- [ ] pixel/frame/time/memory budget이 있다.
- [ ] decoder worker가 API와 격리된다.
- [ ] EXIF GPS와 불필요 metadata가 공개 variant에서 제거된다.
- [ ] 검사 전 파일이 CDN에 공개되지 않는다.
- [ ] 원본·master·variant·link·recipe version이 추적된다.
- [ ] 리뷰 text draft는 사진 처리 실패와 독립적으로 보존된다.
- [ ] 점주 공식·사용자·editorial 출처가 UI에서 구분된다.
- [ ] 자동 moderation signal이 최종 결정과 분리된다.
- [ ] private evidence URL은 매 요청 권한 확인과 짧은 만료를 갖는다.
- [ ] 삭제가 link·검색·cache·CDN·objects·backup tombstone에 전파된다.
- [ ] malformed/fuzz/duplicate/역순/retry 테스트가 있다.
- [ ] SLO와 queue/deletion 경보가 있다.

---

## 30. 미결정 사항

- 초기 허용 format과 파일·pixel 상한
- normalized master format·품질
- AVIF/WebP/JPEG variant 전략
- 원본 공개 사진 보존기간
- receipt OCR 자체/공급자와 추출 필드
- 얼굴·번호판 자동 blur 도입 여부
- 이미지 moderation 자체/공급자
- perceptual hash 알고리즘·임계치
- 공식 사진의 AI 생성·보정 표시 기준
- alt text 자동 생성 범위
- CDN·image transformation 공급자
- 동영상 도입 기준

---

## 31. 연관 문서

- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [API_DESIGN.md](../architecture/API_DESIGN.md)
- [MODERATION_POLICY.md](../policies/MODERATION_POLICY.md)
- [OWNER_PLATFORM.md](./OWNER_PLATFORM.md)
- [PRIVACY_SECURITY.md](../policies/PRIVACY_SECURITY.md)
- [TECH_STACK.md](../architecture/TECH_STACK.md)
- [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)
- [TEST_STRATEGY.md](../architecture/TEST_STRATEGY.md)
- [SLO_RUNBOOKS.md](../operations/SLO_RUNBOOKS.md)
