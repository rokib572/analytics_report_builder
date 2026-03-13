import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const removeSavedReport = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _id: string,
) => {
  // TODO: implement — filter by customerId AND id
}
