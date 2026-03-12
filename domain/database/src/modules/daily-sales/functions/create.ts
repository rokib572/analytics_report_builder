import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export async function upsertDailySales(_db: PostgresJsDatabase, _data: unknown) {
  // TODO: implement — INSERT ... ON CONFLICT (location_id, sale_date) DO UPDATE
}
