import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const sourceKey = "seoul.localdata.general_restaurant";
const sourceDisplayName = "서울시 일반음식점 인허가 정보";
const cliArguments = process.argv.slice(2);
const useApi = cliArguments.includes("--api");
const skipRawDocuments = cliArguments.includes("--skip-raw");
const csvPath = cliArguments.find((value) => !value.startsWith("--"));
const limitArgument = cliArguments.find((value) =>
  value.startsWith("--limit="),
);
const batchSizeArgument = cliArguments.find((value) =>
  value.startsWith("--batch-size="),
);
const limit = limitArgument
  ? Number(limitArgument.slice("--limit=".length))
  : useApi
    ? 1000
    : Infinity;
const batchSize = batchSizeArgument
  ? Number(batchSizeArgument.slice("--batch-size=".length))
  : 500;

if (!databaseUrl) throw new Error("DATABASE_URL is required.");
if (!csvPath && !useApi) {
  throw new Error(
    "CSV 경로 또는 --api가 필요합니다. 예: pnpm data:import:seoul ./data/seoul-restaurants.csv --limit=1000",
  );
}
if (useApi && !process.env.SEOUL_OPEN_DATA_KEY) {
  throw new Error("--api 사용 시 SEOUL_OPEN_DATA_KEY가 필요합니다.");
}
if (limit !== Infinity && (!Number.isFinite(limit) || limit < 1)) {
  throw new Error("--limit must be a positive number.");
}
if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
  throw new Error("--batch-size must be an integer between 1 and 1000.");
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function value(row, aliases) {
  for (const alias of aliases) {
    const candidate = row[alias];
    if (candidate !== undefined && candidate.trim() !== "")
      return candidate.trim();
  }
  return "";
}

function toNumber(valueToParse) {
  const parsed = Number(valueToParse.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toTimestamp(valueToParse) {
  if (!valueToParse) return null;
  const compact = valueToParse.replace(/[^0-9]/g, "");
  const normalized = /^\d{14}$/.test(compact)
    ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(8, 10)}:${compact.slice(10, 12)}:${compact.slice(12, 14)}+09:00`
    : /^\d{8}$/.test(compact)
      ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T00:00:00+09:00`
      : valueToParse;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toWebsiteUrl(valueToParse) {
  const raw = valueToParse.trim();
  if (!raw) return null;

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function cuisineKey(label) {
  if (/일식|횟집|초밥/.test(label)) return "japanese";
  if (/중식|중국/.test(label)) return "chinese";
  if (/양식|경양식|패밀리/.test(label)) return "western";
  if (/카페|다방|커피|디저트/.test(label)) return "cafe";
  if (/분식|국수|냉면|면/.test(label)) return "noodle";
  return "korean";
}

function districtFrom(address) {
  return address.match(/([가-힣]+구)/)?.[1] ?? "서울시";
}

function neighborhoodFrom(address, district) {
  const withoutDistrict = address.replace(district, "");
  const parenthetical = withoutDistrict.match(/\(([^)]*)\)/)?.[1] ?? "";
  const parentNeighborhood = parenthetical.match(/([가-힣0-9]+(?:동|가))/)?.[1];
  return (
    parentNeighborhood ??
    withoutDistrict.match(/([가-힣0-9]+(?:동|가))/)?.[1] ??
    withoutDistrict.match(/([가-힣0-9]+(?:로|길))/)?.[1] ??
    district
  );
}

function stablePublicId(prefix, recordId) {
  const digest = createHash("sha256")
    .update(`${sourceKey}:${recordId}`)
    .digest("base64url");
  return `${prefix}_${digest.slice(0, 22)}`;
}

async function loadApiRecords(apiKey, maxRecords) {
  const records = [];
  let start = 1;
  let total = Infinity;

  while (start <= total && records.length < maxRecords) {
    const end = Math.min(start + 999, start + maxRecords - records.length - 1);
    const response = await fetch(
      `http://openapi.seoul.go.kr:8088/${encodeURIComponent(apiKey)}/json/LOCALDATA_072404/${start}/${end}/`,
    );
    if (!response.ok) {
      throw new Error(`서울 Open API 요청 실패: HTTP ${response.status}`);
    }
    const body = await response.json();
    const payload = body.LOCALDATA_072404;
    if (!payload || !Array.isArray(payload.row)) break;
    total =
      Number(payload.list_total_count) || records.length + payload.row.length;
    records.push(...payload.row);
    if (payload.row.length === 0 || records.length >= total) break;
    start = end + 1;
  }
  return records.slice(0, maxRecords);
}

async function* readCsvRecords(filePath) {
  const stream = createReadStream(filePath);
  const decoder = new TextDecoder("euc-kr");
  let current = "";
  let quoted = false;
  let headers;

  const emit = (line) => {
    const fields = parseCsv(line)[0];
    if (!fields) return null;
    if (!headers) {
      headers = fields.map((header) => header.replace(/^\uFEFF/, "").trim());
      return null;
    }
    return Object.fromEntries(
      headers.map((header, index) => [header, fields[index] ?? ""]),
    );
  };

  for await (const chunk of stream) {
    const text = decoder.decode(chunk, { stream: true });
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      const next = text[index + 1];
      if (character === '"') {
        if (quoted && next === '"') {
          current += '""';
          index += 1;
          continue;
        }
        quoted = !quoted;
      }
      current += character;
      if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && next === "\n") index += 1;
        const record = emit(current);
        current = "";
        if (record) yield record;
      }
    }
  }

  current += decoder.decode();
  if (current.trim()) {
    const record = emit(current);
    if (record) yield record;
  }
}

const records = useApi
  ? await loadApiRecords(process.env.SEOUL_OPEN_DATA_KEY, limit)
  : readCsvRecords(csvPath);

const database = postgres(databaseUrl, { max: 1, connect_timeout: 10 });
let imported = 0;
let skipped = 0;

function normalizeRecord(record) {
  const recordId = value(record, ["MGTNO", "관리번호"]);
  const serviceName = value(record, ["SERVICE", "개방서비스명"]);
  const name = value(record, ["BPLCNM", "사업장명"]);
  const status = value(record, ["TRDSTATENM", "영업상태명"]);
  const address =
    value(record, ["RDNWHLADDR", "도로명전체주소", "도로명주소"]) ||
    value(record, ["SITEWHLADDR", "소재지전체주소", "지번주소"]);
  if (
    !recordId ||
    !name ||
    !address ||
    (serviceName && !/일반음식점/.test(serviceName)) ||
    (status && !/영업|정상/.test(status))
  ) {
    return null;
  }

  const cuisineLabel = value(record, ["UPTAENM", "업태구분명", "위생업태명"]);
  const phone = value(record, ["SITETEL", "전화번호"]);
  const addressDistrict = districtFrom(address);
  const sourceUpdatedAt = toTimestamp(
    value(record, ["UPDATEDT", "데이터갱신일자", "LASTMODTS", "최종수정일자"]),
  );
  const normalized = {
    recordId,
    publicId: stablePublicId("br", recordId),
    name,
    neighborhood: neighborhoodFrom(address, addressDistrict),
    district: addressDistrict,
    address,
    phone: phone || null,
    websiteUrl: toWebsiteUrl(value(record, ["HOMEPAGE", "홈페이지"])),
    cuisineKey: cuisineKey(cuisineLabel),
    shortDescription: `서울시 인허가 데이터에 등록된 ${cuisineLabel || "일반"} 음식점`,
    x: toNumber(value(record, ["X", "좌표정보(X)", "좌표정보(x)"])),
    y: toNumber(value(record, ["Y", "좌표정보(Y)", "좌표정보(y)"])),
    sourceUpdatedAt,
  };

  if (!skipRawDocuments) {
    const payload = JSON.stringify(record);
    normalized.payload = payload;
    normalized.payloadChecksum = createHash("sha256")
      .update(payload)
      .digest("hex");
  }
  return normalized;
}

async function flushBatch(sourceId, batch) {
  if (batch.length === 0) return;

  await database.begin(async (transaction) => {
    if (!skipRawDocuments) {
      const rawParams = [];
      const rawValues = batch.map((item, index) => {
        const base = index * 4;
        rawParams.push(
          sourceId,
          item.recordId,
          item.payload,
          item.payloadChecksum,
        );
        return `($${base + 1}::uuid, $${base + 2}::text, $${base + 3}::jsonb, $${base + 4}::text, now())`;
      });
      await transaction.unsafe(
        `
          INSERT INTO ingestion.raw_documents (
            source_id,
            source_record_id,
            payload,
            payload_sha256,
            fetched_at
          ) VALUES ${rawValues.join(",")}
          ON CONFLICT (source_id, source_record_id, payload_sha256) DO UPDATE
          SET fetched_at = EXCLUDED.fetched_at
        `,
        rawParams,
      );
    }

    const branchParams = [];
    const branchValues = batch.map((item, index) => {
      const base = index * 14;
      branchParams.push(
        item.publicId,
        item.name,
        item.neighborhood,
        item.district,
        item.address,
        item.phone,
        item.websiteUrl,
        item.cuisineKey,
        item.shortDescription,
        2,
        item.x,
        item.y,
        item.recordId,
        item.sourceUpdatedAt,
      );
      return `(
        $${base + 1}::text,
        $${base + 2}::text,
        $${base + 3}::text,
        $${base + 4}::text,
        $${base + 5}::text,
        $${base + 6}::text,
        $${base + 7}::text,
        $${base + 8}::text,
        $${base + 9}::text,
        $${base + 10}::smallint,
        $${base + 11}::double precision,
        $${base + 12}::double precision,
        $${base + 13}::text,
        $${base + 14}::timestamptz
      )`;
    });
    await transaction.unsafe(
      `
        INSERT INTO catalog.branches (
          public_id,
          name,
          neighborhood,
          district,
          road_address,
          phone,
          website_url,
          cuisine_key,
          short_description,
          price_band,
          location,
          provenance,
          source_key,
          source_record_id,
          source_updated_at,
          last_verified_at
        )
        SELECT
          incoming.public_id,
          incoming.name,
          incoming.neighborhood,
          incoming.district,
          incoming.road_address,
          incoming.phone,
          incoming.website_url,
          incoming.cuisine_key,
          incoming.short_description,
          incoming.price_band,
          CASE
            WHEN incoming.x IS NULL OR incoming.y IS NULL THEN NULL
            ELSE ST_Transform(
              ST_SetSRID(ST_MakePoint(incoming.x, incoming.y), 5174),
              4326
            )::geography
          END,
          'approved_source',
          '${sourceKey}',
          incoming.source_record_id,
          incoming.source_updated_at,
          incoming.source_updated_at
        FROM (VALUES ${branchValues.join(",")}) AS incoming(
          public_id,
          name,
          neighborhood,
          district,
          road_address,
          phone,
          website_url,
          cuisine_key,
          short_description,
          price_band,
          x,
          y,
          source_record_id,
          source_updated_at
        )
        ON CONFLICT (source_key, source_record_id) DO UPDATE
        SET name = EXCLUDED.name,
            neighborhood = EXCLUDED.neighborhood,
            district = EXCLUDED.district,
            road_address = EXCLUDED.road_address,
            phone = EXCLUDED.phone,
            website_url = EXCLUDED.website_url,
            cuisine_key = EXCLUDED.cuisine_key,
            short_description = EXCLUDED.short_description,
            location = EXCLUDED.location,
            source_updated_at = EXCLUDED.source_updated_at,
            last_verified_at = EXCLUDED.last_verified_at,
            status = 'active',
            updated_at = now()
      `,
      branchParams,
    );
  });

  imported += batch.length;
  console.log(`서울 음식점 반영 중: ${imported}건, ${skipped}건 건너뜀`);
}

try {
  const [source] = await database`
    INSERT INTO ingestion.sources (source_key, display_name, provenance)
    VALUES (${sourceKey}, ${sourceDisplayName}, 'approved_source')
    ON CONFLICT (source_key) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        provenance = EXCLUDED.provenance,
        is_enabled = true
    RETURNING id::text
  `;
  if (!source) throw new Error("서울 데이터 출처를 등록하지 못했습니다.");

  console.log(
    `서울 음식점 가져오기 시작: 배치 ${batchSize}건, 원본 JSON ${skipRawDocuments ? "생략" : "보관"}`,
  );
  let batch = [];
  for await (const record of records) {
    if (imported + batch.length >= limit) break;
    const normalized = normalizeRecord(record);
    if (!normalized) {
      skipped += 1;
      continue;
    }

    batch.push(normalized);
    if (batch.length >= batchSize) {
      await flushBatch(source.id, batch);
      batch = [];
    }
  }
  await flushBatch(source.id, batch);
} finally {
  await database.end();
}

console.log(
  `서울 음식점 가져오기 완료: ${imported}건 반영, ${skipped}건 건너뜀`,
);
