import assert from "node:assert/strict";

const baseUrl = process.env.DORAK_SMOKE_BASE_URL ?? "http://localhost:3000";
const baseOrigin = new URL(baseUrl).origin;
const expectedDataMode = process.env.DORAK_SMOKE_DATA_MODE ?? "postgres";
const branchPublicId = "br_L3nF8wQ2cV6jH9pB4sYk";

async function request(path, init) {
  return fetch(new URL(path, baseUrl), init);
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await request("/api/health");
      if (response.ok) return response.json();
      lastError = new Error(`health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw lastError ?? new Error("server did not become ready");
}

function opsAuthorizationHeader() {
  const username = process.env.DORAK_OPS_USERNAME;
  const password = process.env.DORAK_OPS_PASSWORD;
  if (!username || !password) return {};

  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  };
}

const health = await waitForServer();
assert.equal(health.data.status, "ok");
assert.equal(health.data.dataMode, expectedDataMode);

if (process.env.DORAK_EXPECT_OPS_AUTH === "true") {
  const unauthenticatedOps = await request("/api/v1/ops/candidates");
  assert.equal(unauthenticatedOps.status, 401);

  const authenticatedOps = await request("/api/v1/ops/candidates", {
    headers: opsAuthorizationHeader(),
  });
  assert.equal(authenticatedOps.status, 200);
}

const searchResponse = await request(
  `/api/v1/branches?q=${encodeURIComponent("숯불")}`,
);
assert.equal(searchResponse.status, 200);
const search = await searchResponse.json();
assert.equal(search.meta.dataMode, expectedDataMode);
assert.ok(search.data.some((branch) => branch.publicId === branchPublicId));

const beforeResponse = await request(`/api/v1/branches/${branchPublicId}`);
assert.equal(beforeResponse.status, 200);
const before = (await beforeResponse.json()).data;

const reviewsResponse = await request(
  `/api/v1/branches/${branchPublicId}/reviews`,
);
assert.equal(reviewsResponse.status, 200);

const reviewPayload = {
  usageType: "delivery",
  authorName: "배포점검자",
  rating: 5,
  body: "자동 배포 점검을 위해 직접 방문했다고 가정한 충분한 길이의 테스트 리뷰입니다.",
  visitedOn: "2026-09-01",
  visitAttested: true,
  independentVisitAttested: true,
  website: "",
};

const crossSiteResponse = await request(
  `/api/v1/branches/${branchPublicId}/reviews`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://untrusted.invalid",
    },
    body: JSON.stringify(reviewPayload),
  },
);
assert.equal(crossSiteResponse.status, 403);

for (const usageType of [undefined, null, "unknown", "invalid"]) {
  const rejected = await request(`/api/v1/branches/${branchPublicId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseOrigin },
    body: JSON.stringify({ ...reviewPayload, usageType }),
  });
  assert.equal(rejected.status, 422);
  assert.equal((await rejected.json()).error.code, "INVALID_USAGE_TYPE");
}

for (const independentVisitAttested of [undefined, false, "true"]) {
  const rejected = await request(`/api/v1/branches/${branchPublicId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseOrigin },
    body: JSON.stringify({ ...reviewPayload, independentVisitAttested }),
  });
  assert.equal(rejected.status, 422);
  assert.equal(
    (await rejected.json()).error.code,
    "INDEPENDENT_VISIT_REQUIRED",
  );
}

const createResponse = await request(
  `/api/v1/branches/${branchPublicId}/reviews`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseOrigin },
    body: JSON.stringify(reviewPayload),
  },
);
const createBody = await createResponse.text();
assert.equal(
  createResponse.status,
  201,
  `review creation returned ${createResponse.status}: ${createBody}`,
);
const created = JSON.parse(createBody).data;
assert.equal(created.identityVerified, false);
assert.equal(created.visitVerification, "self_reported");
assert.equal(created.independentVisitAttested, true);
assert.equal(created.usageType, "delivery");

const duplicateResponse = await request(
  `/api/v1/branches/${branchPublicId}/reviews`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseOrigin },
    body: JSON.stringify(reviewPayload),
  },
);
assert.equal(duplicateResponse.status, 409);

const afterCreateResponse = await request(`/api/v1/branches/${branchPublicId}`);
assert.equal(afterCreateResponse.status, 200);
const afterCreate = (await afterCreateResponse.json()).data;
assert.equal(afterCreate.reviewCount, before.reviewCount + 1);

const crossSiteHideResponse = await request(
  `/api/v1/ops/reviews/${created.publicId}/hide`,
  {
    method: "POST",
    headers: {
      ...opsAuthorizationHeader(),
      Origin: "https://untrusted.invalid",
    },
  },
);
assert.equal(crossSiteHideResponse.status, 403);

const hideResponse = await request(
  `/api/v1/ops/reviews/${created.publicId}/hide`,
  {
    method: "POST",
    headers: { ...opsAuthorizationHeader(), Origin: baseOrigin },
  },
);
assert.equal(hideResponse.status, 200);

const afterHideResponse = await request(`/api/v1/branches/${branchPublicId}`);
assert.equal(afterHideResponse.status, 200);
const afterHide = (await afterHideResponse.json()).data;
assert.equal(afterHide.reviewCount, before.reviewCount);

process.stdout.write(
  "HTTP smoke passed: search, review trust rules, moderation\n",
);
