import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const getDailySales = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _locationId: string,
  _date: string,
) => {
  // TODO: implement — join locations to verify customerId ownership
}
