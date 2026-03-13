import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const listPermissions = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _userId: string,
) => {
  // TODO: implement — filter by customerId AND userId
}
