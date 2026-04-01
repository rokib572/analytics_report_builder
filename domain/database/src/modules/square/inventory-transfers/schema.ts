import { index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"
import { catalogItemVariations } from "../catalog-item-variations/schema"

export const inventoryTransfers = coreSchema.table(
  "inventory_transfers",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    catalogObjectId: varchar("catalog_object_id", { length: 255 }).notNull(),
    catalogItemVariationId: foreignKey("catalog_item_variation_id").references(
      () => catalogItemVariations.id,
    ),
    catalogObjectType: varchar("catalog_object_type", { length: 50 }),
    fromLocationId: foreignKey("from_location_id").references(() => locations.id),
    toLocationId: foreignKey("to_location_id").references(() => locations.id),
    fromSquareLocationId: varchar("from_square_location_id", { length: 255 }),
    toSquareLocationId: varchar("to_square_location_id", { length: 255 }),
    state: varchar("state", { length: 50 }),
    quantity: varchar("quantity", { length: 50 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    teamMemberId: varchar("team_member_id", { length: 255 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("inventory_transfers_customer_id_idx").on(t.customerId),
    index("inventory_transfers_occurred_idx").on(t.occurredAt),
    index("inventory_transfers_from_location_id_idx").on(t.fromLocationId),
    index("inventory_transfers_to_location_id_idx").on(t.toLocationId),
    index("inventory_transfers_catalog_object_id_idx").on(t.catalogObjectId),
  ],
)

export const insertInventoryTransferSchema = createInsertSchema(inventoryTransfers).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectInventoryTransferSchema = createSelectSchema(inventoryTransfers)

export type InventoryTransferPayload = ReturnType<typeof insertInventoryTransferSchema.parse>
export type InventoryTransferDto = ReturnType<typeof selectInventoryTransferSchema.parse>
