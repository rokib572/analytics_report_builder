import { boolean, index, integer, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"

export const laborBreakTypes = coreSchema.table(
  "labor_break_types",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    breakName: varchar("break_name", { length: 255 }).notNull(),
    expectedDuration: varchar("expected_duration", { length: 50 }).notNull(),
    expectedDurationMinutes: integer("expected_duration_minutes"),
    isPaid: boolean("is_paid").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("labor_break_types_customer_idx").on(t.customerId),
    index("labor_break_types_location_idx").on(t.locationId),
  ],
)

export const insertLaborBreakTypeSchema = createInsertSchema(laborBreakTypes).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectLaborBreakTypeSchema = createSelectSchema(laborBreakTypes)

export type LaborBreakTypePayload = ReturnType<typeof insertLaborBreakTypeSchema.parse>
export type LaborBreakTypeDto = ReturnType<typeof selectLaborBreakTypeSchema.parse>
