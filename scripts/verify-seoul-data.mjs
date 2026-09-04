import assert from "node:assert/strict";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const sampleArgument = process.argv.find((value) =>
  value.startsWith("--sample-size="),
);
const jsonOutput = process.argv.includes("--json");
const sampleSize = sampleArgument
  ? Number(sampleArgument.slice("--sample-size=".length))
  : 100;

if (!databaseUrl) throw new Error("DATABASE_URL is required.");
if (!Number.isInteger(sampleSize) || sampleSize < 1 || sampleSize > 1000) {
  throw new Error("--sample-size must be an integer between 1 and 1000.");
}

const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  onnotice: () => undefined,
});

const expectedCuisineKeys = [
  "korean",
  "noodle",
  "japanese",
  "chinese",
  "western",
  "cafe",
];

function percentage(value, total) {
  return total === 0 ? 0 : Number(((value / total) * 100).toFixed(1));
}

function check(name, passed, detail) {
  return { name, passed, detail };
}

try {
  const [
    extensions,
    counts,
    sourceRows,
    qualityRows,
    sampleRows,
    duplicateRows,
    candidateRows,
  ] = await Promise.all([
    sql`
        SELECT
          EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'postgis'
          ) AS postgis,
          EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
          ) AS trgm
      `,
    sql`
        SELECT
          count(*)::int AS total,
          count(*) FILTER (WHERE status = 'active')::int AS active,
          count(*) FILTER (WHERE status = 'active' AND provenance = 'approved_source')::int AS approved,
          count(*) FILTER (WHERE status = 'active' AND provenance = 'synthetic')::int AS synthetic,
          count(*) FILTER (WHERE status = 'active' AND location IS NOT NULL)::int AS with_location,
          count(*) FILTER (WHERE status = 'active' AND phone IS NOT NULL AND phone <> '')::int AS with_phone,
          count(*) FILTER (WHERE status = 'active' AND signature_menu <> ARRAY[]::text[])::int AS with_menu,
          count(*) FILTER (WHERE status = 'active' AND opening_hours IS NOT NULL AND opening_hours <> '')::int AS with_opening_hours,
          count(*) FILTER (WHERE status = 'active' AND closed_days IS NOT NULL AND closed_days <> '')::int AS with_closed_days
        FROM catalog.branches
      `,
    sql`
        SELECT
          count(*)::int AS registered,
          count(*) FILTER (WHERE source_key = 'seoul.localdata.general_restaurant')::int AS seoul_source,
          count(*) FILTER (WHERE source_key = 'seoul.localdata.general_restaurant' AND is_enabled)::int AS seoul_enabled,
          count(*) FILTER (WHERE is_enabled)::int AS enabled
        FROM ingestion.sources
      `,
    sql`
        SELECT
          count(*) FILTER (WHERE status = 'active' AND name = '')::int AS blank_name,
          count(*) FILTER (WHERE status = 'active' AND neighborhood = '')::int AS blank_neighborhood,
          count(*) FILTER (WHERE status = 'active' AND district = '')::int AS blank_district,
          count(*) FILTER (WHERE status = 'active' AND road_address = '')::int AS blank_address,
          count(*) FILTER (WHERE status = 'active' AND short_description = '')::int AS blank_description,
          count(*) FILTER (WHERE status = 'active' AND source_key = '')::int AS blank_source_key,
          count(*) FILTER (WHERE status = 'active' AND source_record_id = '')::int AS blank_source_record_id,
          count(*) FILTER (WHERE status = 'active' AND search_text = '')::int AS blank_search_text,
          count(*) FILTER (
            WHERE status = 'active'
              AND location IS NOT NULL
              AND (
                ST_X(location::geometry) NOT BETWEEN 124 AND 132
                OR ST_Y(location::geometry) NOT BETWEEN 33 AND 39
                OR NOT ST_IsValid(location::geometry)
              )
          )::int AS invalid_location,
          count(*) FILTER (
            WHERE status = 'active'
              AND cuisine_key NOT IN ('korean', 'noodle', 'japanese', 'chinese', 'western', 'cafe')
          )::int AS unknown_cuisine,
          count(*) FILTER (
            WHERE status = 'active'
              AND NOT EXISTS (
                SELECT 1
                FROM ingestion.sources source
                WHERE source.source_key = catalog.branches.source_key
              )
          )::int AS unregistered_source
        FROM catalog.branches
      `,
    sql`
        SELECT
          count(*)::int AS sample_size,
          count(*) FILTER (WHERE provenance = 'approved_source')::int AS approved,
          count(*) FILTER (WHERE name <> '' AND neighborhood <> '' AND district <> '' AND road_address <> '')::int AS complete_identity,
          count(*) FILTER (WHERE location IS NOT NULL)::int AS with_location,
          count(*) FILTER (WHERE search_text LIKE '%' || name || '%')::int AS indexed_name,
          count(*) FILTER (WHERE search_text LIKE '%' || neighborhood || '%')::int AS indexed_neighborhood,
          count(*) FILTER (WHERE search_text LIKE '%' || district || '%')::int AS indexed_district,
          count(*) FILTER (WHERE cuisine_key = ANY(${sql.array(expectedCuisineKeys)}))::int AS known_cuisine
        FROM (
          SELECT *
          FROM catalog.branches
          WHERE status = 'active' AND provenance = 'approved_source'
          ORDER BY md5(public_id)
          LIMIT ${sampleSize}
        ) sample
      `,
    sql`
        SELECT count(*)::int AS duplicate_groups
        FROM (
          SELECT source_key, source_record_id
          FROM catalog.branches
          WHERE status = 'active'
          GROUP BY source_key, source_record_id
          HAVING count(*) > 1
        ) duplicates
      `,
    sql`
        SELECT
          count(*)::int AS candidates,
          count(*) FILTER (WHERE candidate.status = 'pending')::int AS pending,
          count(*) FILTER (
            WHERE candidate.status NOT IN ('pending', 'approved', 'rejected')
          )::int AS invalid_status,
          count(*) FILTER (WHERE raw.id IS NULL)::int AS orphaned_raw,
          count(*) FILTER (WHERE source.id IS NULL)::int AS orphaned_source
        FROM ops.branch_candidates AS candidate
        LEFT JOIN ingestion.raw_documents AS raw
          ON raw.id = candidate.raw_document_id
        LEFT JOIN ingestion.sources AS source
          ON source.id = raw.source_id
      `,
  ]);

  const extensionState = extensions[0];
  const totals = counts[0];
  const sources = sourceRows[0];
  const quality = qualityRows[0];
  const sample = sampleRows[0];
  const duplicates = duplicateRows[0];
  const candidateState = candidateRows[0];

  assert(totals);
  assert(sources);
  assert(quality);
  assert(sample);
  assert(duplicates);
  assert(candidateState);

  const checks = [
    check(
      "database extensions",
      extensionState.postgis && extensionState.trgm,
      `postgis=${extensionState.postgis}, pg_trgm=${extensionState.trgm}`,
    ),
    check(
      "approved source registered",
      sources.seoul_source > 0 && sources.seoul_enabled > 0,
      `${sources.seoul_source} Seoul source, ${sources.seoul_enabled} enabled Seoul source(s)`,
    ),
    check(
      "approved branches available",
      totals.approved > 0,
      `${totals.approved.toLocaleString("ko-KR")} approved / ${totals.active.toLocaleString("ko-KR")} active`,
    ),
    check(
      "required fields complete",
      Object.values(quality)
        .slice(0, 8)
        .every((value) => value === 0),
      `blank fields=${Object.values(quality).slice(0, 8).join(",")}`,
    ),
    check(
      "coordinates valid",
      quality.invalid_location === 0,
      `${totals.with_location.toLocaleString("ko-KR")} locations, ${quality.invalid_location} invalid`,
    ),
    check(
      "source identities unique",
      duplicates.duplicate_groups === 0,
      `${duplicates.duplicate_groups} duplicate group(s)`,
    ),
    check(
      "source identities registered",
      quality.unregistered_source === 0,
      `${quality.unregistered_source} unregistered source row(s)`,
    ),
    check(
      "cuisine keys known",
      quality.unknown_cuisine === 0,
      `${quality.unknown_cuisine} unknown cuisine row(s)`,
    ),
    check(
      "operations queue integrity",
      candidateState.invalid_status === 0 &&
        candidateState.orphaned_raw === 0 &&
        candidateState.orphaned_source === 0,
      `${candidateState.candidates} candidate(s), ${candidateState.pending} pending, ${candidateState.invalid_status} invalid status, ${candidateState.orphaned_raw} orphaned raw document(s), ${candidateState.orphaned_source} orphaned source(s)`,
    ),
    check(
      `sample identity (${sample.sample_size} rows)`,
      sample.sample_size > 0 && sample.complete_identity === sample.sample_size,
      `${sample.complete_identity}/${sample.sample_size} complete`,
    ),
    check(
      `sample coordinates (${sample.sample_size} rows)`,
      sample.sample_size > 0 && sample.with_location === sample.sample_size,
      `${sample.with_location}/${sample.sample_size} with location`,
    ),
    check(
      `sample search text (${sample.sample_size} rows)`,
      sample.sample_size > 0 &&
        sample.indexed_name === sample.sample_size &&
        sample.indexed_neighborhood === sample.sample_size &&
        sample.indexed_district === sample.sample_size &&
        sample.known_cuisine === sample.sample_size,
      `name=${sample.indexed_name}, neighborhood=${sample.indexed_neighborhood}, district=${sample.indexed_district}, cuisine=${sample.known_cuisine}`,
    ),
  ];

  const result = {
    generatedAt: new Date().toISOString(),
    sampleSize: sample.sample_size,
    totals: {
      total: totals.total,
      active: totals.active,
      approved: totals.approved,
      synthetic: totals.synthetic,
      locationCoverage: percentage(totals.with_location, totals.active),
      phoneCoverage: percentage(totals.with_phone, totals.active),
      menuCoverage: percentage(totals.with_menu, totals.active),
      openingHoursCoverage: percentage(
        totals.with_opening_hours,
        totals.active,
      ),
      closedDaysCoverage: percentage(totals.with_closed_days, totals.active),
    },
    checks,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("서울 데이터 품질 점검");
    console.log(
      `활성 지점 ${result.totals.active.toLocaleString("ko-KR")}곳 · 승인 출처 ${result.totals.approved.toLocaleString("ko-KR")}곳 · 합성 ${result.totals.synthetic.toLocaleString("ko-KR")}곳`,
    );
    console.log(
      `좌표 ${result.totals.locationCoverage}% · 전화 ${result.totals.phoneCoverage}% · 메뉴 ${result.totals.menuCoverage}% · 영업시간 ${result.totals.openingHoursCoverage}%`,
    );
    for (const item of checks) {
      console.log(
        `${item.passed ? "PASS" : "FAIL"} ${item.name} — ${item.detail}`,
      );
    }
  }

  if (checks.some((item) => !item.passed)) process.exitCode = 1;
} finally {
  await sql.end();
}
