import { createReadStream } from "node:fs";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const operationPath =
  process.argv.find(
    (value) => value.endsWith(".csv") && value.includes("operation"),
  ) ?? "./data/import/seoul-restaurant-operation-20230111.csv";
const menuPath =
  process.argv.find(
    (value) => value.endsWith(".csv") && value.includes("menu"),
  ) ?? "./data/import/seoul-menu-korean-20230111.csv";
const externalInfoSource = "seoul.tourism.restaurant-operation-menu";
const externalInfoUpdatedAt = "2023-01-11T00:00:00+09:00";

if (!databaseUrl) throw new Error("DATABASE_URL is required.");

function parseCsvLine(input) {
  const fields = [];
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
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  fields.push(field);
  return fields;
}

async function* readCsvRecords(filePath, encoding) {
  const stream = createReadStream(filePath);
  const decoder = new TextDecoder(encoding);
  let current = "";
  let quoted = false;
  let headers;

  const emit = (line) => {
    const fields = parseCsvLine(line);
    if (!headers) {
      headers = fields.map((header) => header.replace(/^\uFEFF/, "").trim());
      return null;
    }
    return Object.fromEntries(
      headers.map((header, index) => [header, fields[index]?.trim() ?? ""]),
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
        const record = emit(current.replace(/[\r\n]+$/, ""));
        current = "";
        if (record) yield record;
      }
    }
  }

  current += decoder.decode();
  if (current.trim()) {
    const record = emit(current.replace(/[\r\n]+$/, ""));
    if (record) yield record;
  }
}

function value(record, aliases) {
  for (const alias of aliases) {
    const candidate = record[alias];
    if (candidate !== undefined && candidate.trim() !== "")
      return candidate.trim();
  }
  return "";
}

function normalize(valueToNormalize) {
  return valueToNormalize
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function addIndex(index, key, record) {
  if (!key) return;
  const current = index.get(key);
  if (current) {
    if (!current.includes(record)) current.push(record);
  } else {
    index.set(key, [record]);
  }
}

function toWebsiteUrl(valueToParse) {
  if (!valueToParse) return null;
  const first = valueToParse.split(",")[0]?.trim();
  if (!first) return null;
  const candidate = /^https?:\/\//i.test(first) ? first : `https://${first}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function formatPrice(valueToParse) {
  const number = Number(valueToParse.replaceAll(",", "").replace(/원$/u, ""));
  if (!Number.isFinite(number) || number <= 0) return null;
  return `${Math.round(number).toLocaleString("ko-KR")}원`;
}

const operationIndex = new Map();
let operationCount = 0;
for await (const record of readCsvRecords(operationPath, "euc-kr")) {
  const id = value(record, ["식당(ID)", "식당ID"]);
  const name = value(record, ["식당명"]);
  const district = value(record, ["지역명"]);
  if (!id || !name || !district) continue;

  const branch = value(record, ["지점명"]);
  const operation = {
    id,
    name,
    branch,
    district,
    openingHours: value(record, ["영업시간내용"]) || null,
    closedDays: value(record, ["휴무일정보내용"]) || null,
    websiteUrl: toWebsiteUrl(value(record, ["홈페이지(URL)"])),
    representativeMenu: value(record, ["대표메뉴명"]) || null,
  };
  const nameKey = normalize(name);
  const branchKey = normalize(branch);
  const districtKey = normalize(district);
  const variants = new Set([
    nameKey,
    branchKey ? `${nameKey}${branchKey}` : "",
    branchKey ? `${branchKey}${nameKey}` : "",
  ]);
  for (const variant of variants)
    addIndex(operationIndex, `${districtKey}|${variant}`, operation);
  operationCount += 1;
}

const menuByRestaurantId = new Map();
let menuCount = 0;
for await (const record of readCsvRecords(menuPath, "utf-8")) {
  const restaurantId = value(record, ["식당(ID)", "식당ID"]);
  const menuName = value(record, ["메뉴명"]);
  if (!restaurantId || !menuName) continue;

  const price = formatPrice(value(record, ["메뉴가격"]));
  const label = price ? `${menuName} · ${price}` : menuName;
  let entry = menuByRestaurantId.get(restaurantId);
  if (!entry) {
    entry = { items: [], seen: new Set() };
    menuByRestaurantId.set(restaurantId, entry);
  }
  if (!entry.seen.has(label) && entry.items.length < 6) {
    entry.seen.add(label);
    entry.items.push(label);
  }
  menuCount += 1;
}

function findOperation(branch) {
  const districtKey = normalize(branch.district);
  const nameKey = normalize(branch.name);
  const records = operationIndex.get(`${districtKey}|${nameKey}`) ?? [];
  return records.length === 1 ? records[0] : undefined;
}

const database = postgres(databaseUrl, { max: 1, connect_timeout: 10 });
let matched = 0;
let updated = 0;

try {
  const branches = await database`
    SELECT id::text, name, district
    FROM catalog.branches
    WHERE status = 'active'
      AND source_key = 'seoul.localdata.general_restaurant'
  `;

  const updates = [];
  for (const branch of branches) {
    const operation = findOperation(branch);
    if (!operation) continue;
    matched += 1;

    const menuEntry = menuByRestaurantId.get(operation.id);
    const menus = menuEntry?.items ?? [];
    if (menus.length === 0 && operation.representativeMenu)
      menus.push(operation.representativeMenu);
    if (
      menus.length === 0 &&
      !operation.openingHours &&
      !operation.closedDays &&
      !operation.websiteUrl
    )
      continue;

    updates.push({
      id: branch.id,
      menus,
      openingHours: operation.openingHours,
      closedDays: operation.closedDays,
      websiteUrl: operation.websiteUrl,
    });
  }

  await database.begin(async (transaction) => {
    for (let offset = 0; offset < updates.length; offset += 500) {
      const batch = updates.slice(offset, offset + 500);
      const params = [];
      const values = batch.map((item, index) => {
        const base = index * 5;
        params.push(
          item.id,
          item.menus,
          item.openingHours,
          item.closedDays,
          item.websiteUrl,
        );
        return `($${base + 1}::uuid, $${base + 2}::text[], $${base + 3}::text, $${base + 4}::text, $${base + 5}::text)`;
      });

      await transaction.unsafe(
        `
          UPDATE catalog.branches AS branch
          SET signature_menu = CASE
                WHEN cardinality(external.signature_menu) > 0 THEN external.signature_menu
                ELSE branch.signature_menu
              END,
              opening_hours = COALESCE(external.opening_hours, branch.opening_hours),
              closed_days = COALESCE(external.closed_days, branch.closed_days),
              website_url = COALESCE(external.website_url, branch.website_url),
              external_info_source = '${externalInfoSource}',
              external_info_updated_at = '${externalInfoUpdatedAt}'::timestamptz,
              updated_at = now()
          FROM (VALUES ${values.join(",")}) AS external(
            branch_id,
            signature_menu,
            opening_hours,
            closed_days,
            website_url
          )
          WHERE branch.id = external.branch_id
        `,
        params,
      );
      updated += batch.length;
      console.log(`외부 정보 반영 중: ${updated}/${updates.length}`);
    }
  });
} finally {
  await database.end();
}

console.log(
  `서울관광재단 정보 반영 완료: 운영 레코드 ${operationCount}건, 메뉴 ${menuCount}건, 매칭 ${matched}건, 반영 ${updated}건`,
);
