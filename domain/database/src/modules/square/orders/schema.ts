import { varchar, bigint, jsonb, timestamp, date, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"

export const orders = coreSchema.table(
  "orders",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    saleDate: date("sale_date").notNull(),
    state: varchar("state", { length: 50 }).notNull(),
    totalMoney: bigint("total_money", { mode: "bigint" }),
    totalTaxMoney: bigint("total_tax_money", { mode: "bigint" }),
    totalDiscountMoney: bigint("total_discount_money", { mode: "bigint" }),
    totalTipMoney: bigint("total_tip_money", { mode: "bigint" }),
    totalServiceChargeMoney: bigint("total_service_charge_money", { mode: "bigint" }),
    netAmounts: jsonb("net_amounts"),
    returnAmounts: jsonb("return_amounts"),
    sourceName: varchar("source_name", { length: 255 }),
    squareCustomerId: varchar("square_customer_id", { length: 255 }),
    ticketName: varchar("ticket_name", { length: 255 }),
    closedAt: timestamp("closed_at"),
    fulfillmentType: varchar("fulfillment_type", { length: 50 }),
    rawJson: jsonb("raw_json").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [
    index("orders_location_date_idx").on(t.locationId, t.saleDate),
    index("orders_customer_date_state_idx").on(t.customerId, t.saleDate, t.state),
    index("orders_customer_id_idx").on(t.customerId),
    index("orders_square_customer_id_idx").on(t.squareCustomerId),
  ],
)

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectOrderSchema = createSelectSchema(orders).omit({
  rawJson: true,
})

export type OrderPayload = ReturnType<typeof insertOrderSchema.parse>
export type OrderDto = ReturnType<typeof selectOrderSchema.parse>
