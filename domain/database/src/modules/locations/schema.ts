import { varchar, jsonb, timestamp } from "drizzle-orm/pg-core"
import { coreSchema, primaryKey, foreignKey } from "../../db/base"
import { customers } from "../customers/schema"

export const locations = coreSchema.table("locations", {
  id: primaryKey(),
  customerId: foreignKey("customer_id")
    .notNull()
    .references(() => customers.id),
  name: varchar("name", { length: 255 }).notNull(),
  address: jsonb("address"),
  status: varchar("status", { length: 50 }).notNull(),
  timezone: varchar("timezone", { length: 100 }),
  syncedAt: timestamp("synced_at"),
})
