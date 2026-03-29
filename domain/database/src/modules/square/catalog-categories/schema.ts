import { varchar, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, primaryKey, foreignKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const catalogCategories = coreSchema.table(
  "catalog_categories",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    parentCategoryId: varchar("parent_category_id", { length: 255 }),
    isTopLevel: boolean("is_top_level"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [index("catalog_categories_customer_id_idx").on(t.customerId)],
)

export const insertCatalogCategorySchema = createInsertSchema(catalogCategories).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectCatalogCategorySchema = createSelectSchema(catalogCategories)

export type CatalogCategoryPayload = ReturnType<typeof insertCatalogCategorySchema.parse>
export type CatalogCategoryDto = ReturnType<typeof selectCatalogCategorySchema.parse>
