import { describe, expect, it } from "vitest";

import { serializePostgresTimestamp } from "./postgres-catalog.js";

describe("serializePostgresTimestamp", () => {
  it("serializes Date instances", () => {
    expect(
      serializePostgresTimestamp(new Date("2026-09-03T01:02:03.000Z")),
    ).toBe("2026-09-03T01:02:03.000Z");
  });

  it("serializes PostgreSQL timestamp strings", () => {
    expect(serializePostgresTimestamp("2026-09-03T10:02:03+09:00")).toBe(
      "2026-09-03T01:02:03.000Z",
    );
  });

  it("rejects invalid timestamp values", () => {
    expect(() => serializePostgresTimestamp("not-a-timestamp")).toThrow(
      "PostgreSQL returned an invalid timestamp.",
    );
  });
});
