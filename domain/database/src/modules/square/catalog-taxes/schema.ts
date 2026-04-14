import { boolean, index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const catalogTaxes = coreSchema.table(
  "catalog_taxes",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    percentage: varchar("percentage", { length: 32 }),
    inclusionType: varchar("inclusion_type", { length: 32 }),
    appliesToCustomAmounts: boolean("applies_to_custom_amounts"),
    enabled: boolean("enabled"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("catalog_taxes_customer_id_idx").on(t.customerId),
    index("catalog_taxes_inclusion_type_idx").on(t.inclusionType),
  ],
)

export const insertCatalogTaxSchema = createInsertSchema(catalogTaxes).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectCatalogTaxSchema = createSelectSchema(catalogTaxes)

export type CatalogTaxPayload = ReturnType<typeof insertCatalogTaxSchema.parse>
export type CatalogTaxDto = ReturnType<typeof selectCatalogTaxSchema.parse>
