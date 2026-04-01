import { index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { orders } from "../orders/schema"

export const orderFulfillments = coreSchema.table(
  "order_fulfillments",
  {
    id: primaryKey(),
    orderId: foreignKey("order_id")
      .notNull()
      .references(() => orders.id),
    squareUid: varchar("square_uid", { length: 255 }),
    type: varchar("type", { length: 50 }).notNull(),
    state: varchar("state", { length: 50 }).notNull(),
    pickupAt: timestamp("pickup_at"),
    deliveredAt: timestamp("delivered_at"),
    canceledAt: timestamp("canceled_at"),
  },
  (t) => [index("order_fulfillments_order_id_idx").on(t.orderId)],
)

export const insertOrderFulfillmentSchema = createInsertSchema(orderFulfillments).omit({
  id: true,
})
export const selectOrderFulfillmentSchema = createSelectSchema(orderFulfillments)

export type OrderFulfillmentPayload = ReturnType<typeof insertOrderFulfillmentSchema.parse>
export type OrderFulfillmentDto = ReturnType<typeof selectOrderFulfillmentSchema.parse>
