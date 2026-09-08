import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  primaryKey,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

export const ingestionSchema = pgSchema("ingestion");
export const opsSchema = pgSchema("ops");
export const catalogSchema = pgSchema("catalog");
export const platformSchema = pgSchema("platform");
export const communitySchema = pgSchema("community");
export const identitySchema = pgSchema("identity");

export const sources = ingestionSchema.table("sources", {
  id: uuid().primaryKey(),
  sourceKey: text("source_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  provenance: text().notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const rawDocuments = ingestionSchema.table(
  "raw_documents",
  {
    id: uuid().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    sourceRecordId: text("source_record_id").notNull(),
    payload: jsonb().notNull(),
    payloadSha256: text("payload_sha256").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("raw_documents_source_record_payload_idx").on(
      table.sourceId,
      table.sourceRecordId,
      table.payloadSha256,
    ),
  ],
);

export const branchCandidates = opsSchema.table(
  "branch_candidates",
  {
    id: uuid().primaryKey(),
    publicId: text("public_id").notNull().unique(),
    rawDocumentId: uuid("raw_document_id")
      .notNull()
      .references(() => rawDocuments.id),
    proposedName: text("proposed_name").notNull(),
    proposedAddress: text("proposed_address").notNull(),
    proposedCuisineKey: text("proposed_cuisine_key"),
    normalizedPayload: jsonb("normalized_payload").notNull(),
    confidence: numeric({ precision: 5, scale: 4 }).notNull(),
    status: text().notNull().default("pending"),
    decidedBy: uuid("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNote: text("decision_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("branch_candidates_created_idx").on(table.createdAt, table.id),
  ],
);

export const branches = catalogSchema.table(
  "branches",
  {
    id: uuid().primaryKey(),
    publicId: text("public_id").notNull().unique(),
    approvedCandidateId: uuid("approved_candidate_id").references(
      () => branchCandidates.id,
    ),
    name: text().notNull(),
    neighborhood: text().notNull(),
    district: text().notNull(),
    roadAddress: text("road_address").notNull(),
    phone: text(),
    websiteUrl: text("website_url"),
    openingHours: text("opening_hours"),
    closedDays: text("closed_days"),
    externalInfoSource: text("external_info_source"),
    externalInfoUpdatedAt: timestamp("external_info_updated_at", {
      withTimezone: true,
    }),
    cuisineKey: text("cuisine_key").notNull(),
    shortDescription: text("short_description").notNull(),
    priceBand: smallint("price_band").notNull(),
    signatureMenu: text("signature_menu").array().notNull().default([]),
    rating: numeric({ precision: 3, scale: 2 }),
    reviewCount: integer("review_count").notNull().default(0),
    sourceVersion: integer("source_version").notNull().default(1),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    location: geographyPoint(),
    sourceKey: text("source_key").notNull().default("dorak.manual"),
    sourceRecordId: text("source_record_id").notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    provenance: text().notNull(),
    status: text().notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("branches_name_idx").on(table.name)],
);

export const users = identitySchema.table("users", {
  id: uuid().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const sessions = identitySchema.table(
  "sessions",
  {
    id: uuid().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_user_drizzle_idx").on(table.userId)],
);

export const accounts = identitySchema.table(
  "accounts",
  {
    id: uuid().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuer: text().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text(),
    idToken: text("id_token"),
    password: text(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("accounts_issuer_account_drizzle_idx").on(
      table.issuer,
      table.accountId,
    ),
    index("accounts_user_drizzle_idx").on(table.userId),
  ],
);

export const verifications = identitySchema.table(
  "verifications",
  {
    id: uuid().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("verifications_identifier_drizzle_idx").on(table.identifier),
  ],
);

export const reviews = communitySchema.table(
  "reviews",
  {
    id: uuid().primaryKey(),
    publicId: text("public_id").notNull().unique(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    reviewerUserId: uuid("reviewer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    authorName: text("author_name").notNull(),
    rating: smallint().notNull(),
    body: text().notNull(),
    visitedOn: date("visited_on").notNull(),
    visitAttested: boolean("visit_attested").notNull(),
    independentVisitAttested: boolean("independent_visit_attested"),
    usageType: text("usage_type"),
    identityVerified: boolean("identity_verified").notNull(),
    visitVerification: text("visit_verification")
      .notNull()
      .default("self_reported"),
    status: text().notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("reviews_branch_reviewer_idx").on(
      table.branchId,
      table.reviewerUserId,
    ),
    index("reviews_created_idx").on(table.status, table.createdAt),
  ],
);

export const savedBranches = communitySchema.table(
  "saved_branches",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "saved_branches_pkey",
      columns: [table.userId, table.branchId],
    }),
    index("saved_branches_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const auditLog = platformSchema.table(
  "audit_log",
  {
    id: uuid().primaryKey(),
    actorId: uuid("actor_id"),
    action: text().notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("audit_log_entity_drizzle_idx").on(table.entityType, table.entityId),
  ],
);

export const outboxEvents = platformSchema.table(
  "outbox_events",
  {
    id: uuid().primaryKey(),
    publicId: text("public_id").notNull().unique(),
    eventName: text("event_name").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    payload: jsonb().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
  },
  (table) => [
    index("outbox_events_occurred_idx").on(table.occurredAt, table.id),
  ],
);
