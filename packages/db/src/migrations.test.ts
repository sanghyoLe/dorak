import { describe, expect, it } from "vitest";

import {
  discoverMigrations,
  migrationChecksum,
  stripTransactionWrapper,
} from "./migrations.js";

describe("migration files", () => {
  it("discovers migrations in monotonic filename order", async () => {
    const migrations = await discoverMigrations();

    expect(migrations.map((migration) => migration.name)).toEqual([
      "000001_extensions_and_schemas.sql",
      "000002_foundation_vertical_slice.sql",
      "000003_public_branch_read_fields.sql",
      "000004_postgres_search.sql",
      "000005_mvp_reviews.sql",
      "000006_branch_source_identity.sql",
      "000007_branch_contact_fields.sql",
      "000008_branch_external_info.sql",
      "000009_branch_discovery_indexes.sql",
      "000010_saved_branches.sql",
      "000011_review_independence.sql",
      "000012_review_usage_type.sql",
      "000013_review_reports.sql",
      "000014_nullable_branch_price.sql",
    ]);
    expect(
      migrations.every((migration) => migration.checksum.length === 64),
    ).toBe(true);
  });

  it("uses stable SHA-256 checksums", () => {
    expect(migrationChecksum("SELECT 1;")).toBe(
      "17db4fd369edb9244b9f91d9aeed145c3d04ad8ba6e95d06247f07a63527d11a",
    );
  });

  it("removes the migration-owned transaction wrapper", () => {
    expect(stripTransactionWrapper("BEGIN;\nSELECT 1;\nCOMMIT;")).toBe(
      "SELECT 1;",
    );
  });
});
