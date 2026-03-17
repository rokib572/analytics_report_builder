import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const createOrderLineItem = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _data: unknown,
) => {
  // TODO: implement — verify order's locationId belongs to customerId before insert
}
