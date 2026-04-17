import { varchar, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { auditSchema, foreignKey, primaryKey } from "../../db/base"
import { customers } from "../customers/schema"

export const webhookLog = auditSchema.table(
  "webhook_log",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id").references(() => customers.id),
    eventId: varchar("event_id", { length: 255 }).notNull().unique(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    merchantId: varchar("merchant_id", { length: 255 }),
    locationId: varchar("location_id", { length: 255 }),
    orderId: varchar("order_id", { length: 255 }),
    paymentId: varchar("payment_id", { length: 255 }),
    refundId: varchar("refund_id", { length: 255 }),
    signatureValid: boolean("signature_valid").notNull(),
    processed: boolean("processed").notNull().default(false),
    processingResult: varchar("processing_result", { length: 50 }),
    processingError: varchar("processing_error", { length: 1000 }),
    processedAt: timestamp("processed_at"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
  },
  (t) => [index("webhook_event_id_idx").on(t.eventId)],
)

const payloadSchema = z.record(z.string(), z.unknown())

export const insertWebhookLogSchema = createInsertSchema(webhookLog, {
  payload: () => payloadSchema,
}).omit({
  id: true,
  receivedAt: true,
})
export const selectWebhookLogSchema = createSelectSchema(webhookLog, {
  payload: () => payloadSchema,
})

export type WebhookLogPayload = ReturnType<typeof insertWebhookLogSchema.parse>
export type WebhookLogDto = ReturnType<typeof selectWebhookLogSchema.parse>
