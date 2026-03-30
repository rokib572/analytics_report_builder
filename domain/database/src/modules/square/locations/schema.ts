import { varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
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

const addressInsertSchema = z.record(z.string(), z.unknown()).nullable().optional()
const addressSelectSchema = z.record(z.string(), z.unknown()).nullable()

export const insertLocationSchema = createInsertSchema(locations, {
  address: () => addressInsertSchema,
}).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectLocationSchema = createSelectSchema(locations, {
  address: () => addressSelectSchema,
})

export type LocationPayload = ReturnType<typeof insertLocationSchema.parse>
export type LocationDto = ReturnType<typeof selectLocationSchema.parse>
