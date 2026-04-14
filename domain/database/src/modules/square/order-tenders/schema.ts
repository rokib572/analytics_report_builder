import { bigint, index, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { locations } from "../locations/schema"
import { orders } from "../orders/schema"

export const orderTenders = coreSchema.table(
  "order_tenders",
  {
    id: primaryKey(),
    orderId: foreignKey("order_id")
      .notNull()
      .references(() => orders.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    type: varchar("type", { length: 50 }).notNull(),
    amountMoney: bigint("amount_money", { mode: "bigint" }),
    tipMoney: bigint("tip_money", { mode: "bigint" }),
    processingFeeMoney: bigint("processing_fee_money", { mode: "bigint" }),
    cardBrand: varchar("card_brand", { length: 50 }),
    cardLast4: varchar("card_last4", { length: 4 }),
    cardEntryMethod: varchar("card_entry_method", { length: 50 }),
    squareCustomerId: varchar("square_customer_id", { length: 255 }),
    paymentId: varchar("payment_id", { length: 255 }),
  },
  (t) => [
    index("order_tenders_order_id_idx").on(t.orderId),
    index("order_tenders_location_type_idx").on(t.locationId, t.type),
  ],
)

export const insertOrderTenderSchema = createInsertSchema(orderTenders).omit({
  id: true,
})
export const selectOrderTenderSchema = createSelectSchema(orderTenders)

export type OrderTenderPayload = ReturnType<typeof insertOrderTenderSchema.parse>
export type OrderTenderDto = ReturnType<typeof selectOrderTenderSchema.parse>
