const baseUrl = (
  process.env.DORAK_VERIFY_BASE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
const sampleArgument = process.argv.find((value) =>
  value.startsWith("--sample-size="),
);
const jsonOutput = process.argv.includes("--json");
const sampleSize = sampleArgument
  ? Number(sampleArgument.slice("--sample-size=".length))
  : 100;
const expectedMode = process.env.DORAK_VERIFY_EXPECTED_MODE ?? "postgres";
const requireRealData = expectedMode === "postgres";
const opsRequired = process.env.DORAK_VERIFY_OPS_REQUIRED === "true";
const protectionBypass = process.env.DORAK_VERIFY_PROTECTION_BYPASS;
const opsUsername = process.env.DORAK_VERIFY_OPS_USERNAME;
const opsPassword = process.env.DORAK_VERIFY_OPS_PASSWORD;

if (!Number.isInteger(sampleSize) || sampleSize < 1 || sampleSize > 1000) {
  throw new Error("--sample-size must be an integer between 1 and 1000.");
}

const defaultHeaders = {
  Accept: "application/json",
  ...(protectionBypass
    ? { "x-vercel-protection-bypass": protectionBypass }
    : {}),
};

function branchPath(publicId) {
  return `/api/v1/branches/${encodeURIComponent(publicId)}`;
}

async function requestJson(path, init = {}) {
  const response = await fetch(new URL(path, `${baseUrl}/`), {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${path} returned a non-JSON response`);
  }
}

async function mapWithConcurrency(values, worker, concurrency = 8) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function consume() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, consume),
  );
  return results;
}

function check(name, passed, detail, skipped = false) {
  return { name, passed, detail, skipped };
}

function validateBranch(branch, index) {
  const issues = [];
  const requiredFields = [
    "publicId",
    "name",
    "neighborhood",
    "district",
    "address",
    "cuisine",
    "shortDescription",
    "priceBand",
  ];
  if (requireRealData) requiredFields.push("provenance", "sourceName");

  for (const field of requiredFields) {
    if (typeof branch?.[field] !== "string" || branch[field].trim() === "") {
      issues.push(`${index + 1}:${field}`);
    }
  }

  if (requireRealData && branch?.provenance !== "approved_source") {
    issues.push(`${index + 1}:provenance`);
  }
  if (
    requireRealData &&
    (!Number.isFinite(branch?.latitude) ||
      branch.latitude < 33 ||
      branch.latitude > 39)
  ) {
    issues.push(`${index + 1}:latitude`);
  }
  if (
    requireRealData &&
    (!Number.isFinite(branch?.longitude) ||
      branch.longitude < 124 ||
      branch.longitude > 132)
  ) {
    issues.push(`${index + 1}:longitude`);
  }

  return issues;
}

function summarizeIssues(issues) {
  return issues.length === 0
    ? "none"
    : `${issues.length} issue(s): ${issues.slice(0, 8).join(", ")}`;
}

const checks = [];
let sampleBranches = [];

try {
  const health = await requestJson("/api/health");
  checks.push(
    check(
      "health",
      health.data?.status === "ok" && health.data?.dataMode === expectedMode,
      `status=${health.data?.status}, dataMode=${health.data?.dataMode}, expected=${expectedMode}`,
    ),
  );

  const pages = [];
  for (let offset = 0; offset < sampleSize; offset += 20) {
    const limit = Math.min(20, sampleSize - offset);
    pages.push(
      await requestJson(
        `/api/v1/branches?limit=${limit}&offset=${offset}&sort=default`,
      ),
    );
  }

  sampleBranches = pages.flatMap((page) => page.data ?? []);
  const totals = pages.map((page) => page.meta?.total);
  const modes = pages.map((page) => page.meta?.dataMode);
  checks.push(
    check(
      "sample pagination",
      sampleBranches.length === sampleSize &&
        totals.every((total) => Number.isInteger(total) && total >= sampleSize),
      `${sampleBranches.length}/${sampleSize} rows, total=${totals[0] ?? "unknown"}`,
    ),
  );
  checks.push(
    check(
      "sample data mode",
      modes.every((mode) => mode === expectedMode),
      `modes=${[...new Set(modes)].join(",") || "none"}`,
    ),
  );

  const fieldIssues = sampleBranches.flatMap(validateBranch);
  checks.push(
    check(
      "sample branch fields",
      sampleBranches.length === sampleSize && fieldIssues.length === 0,
      summarizeIssues(fieldIssues),
    ),
  );

  const publicIds = new Set(sampleBranches.map((branch) => branch.publicId));
  checks.push(
    check(
      "sample public ids unique",
      publicIds.size === sampleBranches.length,
      `${publicIds.size}/${sampleBranches.length} unique publicId(s)`,
    ),
  );

  const detailResults = await mapWithConcurrency(
    sampleBranches,
    async (branch) => {
      try {
        const detail = await requestJson(branchPath(branch.publicId));
        const result = detail.data;
        return result?.publicId === branch.publicId &&
          result.name === branch.name &&
          (!requireRealData ||
            (result.provenance === "approved_source" &&
              Number.isFinite(result.latitude) &&
              Number.isFinite(result.longitude)))
          ? undefined
          : "detail payload mismatch";
      } catch (error) {
        return error instanceof Error ? error.message : "detail request failed";
      }
    },
  );
  const detailIssues = detailResults.filter(Boolean);
  checks.push(
    check(
      `sample detail (${sampleBranches.length} rows)`,
      sampleBranches.length === sampleSize && detailIssues.length === 0,
      `${sampleBranches.length - detailIssues.length}/${sampleBranches.length} detail responses valid${detailIssues.length ? `; ${summarizeIssues(detailIssues)}` : ""}`,
    ),
  );

  const searchResults = await mapWithConcurrency(
    sampleBranches,
    async (branch) => {
      const query = `${branch.name} ${branch.neighborhood}`.slice(0, 100);
      try {
        const search = await requestJson(
          `/api/v1/branches?q=${encodeURIComponent(query)}&limit=20`,
        );
        return search.data?.some(
          (result) => result.publicId === branch.publicId,
        )
          ? undefined
          : "search result missing publicId";
      } catch (error) {
        return error instanceof Error ? error.message : "search request failed";
      }
    },
  );
  const searchIssues = searchResults.filter(Boolean);
  checks.push(
    check(
      `sample search (${sampleBranches.length} rows)`,
      sampleBranches.length === sampleSize && searchIssues.length === 0,
      `${sampleBranches.length - searchIssues.length}/${sampleBranches.length} search responses matched${searchIssues.length ? `; ${summarizeIssues(searchIssues)}` : ""}`,
    ),
  );
} catch (error) {
  checks.push(
    check(
      "public API requests",
      false,
      error instanceof Error ? error.message : "request failed",
    ),
  );
}

if (opsRequired) {
  if (!opsUsername || !opsPassword) {
    checks.push(
      check(
        "operations queue",
        false,
        "DORAK_VERIFY_OPS_USERNAME and DORAK_VERIFY_OPS_PASSWORD are required",
      ),
    );
  } else {
    try {
      const operations = await requestJson("/api/v1/ops/candidates", {
        headers: {
          Authorization: `Basic ${Buffer.from(`${opsUsername}:${opsPassword}`).toString("base64")}`,
        },
      });
      checks.push(
        check(
          "operations queue",
          Array.isArray(operations.data) &&
            operations.meta?.dataMode === expectedMode,
          `${operations.data?.length ?? 0} candidate(s), dataMode=${operations.meta?.dataMode}`,
        ),
      );
    } catch (error) {
      checks.push(
        check(
          "operations queue",
          false,
          error instanceof Error
            ? error.message
            : "operations queue request failed",
        ),
      );
    }
  }
} else {
  checks.push(
    check(
      "operations queue",
      true,
      "skipped; set DORAK_VERIFY_OPS_REQUIRED=true with ops credentials to verify",
      true,
    ),
  );
}

const result = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  sampleSize,
  checks,
};

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`서울 데이터 HTTP 검증 · ${baseUrl}`);
  for (const item of checks) {
    console.log(
      `${item.skipped ? "SKIP" : item.passed ? "PASS" : "FAIL"} ${item.name} — ${item.detail}`,
    );
  }
}

if (checks.some((item) => !item.passed && !item.skipped)) process.exitCode = 1;
