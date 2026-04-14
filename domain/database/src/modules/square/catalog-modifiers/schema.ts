import { bigint, index, integer, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { catalogModifierLists } from "../catalog-modifier-lists/schema"

export const catalogModifiers = coreSchema.table(
  "catalog_modifiers",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    modifierListId: foreignKey("modifier_list_id")
      .notNull()
      .references(() => catalogModifierLists.id),
    name: varchar("name", { length: 255 }).notNull(),
    priceMoney: bigint("price_money", { mode: "bigint" }),
    priceCurrency: varchar("price_currency", { length: 3 }),
    ordinal: integer("ordinal"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("catalog_modifiers_customer_id_idx").on(t.customerId),
    index("catalog_modifiers_modifier_list_id_idx").on(t.modifierListId),
  ],
)

export const insertCatalogModifierSchema = createInsertSchema(catalogModifiers).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectCatalogModifierSchema = createSelectSchema(catalogModifiers)

export type CatalogModifierPayload = ReturnType<typeof insertCatalogModifierSchema.parse>
export type CatalogModifierDto = ReturnType<typeof selectCatalogModifierSchema.parse>
