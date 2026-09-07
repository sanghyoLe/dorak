import assert from "node:assert/strict";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for the database smoke test.");
}

const client = postgres(databaseUrl, { max: 1, connect_timeout: 10 });

try {
  const [state] = await client<
    {
      appliedMigrations: number;
      branchTable: string | null;
      reviewTable: string | null;
      savedBranchTable: string | null;
      postgisInstalled: boolean;
      generatedId: string;
    }[]
  >`
    SELECT
      (SELECT count(*)::int FROM platform.schema_migrations) AS "appliedMigrations",
      to_regclass('catalog.branches')::text AS "branchTable",
      to_regclass('community.reviews')::text AS "reviewTable",
      to_regclass('community.saved_branches')::text AS "savedBranchTable",
      EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS "postgisInstalled",
      uuidv7()::text AS "generatedId"
  `;

  assert(state);
  assert.equal(state.appliedMigrations, 10);
  assert.equal(state.branchTable, "catalog.branches");
  assert.equal(state.reviewTable, "community.reviews");
  assert.equal(state.savedBranchTable, "community.saved_branches");
  assert.equal(state.postgisInstalled, true);
  assert.match(state.generatedId, /^[0-9a-f-]{36}$/);

  let invalidPublicIdRejected = false;
  try {
    await client`
      INSERT INTO catalog.branches (
        public_id,
        name,
        neighborhood,
        district,
        road_address,
        cuisine_key,
        short_description,
        price_band,
        provenance,
        source_key,
        source_record_id
      ) VALUES (
        'invalid',
        '제약조건 확인용 식당',
        '테스트동',
        '테스트구',
        '합성 테스트 주소',
        'korean',
        '트랜잭션에 남지 않는 제약조건 검사',
        2,
        'synthetic',
        'dorak.smoke',
        'invalid-public-id'
      )
    `;
  } catch (error) {
    invalidPublicIdRejected =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23514";
  }

  assert.equal(invalidPublicIdRejected, true);
  console.log(
    "database smoke: migrations, reviews, PostGIS, UUIDv7, and constraints passed",
  );
} finally {
  await client.end();
}
