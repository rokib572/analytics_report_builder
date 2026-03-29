import { varchar, boolean, text, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, primaryKey, foreignKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const catalogItems = coreSchema.table(
  "catalog_items",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    categoryId: varchar("category_id", { length: 255 }),
    isArchived: boolean("is_archived"),
    reportingCategoryId: varchar("reporting_category_id", { length: 255 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("catalog_items_customer_id_idx").on(t.customerId),
    index("catalog_items_category_id_idx").on(t.categoryId),
  ],
)

export const insertCatalogItemSchema = createInsertSchema(catalogItems).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectCatalogItemSchema = createSelectSchema(catalogItems)

export type CatalogItemPayload = ReturnType<typeof insertCatalogItemSchema.parse>
export type CatalogItemDto = ReturnType<typeof selectCatalogItemSchema.parse>
