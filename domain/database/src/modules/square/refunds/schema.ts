import { bigint, boolean, index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"

export const refunds = coreSchema.table(
  "refunds",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    paymentId: varchar("payment_id", { length: 255 }),
    orderId: varchar("order_id", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull(),
    amountMoney: bigint("amount_money", { mode: "bigint" }).notNull(),
    appFeeMoney: bigint("app_fee_money", { mode: "bigint" }),
    processingFeeMoney: bigint("processing_fee_money", { mode: "bigint" }),
    reason: varchar("reason", { length: 500 }),
    destinationType: varchar("destination_type", { length: 50 }),
    unlinked: boolean("unlinked").notNull().default(false),
    teamMemberId: varchar("team_member_id", { length: 255 }),
    squareCustomerId: varchar("square_customer_id", { length: 255 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [
    index("refunds_location_date_idx").on(t.locationId, t.createdAt),
    index("refunds_customer_id_idx").on(t.customerId),
    index("refunds_payment_id_idx").on(t.paymentId),
    index("refunds_order_id_idx").on(t.orderId),
  ],
)

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectRefundSchema = createSelectSchema(refunds)

export type RefundPayload = ReturnType<typeof insertRefundSchema.parse>
export type RefundDto = ReturnType<typeof selectRefundSchema.parse>
