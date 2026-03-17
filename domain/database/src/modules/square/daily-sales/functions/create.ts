import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const upsertDailySales = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _data: unknown,
) => {
  // TODO: implement — INSERT ... ON CONFLICT (location_id, sale_date) DO UPDATE
  // Verify locationId belongs to customerId before upsert
}
