import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export const findWebhookLogByEventId = async (
  _db: PostgresJsDatabase,
  _customerId: string,
  _eventId: string,
) => {
  // TODO: implement — used for idempotency check, filter by customerId
}
