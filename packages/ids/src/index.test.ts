import { describe, expect, it } from "vitest";

import { createPublicId, createUuidV7, isPublicId } from "./index.js";

describe("createUuidV7", () => {
  it("encodes the version and variant bits", () => {
    const id = createUuidV7(1_788_278_400_000);

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("sorts by timestamp for distinct milliseconds", () => {
    expect(createUuidV7(10_000) < createUuidV7(10_001)).toBe(true);
  });
});

describe("public IDs", () => {
  it("creates opaque prefixed identifiers", () => {
    const id = createPublicId("br");
    const reviewId = createPublicId("rv");
    const reportId = createPublicId("rr");

    expect(id.startsWith("br_")).toBe(true);
    expect(isPublicId(id)).toBe(true);
    expect(reviewId.startsWith("rv_")).toBe(true);
    expect(isPublicId(reviewId)).toBe(true);
    expect(reportId.startsWith("rr_")).toBe(true);
    expect(isPublicId(reportId)).toBe(true);
  });

  it("rejects identifiers with unsupported prefixes", () => {
    expect(isPublicId("user_1234567890123456")).toBe(false);
  });
});
