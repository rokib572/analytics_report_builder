import { varchar, bigint, integer, timestamp, date, unique, index } from "drizzle-orm/pg-core"
import { coreSchema, primaryKey, foreignKey } from "../../db/base"
import { locations } from "../locations/schema"

export const dailySales = coreSchema.table(
  "daily_sales",
  {
    id: primaryKey(),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    saleDate: date("sale_date").notNull(),
    grossSales: bigint("gross_sales", { mode: "bigint" }).notNull().default(0n),
    totalDiscounts: bigint("total_discounts", { mode: "bigint" }).notNull().default(0n),
    totalReturns: bigint("total_returns", { mode: "bigint" }).notNull().default(0n),
    netSales: bigint("net_sales", { mode: "bigint" }).notNull().default(0n),
    totalTax: bigint("total_tax", { mode: "bigint" }).notNull().default(0n),
    totalTips: bigint("total_tips", { mode: "bigint" }).notNull().default(0n),
    totalServiceCharges: bigint("total_service_charges", { mode: "bigint" }).notNull().default(0n),
    totalCollected: bigint("total_collected", { mode: "bigint" }).notNull().default(0n),
    storeGrossSales: bigint("store_gross_sales", { mode: "bigint" }).notNull().default(0n),
    uberGrossSales: bigint("uber_gross_sales", { mode: "bigint" }).notNull().default(0n),
    uberBogoDiscountAmount: bigint("uber_bogo_discount_amount", { mode: "bigint" })
      .notNull()
      .default(0n),
    uberBogoRecoverable: bigint("uber_bogo_recoverable", { mode: "bigint" }).notNull().default(0n),
    orderCount: integer("order_count").notNull().default(0),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
    syncSource: varchar("sync_source", { length: 50 }).notNull(),
  },
  (t) => [
    unique().on(t.locationId, t.saleDate),
    index("daily_sales_sale_date_idx").on(t.saleDate),
    index("daily_sales_location_id_idx").on(t.locationId),
    index("daily_sales_location_date_idx").on(t.locationId, t.saleDate),
  ],
)
