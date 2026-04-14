import { index, integer, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const catalogModifierLists = coreSchema.table(
  "catalog_modifier_lists",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    selectionType: varchar("selection_type", { length: 32 }),
    ordinal: integer("ordinal"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("catalog_modifier_lists_customer_id_idx").on(t.customerId),
    index("catalog_modifier_lists_selection_type_idx").on(t.selectionType),
  ],
)

export const insertCatalogModifierListSchema = createInsertSchema(catalogModifierLists).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectCatalogModifierListSchema = createSelectSchema(catalogModifierLists)

export type CatalogModifierListPayload = ReturnType<typeof insertCatalogModifierListSchema.parse>
export type CatalogModifierListDto = ReturnType<typeof selectCatalogModifierListSchema.parse>
