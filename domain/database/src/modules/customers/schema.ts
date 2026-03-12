import { varchar, timestamp } from "drizzle-orm/pg-core"
import { authSchema, primaryKey } from "../../db/base"

export const customers = authSchema.table("customers", {
  id: primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
