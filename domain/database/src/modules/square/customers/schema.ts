import { varchar, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, primaryKey, foreignKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const squareCustomers = coreSchema.table(
  "square_customers",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareId: varchar("square_id", { length: 255 }).notNull().unique(),
    givenName: varchar("given_name", { length: 255 }).notNull(),
    familyName: varchar("family_name", { length: 255 }).notNull(),
    emailAddress: varchar("email", { length: 255 }),
    phoneNumber: varchar("phone", { length: 50 }),
    referenceId: varchar("reference_id", { length: 255 }),
    creationSource: varchar("creation_source", { length: 255 }),
    creationTime: timestamp("created_at", { withTimezone: true }).notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    syncedAt: timestamp("synced_at"),
  },
  (t) => [
    index("square_customer_id_idx").on(t.customerId),
    index("square_customers_square_id_idx").on(t.squareId),
    index("square_customers_email_idx").on(t.emailAddress),
    index("square_customers_phone_idx").on(t.phoneNumber),
  ],
)

export const insertSquareCustomerSchema = createInsertSchema(squareCustomers).omit({
  id: true,
  customerId: true,
  syncedAt: true,
})
export const selectSquareCustomerSchema = createSelectSchema(squareCustomers)
export const selectSquareCustomerListSchema = createSelectSchema(squareCustomers).omit({
  contentHash: true,
  squareId: true,
})

export type SquareCustomerPayload = ReturnType<typeof insertSquareCustomerSchema.parse>
export type SquareCustomerDto = ReturnType<typeof selectSquareCustomerSchema.parse>
export type SquareCustomerListDto = ReturnType<typeof selectSquareCustomerListSchema.parse>
