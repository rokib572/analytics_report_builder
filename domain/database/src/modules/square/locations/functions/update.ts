import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const updateLocation = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _id: string,
  _data: unknown,
) => {
  // TODO: implement — filter by customerId AND id
}
