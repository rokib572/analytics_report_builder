import { bigint, date, index, jsonb, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import { locations } from "../locations/schema"

export const laborTimecards = coreSchema.table(
  "labor_timecards",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    locationId: foreignKey("location_id")
      .notNull()
      .references(() => locations.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    teamMemberId: varchar("team_member_id", { length: 255 }).notNull(),
    jobTitle: varchar("job_title", { length: 255 }),
    jobId: varchar("job_id", { length: 255 }),
    workDate: date("work_date").notNull(),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at"),
    status: varchar("status", { length: 50 }),
    hourlyWageCents: bigint("hourly_wage_cents", { mode: "bigint" }),
    totalPaidHours: bigint("total_paid_hours_milli", { mode: "bigint" }),
    totalLaborCostCents: bigint("total_labor_cost_cents", { mode: "bigint" }),
    declaredCashTipsCents: bigint("declared_cash_tips_cents", { mode: "bigint" }),
    paidBreakMinutes: bigint("paid_break_minutes", { mode: "bigint" }),
    unpaidBreakMinutes: bigint("unpaid_break_minutes", { mode: "bigint" }),
    breaks: jsonb("breaks").$type<Record<string, unknown>[] | null>(),
    timezone: varchar("timezone", { length: 100 }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
    squareCreatedAt: timestamp("square_created_at"),
    squareUpdatedAt: timestamp("square_updated_at"),
  },
  (t) => [
    index("labor_timecards_location_date_idx").on(t.locationId, t.workDate),
    index("labor_timecards_customer_date_idx").on(t.customerId, t.workDate),
    index("labor_timecards_team_member_idx").on(t.teamMemberId),
  ],
)

const breaksInsertSchema = z.array(z.record(z.string(), z.unknown())).nullable().optional()
const breaksSelectSchema = z.array(z.record(z.string(), z.unknown())).nullable()

export const insertLaborTimecardSchema = createInsertSchema(laborTimecards, {
  breaks: () => breaksInsertSchema,
}).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectLaborTimecardSchema = createSelectSchema(laborTimecards, {
  breaks: () => breaksSelectSchema,
})

export type LaborTimecardPayload = ReturnType<typeof insertLaborTimecardSchema.parse>
export type LaborTimecardDto = ReturnType<typeof selectLaborTimecardSchema.parse>
