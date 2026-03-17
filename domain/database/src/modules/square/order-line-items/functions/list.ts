import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const listOrderLineItems = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _orderId: string,
) => {
  // TODO: implement — join orders → locations to verify customerId ownership
}
