import { randomBytes } from "node:crypto";

const PUBLIC_ID_PATTERN = /^(br|cand|evt|rv|rr)_[A-Za-z0-9_-]{16,32}$/;

export type PublicIdPrefix = "br" | "cand" | "evt" | "rv" | "rr";

export function createUuidV7(now = Date.now()): string {
  if (!Number.isSafeInteger(now) || now < 0 || now > 0xffffffffffff) {
    throw new RangeError(
      "UUIDv7 timestamp must be an unsigned 48-bit integer.",
    );
  }

  const bytes = randomBytes(16);
  let timestamp = BigInt(now);

  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(timestamp & 0xffn);
    timestamp >>= 8n;
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

export function createPublicId(prefix: PublicIdPrefix): string {
  return `${prefix}_${randomBytes(15).toString("base64url")}`;
}

export function isPublicId(value: string): boolean {
  return PUBLIC_ID_PATTERN.test(value);
}
