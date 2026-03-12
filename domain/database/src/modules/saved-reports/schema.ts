import { varchar, jsonb, timestamp } from "drizzle-orm/pg-core"
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
