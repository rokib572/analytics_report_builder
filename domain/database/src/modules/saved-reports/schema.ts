import { varchar, jsonb, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { foreignKey, primaryKey, reportSchema } from "../../db/base"
import { customers } from "../customers/schema"

export const savedReports = reportSchema.table("saved_reports", {
  id: primaryKey(),
  customerId: foreignKey("customer_id")
    .notNull()
    .references(() => customers.id),
  name: varchar("name", { length: 255 }).notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const insertSavedReportSchema = createInsertSchema(savedReports).omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
})
export const updateSavedReportSchema = insertSavedReportSchema.partial()
export const selectSavedReportSchema = createSelectSchema(savedReports)

export type SavedReportPayload = ReturnType<typeof insertSavedReportSchema.parse>
export type UpdateSavedReportPayload = ReturnType<typeof updateSavedReportSchema.parse>
export type SavedReportDto = ReturnType<typeof selectSavedReportSchema.parse>
