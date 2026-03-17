import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const listDailySales = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _locationId: string,
) => {
  // TODO: implement — join locations to verify customerId ownership
}
