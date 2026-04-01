import { bigint, index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"

export const payments = coreSchema.table(
  "payments",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    orderId: varchar("order_id", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull(),
    sourceType: varchar("source_type", { length: 50 }),
    amountMoney: bigint("amount_money", { mode: "bigint" }),
    tipMoney: bigint("tip_money", { mode: "bigint" }),
    totalMoney: bigint("total_money", { mode: "bigint" }),
    appFeeMoney: bigint("app_fee_money", { mode: "bigint" }),
    refundedMoney: bigint("refunded_money", { mode: "bigint" }),
    processingFeeMoney: bigint("processing_fee_money", { mode: "bigint" }),
    cardBrand: varchar("card_brand", { length: 50 }),
    cardLast4: varchar("card_last4", { length: 4 }),
    cardEntryMethod: varchar("card_entry_method", { length: 50 }),
    riskLevel: varchar("risk_level", { length: 50 }),
    squareCustomerId: varchar("square_customer_id", { length: 255 }),
    teamMemberId: varchar("team_member_id", { length: 255 }),
    deviceId: varchar("device_id", { length: 255 }),
    applicationId: varchar("application_id", { length: 255 }),
    receiptUrl: varchar("receipt_url", { length: 500 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [
    index("payments_location_date_idx").on(t.locationId, t.createdAt),
    index("payments_customer_id_idx").on(t.customerId),
    index("payments_order_id_idx").on(t.orderId),
    index("payments_square_customer_id_idx").on(t.squareCustomerId),
  ],
)

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectPaymentSchema = createSelectSchema(payments)

export type PaymentPayload = ReturnType<typeof insertPaymentSchema.parse>
export type PaymentDto = ReturnType<typeof selectPaymentSchema.parse>
