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
  priceBand: "₩" | "₩₩" | "₩₩₩" | "₩₩₩₩";
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
export type VisitVerification = "self_reported" | "receipt" | "reservation";

export interface ReviewSummary {
  publicId: string;
  authorName: string;
  rating: number;
  body: string;
  visitedOn: string | null;
  identityVerified: boolean;
  visitVerification: VisitVerification;
  createdAt: string;
}

export interface ReviewSubmission {
  authorName: string;
  rating: number;
  body: string;
  visitedOn: string;
  visitAttested: true;
}

export interface OpsReview extends ReviewSummary {
  branchPublicId: string;
  branchName: string;
  status: ReviewStatus;
}
