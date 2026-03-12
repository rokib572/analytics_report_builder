import { varchar, bigint, date, index } from "drizzle-orm/pg-core"
import { coreSchema, primaryKey, foreignKey } from "../../db/base"
import { orders } from "../orders/schema"
import { locations } from "../locations/schema"

export const orderLineItems = coreSchema.table(
  "order_line_items",
  {
    id: primaryKey(),
    orderId: foreignKey("order_id")
      .notNull()
      .references(() => orders.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    saleDate: date("sale_date").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    variationName: varchar("variation_name", { length: 255 }),
    catalogObjectId: varchar("catalog_object_id", { length: 255 }),
    quantity: varchar("quantity", { length: 50 }).notNull(),
    channel: varchar("channel", { length: 10 }).notNull(),
    basePriceMoney: bigint("base_price_money", { mode: "bigint" }),
    grossSalesMoney: bigint("gross_sales_money", { mode: "bigint" }),
    totalDiscountMoney: bigint("total_discount_money", { mode: "bigint" }),
    totalTaxMoney: bigint("total_tax_money", { mode: "bigint" }),
    totalMoney: bigint("total_money", { mode: "bigint" }),
  },
  (t) => [
    index("line_items_order_id_idx").on(t.orderId),
    index("line_items_location_date_idx").on(t.locationId, t.saleDate),
  ],
)
