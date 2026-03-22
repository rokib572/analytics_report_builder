import { varchar, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
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

export const insertCustomerSchema = createInsertSchema(customers)
export const selectCustomerSchema = createSelectSchema(customers)
export const updateCustomerSchema = createInsertSchema(customers).partial()

export type CustomerPayload = ReturnType<typeof insertCustomerSchema.parse>
export type UpdateCustomerPayload = ReturnType<typeof updateCustomerSchema.parse>
export type CustomerDto = ReturnType<typeof selectCustomerSchema.parse>
