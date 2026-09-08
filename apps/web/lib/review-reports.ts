import type { ReviewReportReason } from "@dorak/domain-types";

export const REVIEW_REPORT_REASON_LABELS: Record<ReviewReportReason, string> = {
  false_experience: "방문·주문 경험이 아닌 리뷰",
  undisclosed_interest: "협찬·이해관계 미공개",
  privacy: "개인정보 노출",
  harassment: "괴롭힘·모욕",
  discrimination: "차별·혐오",
  threat_safety: "위협·긴급 안전",
  advertising_spam: "광고·스팸",
  copyright: "저작권·상표권",
  restaurant_info: "음식점 정보 오류",
  other: "기타 정책 위반",
};
