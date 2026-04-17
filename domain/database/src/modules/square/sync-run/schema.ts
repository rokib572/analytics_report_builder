import { integer, jsonb, timestamp, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { auditSchema, foreignKey, primaryKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const syncRuns = auditSchema.table("sync_runs", {
  id: primaryKey(),
  customerId: foreignKey("customer_id")
    .notNull()
    .references(() => customers.id),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: varchar("error_message", { length: 1000 }),
})

export const syncRunDetails = auditSchema.table("sync_run_details", {
  id: primaryKey(),
  syncRunId: foreignKey("sync_run_id")
    .notNull()
    .references(() => syncRuns.id),
  dataType: varchar("data_type", { length: 100 }).notNull(),
  changedCount: integer("changed_count").notNull().default(0),
  unchangedCount: integer("unchanged_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  changedRecordIds: jsonb("changed_record_ids").$type<string[]>().notNull().default([]),
  failedRecords: jsonb("failed_records")
    .$type<Array<{ id: string; error: string }>>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

const failedRecordSchema = z.object({
  id: z.string(),
  error: z.string(),
})

export const insertSyncRunSchema = createInsertSchema(syncRuns).omit({
  id: true,
  startedAt: true,
})
export const selectSyncRunSchema = createSelectSchema(syncRuns)

export const insertSyncRunDetailSchema = createInsertSchema(syncRunDetails, {
  changedRecordIds: () => z.array(z.string()),
  failedRecords: () => z.array(failedRecordSchema),
}).omit({
  id: true,
  createdAt: true,
})
export const selectSyncRunDetailSchema = createSelectSchema(syncRunDetails, {
  changedRecordIds: () => z.array(z.string()),
  failedRecords: () => z.array(failedRecordSchema),
})

export type SyncRunPayload = ReturnType<typeof insertSyncRunSchema.parse>
export type SyncRunDto = ReturnType<typeof selectSyncRunSchema.parse>
export type SyncRunDetailPayload = ReturnType<typeof insertSyncRunDetailSchema.parse>
export type SyncRunDetailDto = ReturnType<typeof selectSyncRunDetailSchema.parse>
