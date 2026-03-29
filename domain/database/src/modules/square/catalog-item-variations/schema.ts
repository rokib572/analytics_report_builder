import { varchar, bigint, integer, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, primaryKey, foreignKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { catalogItems } from "../catalog-items/schema"

export const catalogItemVariations = coreSchema.table(
  "catalog_item_variations",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    itemId: foreignKey("item_id")
      .notNull()
      .references(() => catalogItems.id),
    name: varchar("name", { length: 255 }),
    sku: varchar("sku", { length: 255 }),
    priceMoney: bigint("price_money", { mode: "bigint" }),
    priceCurrency: varchar("price_currency", { length: 3 }),
    ordinal: integer("ordinal"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("catalog_item_variations_customer_id_idx").on(t.customerId),
    index("catalog_item_variations_item_id_idx").on(t.itemId),
    index("catalog_item_variations_sku_idx").on(t.sku),
  ],
)

export const insertCatalogItemVariationSchema = createInsertSchema(catalogItemVariations).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectCatalogItemVariationSchema = createSelectSchema(catalogItemVariations)

export type CatalogItemVariationPayload = ReturnType<typeof insertCatalogItemVariationSchema.parse>
export type CatalogItemVariationDto = ReturnType<typeof selectCatalogItemVariationSchema.parse>
