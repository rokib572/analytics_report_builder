import { bigint, date, index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"

export const laborScheduledShifts = coreSchema.table(
  "labor_scheduled_shifts",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    teamMemberId: varchar("team_member_id", { length: 255 }),
    jobTitle: varchar("job_title", { length: 255 }),
    jobId: varchar("job_id", { length: 255 }),
    workDate: date("work_date").notNull(),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    scheduledMinutes: bigint("scheduled_minutes", { mode: "bigint" }),
    status: varchar("status", { length: 50 }),
    notes: varchar("notes", { length: 1000 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
    squareCreatedAt: timestamp("square_created_at"),
    squareUpdatedAt: timestamp("square_updated_at"),
  },
  (t) => [
    index("labor_scheduled_shifts_location_date_idx").on(t.locationId, t.workDate),
    index("labor_scheduled_shifts_customer_date_idx").on(t.customerId, t.workDate),
  ],
)

export const insertLaborScheduledShiftSchema = createInsertSchema(laborScheduledShifts).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectLaborScheduledShiftSchema = createSelectSchema(laborScheduledShifts)

export type LaborScheduledShiftPayload = ReturnType<typeof insertLaborScheduledShiftSchema.parse>
export type LaborScheduledShiftDto = ReturnType<typeof selectLaborScheduledShiftSchema.parse>
