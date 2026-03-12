import { varchar, bigint, jsonb, timestamp, date, index } from "drizzle-orm/pg-core"
import { coreSchema, foreignKey, primaryKey } from "../../db/base"
import { locations } from "../locations/schema"

export const orders = coreSchema.table(
  "orders",
  {
    id: primaryKey(),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
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
    rawJson: jsonb("raw_json").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [index("orders_location_date_idx").on(t.locationId, t.saleDate)],
)
