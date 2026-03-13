import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const createOrder = async (_db: PostgresJsDatabase, _customerId: string, _data: unknown) => {
  // TODO: implement — verify locationId belongs to customerId before insert
}
