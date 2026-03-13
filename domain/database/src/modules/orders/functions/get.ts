import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const getOrder = async (_db: PostgresJsDatabase, _customerId: string, _id: string) => {
  // TODO: implement — join locations to verify customerId ownership
}
