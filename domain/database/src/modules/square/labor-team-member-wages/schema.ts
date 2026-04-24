import { bigint, boolean, index, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const laborTeamMemberWages = coreSchema.table(
  "labor_team_member_wages",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    teamMemberId: varchar("team_member_id", { length: 255 }).notNull(),
    jobTitle: varchar("job_title", { length: 255 }),
    jobId: varchar("job_id", { length: 255 }),
    hourlyWageCents: bigint("hourly_wage_cents", { mode: "bigint" }),
    tipEligible: boolean("tip_eligible"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("labor_team_member_wages_customer_idx").on(t.customerId),
    index("labor_team_member_wages_team_member_idx").on(t.teamMemberId),
  ],
)

export const insertLaborTeamMemberWageSchema = createInsertSchema(laborTeamMemberWages).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectLaborTeamMemberWageSchema = createSelectSchema(laborTeamMemberWages)

export type LaborTeamMemberWagePayload = ReturnType<typeof insertLaborTeamMemberWageSchema.parse>
export type LaborTeamMemberWageDto = ReturnType<typeof selectLaborTeamMemberWageSchema.parse>
