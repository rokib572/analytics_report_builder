import { boolean, index, timestamp, unique, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"
import { catalogItemVariations } from "../catalog-item-variations/schema"

export const inventoryCounts = coreSchema.table(
  "inventory_counts",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    catalogObjectId: varchar("catalog_object_id", { length: 255 }).notNull(),
    catalogItemVariationId: foreignKey("catalog_item_variation_id").references(
      () => catalogItemVariations.id,
    ),
    catalogObjectType: varchar("catalog_object_type", { length: 50 }),
    state: varchar("state", { length: 50 }).notNull(),
    quantity: varchar("quantity", { length: 50 }).notNull(),
    isEstimated: boolean("is_estimated").notNull(),
    calculatedAt: timestamp("calculated_at").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    unique().on(t.locationId, t.catalogObjectId, t.state),
    index("inventory_counts_customer_id_idx").on(t.customerId),
    index("inventory_counts_location_calculated_idx").on(t.locationId, t.calculatedAt),
    index("inventory_counts_catalog_object_id_idx").on(t.catalogObjectId),
    index("inventory_counts_catalog_item_variation_id_idx").on(t.catalogItemVariationId),
  ],
)

export const insertInventoryCountSchema = createInsertSchema(inventoryCounts).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectInventoryCountSchema = createSelectSchema(inventoryCounts)

export type InventoryCountPayload = ReturnType<typeof insertInventoryCountSchema.parse>
export type InventoryCountDto = ReturnType<typeof selectInventoryCountSchema.parse>
