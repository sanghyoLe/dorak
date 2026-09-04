import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export interface MigrationFile {
  name: string;
  checksum: string;
  sql: string;
}

const DEFAULT_MIGRATION_DIRECTORY = fileURLToPath(
  new URL("../../../db/migrations/", import.meta.url),
);

export function migrationChecksum(contents: string): string {
  return createHash("sha256").update(contents).digest("hex");
}

export function stripTransactionWrapper(contents: string): string {
  const withoutBegin = contents.replace(/^\s*BEGIN;\s*/i, "");
  return withoutBegin.replace(/\s*COMMIT;\s*$/i, "").trim();
}

export async function discoverMigrations(
  directory = DEFAULT_MIGRATION_DIRECTORY,
): Promise<MigrationFile[]> {
  const names = (await readdir(directory))
    .filter((name) => /^\d{6}_[a-z0-9_]+\.sql$/.test(name))
    .sort();

  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(new URL(name, `file://${directory}/`), "utf8");
      return { name, sql, checksum: migrationChecksum(sql) };
    }),
  );
}
