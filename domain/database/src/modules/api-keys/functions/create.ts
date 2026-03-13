import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const createApiKey = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _data: unknown,
) => {
  // TODO: implement — set customerId on insert
}
