import { varchar, integer, timestamp, date } from "drizzle-orm/pg-core"
import { auditSchema, foreignKey, primaryKey } from "../../db/base"
import { locations } from "../locations/schema"

export const syncLog = auditSchema.table("sync_log", {
  id: primaryKey(),
  syncType: varchar("sync_type", { length: 50 }).notNull(),
  locationId: foreignKey("location_id").references(() => locations.id),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  squareCount: integer("square_count"),
  dbCount: integer("db_count"),
  discrepancy: integer("discrepancy"),
  ordersFetched: integer("orders_fetched"),
  status: varchar("status", { length: 20 }).notNull(),
  errorMessage: varchar("error_message", { length: 1000 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
