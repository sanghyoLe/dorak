import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

export type DorakDatabase = PostgresJsDatabase<typeof schema>;

export interface DatabaseOptions {
  maxConnections?: number;
}

export function createDatabase(
  databaseUrl: string,
  options: DatabaseOptions = {},
) {
  const client = postgres(databaseUrl, {
    max: options.maxConnections ?? 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    db: drizzle(client, { schema }),
    raw: client,
    close: () => client.end(),
  };
}
