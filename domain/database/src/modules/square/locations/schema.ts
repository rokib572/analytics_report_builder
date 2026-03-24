import { varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core"
import { coreSchema, primaryKey, foreignKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const locations = coreSchema.table(
  "locations",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    address: jsonb("address").$type<Record<string, unknown> | null>(),
    status: varchar("status", { length: 50 }).notNull(),
    timezone: varchar("timezone", { length: 100 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [index("locations_customer_id_idx").on(t.customerId)],
)

export type LocationPayload = {
  squareId: string
  name: string
  address?: Record<string, unknown> | null
  status: string
  timezone?: string | null
  contentHash: string
}

export type LocationDto = typeof locations.$inferSelect
