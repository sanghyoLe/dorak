import postgres from "postgres";

import { discoverMigrations, stripTransactionWrapper } from "./migrations.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example or pass it explicitly.",
  );
}

const client = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  onnotice: () => undefined,
});

try {
  await client`SELECT pg_advisory_lock(hashtext('dorak_schema_migrations'))`;
  await client.unsafe("CREATE SCHEMA IF NOT EXISTS platform");
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS platform.schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migrations = await discoverMigrations();
  for (const migration of migrations) {
    const existing = await client<{ checksum: string }[]>`
      SELECT checksum
      FROM platform.schema_migrations
      WHERE name = ${migration.name}
    `;

    if (existing[0]) {
      if (existing[0].checksum !== migration.checksum) {
        throw new Error(
          `Applied migration checksum changed: ${migration.name}`,
        );
      }
      console.log(`skip ${migration.name}`);
      continue;
    }

    const body = stripTransactionWrapper(migration.sql);
    await client.begin(async (transaction) => {
      await transaction.unsafe(body);
      await transaction`
        INSERT INTO platform.schema_migrations (name, checksum)
        VALUES (${migration.name}, ${migration.checksum})
      `;
    });
    console.log(`apply ${migration.name}`);
  }
} finally {
  await client`SELECT pg_advisory_unlock(hashtext('dorak_schema_migrations'))`.catch(
    () => undefined,
  );
  await client.end();
}
