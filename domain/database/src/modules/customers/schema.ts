import { varchar, text, timestamp } from "drizzle-orm/pg-core"
import { authSchema, primaryKey } from "../../db/base"

export const customers = authSchema.table("customers", {
  id: primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  companyName: varchar("company_name", { length: 255 }),
  businessType: varchar("business_type", { length: 100 }),
  businessSize: varchar("business_size", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
