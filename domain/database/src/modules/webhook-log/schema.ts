import { varchar, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core"
import { auditSchema, primaryKey } from "../../db/base"

export const webhookLog = auditSchema.table(
  "webhook_log",
  {
    id: primaryKey(),
    eventId: varchar("event_id", { length: 255 }).notNull().unique(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    merchantId: varchar("merchant_id", { length: 255 }),
    locationId: varchar("location_id", { length: 255 }),
    orderId: varchar("order_id", { length: 255 }),
    signatureValid: boolean("signature_valid").notNull(),
    processed: boolean("processed").notNull().default(false),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
  },
  (t) => [index("webhook_event_id_idx").on(t.eventId)],
)
