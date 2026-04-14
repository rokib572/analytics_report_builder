import { bigint, boolean, index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const catalogDiscounts = coreSchema.table(
  "catalog_discounts",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    discountType: varchar("discount_type", { length: 32 }),
    percentage: varchar("percentage", { length: 32 }),
    amountMoney: bigint("amount_money", { mode: "bigint" }),
    pinRequired: boolean("pin_required"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("catalog_discounts_customer_id_idx").on(t.customerId),
    index("catalog_discounts_discount_type_idx").on(t.discountType),
  ],
)

export const insertCatalogDiscountSchema = createInsertSchema(catalogDiscounts).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectCatalogDiscountSchema = createSelectSchema(catalogDiscounts)

export type CatalogDiscountPayload = ReturnType<typeof insertCatalogDiscountSchema.parse>
export type CatalogDiscountDto = ReturnType<typeof selectCatalogDiscountSchema.parse>
