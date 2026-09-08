export const CUISINE_KEYS = [
  "korean",
  "noodle",
  "japanese",
  "chinese",
  "western",
  "cafe",
] as const;

export type CuisineKey = (typeof CUISINE_KEYS)[number];

export type DataProvenance = "synthetic" | "approved_source";
export type CatalogMode = "memory" | "postgres";
export type BranchSort = "default" | "rating" | "reviews";

export interface BranchSearchOptions {
  limit?: number;
  offset?: number;
  page?: number;
  approvedOnly?: boolean;
  district?: string;
  neighborhood?: string;
  priceBands?: number[];
  minRating?: number;
  sort?: BranchSort;
}

export interface BranchSummary {
  id: string;
  publicId: string;
  name: string;
  neighborhood: string;
  district: string;
  address: string;
  phone?: string | null;
  websiteUrl?: string | null;
  openingHours?: string | null;
  closedDays?: string | null;
  externalInfoSource?: string | null;
  externalInfoUpdatedAt?: string | null;
  cuisine: CuisineKey;
  cuisineLabel: string;
  shortDescription: string;
  signatureMenu: string[];
  priceBand: "₩" | "₩₩" | "₩₩₩" | "₩₩₩₩" | null;
  rating: null | number;
  reviewCount: number;
  provenance: DataProvenance;
  latitude?: number | null;
  longitude?: number | null;
  sourceName?: string | null;
  lastVerifiedAt?: string | null;
}

export interface BranchSearchResponse {
  data: BranchSummary[];
  meta: {
    query: string;
    total: number;
    dataMode: CatalogMode;
    page?: number;
    pageSize?: number;
    sort?: BranchSort;
  };
}

export interface NearbyBranch extends BranchSummary {
  distanceMeters: number;
}

export interface NearbyBranchSearchOptions {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  limit?: number;
  approvedOnly?: boolean;
}

export interface BranchLocationGroup {
  district: string;
  count: number;
  neighborhoods: Array<{
    name: string;
    count: number;
  }>;
}

export type CandidateStatus = "pending" | "approved" | "rejected";

export interface IngestionCandidate {
  id: string;
  sourceName: string;
  sourceRecordId: string;
  proposedName: string;
  proposedAddress: string;
  cuisineLabel: string;
  confidence: number;
  status: CandidateStatus;
  provenance: DataProvenance;
  createdAt: string;
}

export type ReviewStatus = "published" | "hidden";
export type ReviewUsageType = "dine_in" | "takeout" | "delivery";
export type VisitVerification = "self_reported" | "receipt" | "reservation";
export type ReviewReportReason =
  | "false_experience"
  | "undisclosed_interest"
  | "privacy"
  | "harassment"
  | "discrimination"
  | "threat_safety"
  | "advertising_spam"
  | "copyright"
  | "restaurant_info"
  | "other";
export type ReviewReportStatus = "pending" | "resolved" | "dismissed";
export type ReviewReportDecision = Extract<
  ReviewReportStatus,
  "resolved" | "dismissed"
>;

export interface ReviewSummary {
  usageType?: ReviewUsageType | null;
  publicId: string;
  authorName: string;
  rating: number;
  body: string;
  visitedOn: string | null;
  identityVerified: boolean;
  /** Author declaration, not independent verification; absent for legacy reviews. */
  independentVisitAttested?: boolean | null;
  visitVerification: VisitVerification;
  createdAt: string;
}

export interface ReviewSubmission {
  usageType: ReviewUsageType;
  authorName: string;
  rating: number;
  body: string;
  visitedOn: string;
  visitAttested: true;
  independentVisitAttested: true;
}

export interface OpsReview extends ReviewSummary {
  branchPublicId: string;
  branchName: string;
  status: ReviewStatus;
}

export interface ReviewReportSubmission {
  reason: ReviewReportReason;
  detail: string;
}

export interface ReviewReportSummary {
  publicId: string;
  status: ReviewReportStatus;
  createdAt: string;
}

export interface OpsReviewReport extends ReviewReportSummary {
  reviewPublicId: string;
  branchPublicId: string;
  branchName: string;
  reviewAuthorName: string;
  reviewBody: string;
  reason: ReviewReportReason;
  detail: string;
  reporterAuthenticated: boolean;
  decisionNote: string | null;
  decidedAt: string | null;
}
