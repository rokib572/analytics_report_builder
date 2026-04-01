import { bigint, index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"
import { catalogItemVariations } from "../catalog-item-variations/schema"

export const inventoryAdjustments = coreSchema.table(
  "inventory_adjustments",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    catalogObjectId: varchar("catalog_object_id", { length: 255 }).notNull(),
    catalogItemVariationId: foreignKey("catalog_item_variation_id").references(
      () => catalogItemVariations.id,
    ),
    catalogObjectType: varchar("catalog_object_type", { length: 50 }),
    fromState: varchar("from_state", { length: 50 }),
    toState: varchar("to_state", { length: 50 }),
    quantity: varchar("quantity", { length: 50 }).notNull(),
    totalPriceMoney: bigint("total_price_money", { mode: "bigint" }),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    teamMemberId: varchar("team_member_id", { length: 255 }),
    transactionId: varchar("transaction_id", { length: 255 }),
    refundId: varchar("refund_id", { length: 255 }),
    purchaseOrderId: varchar("purchase_order_id", { length: 255 }),
    goodsReceiptId: varchar("goods_receipt_id", { length: 255 }),
    reason: varchar("reason", { length: 255 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("inventory_adjustments_customer_id_idx").on(t.customerId),
    index("inventory_adjustments_location_occurred_idx").on(t.locationId, t.occurredAt),
    index("inventory_adjustments_catalog_object_id_idx").on(t.catalogObjectId),
    index("inventory_adjustments_transaction_id_idx").on(t.transactionId),
    index("inventory_adjustments_refund_id_idx").on(t.refundId),
  ],
)

export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectInventoryAdjustmentSchema = createSelectSchema(inventoryAdjustments)

export type InventoryAdjustmentPayload = ReturnType<typeof insertInventoryAdjustmentSchema.parse>
export type InventoryAdjustmentDto = ReturnType<typeof selectInventoryAdjustmentSchema.parse>
