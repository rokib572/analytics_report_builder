import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export async function findWebhookLogByEventId(_db: PostgresJsDatabase, _eventId: string) {
  // TODO: implement — used for idempotency check
}
