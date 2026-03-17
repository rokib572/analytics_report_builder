import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const listOrders = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _locationId: string,
  _date: string,
) => {
  // TODO: implement — join locations to verify customerId ownership
}
