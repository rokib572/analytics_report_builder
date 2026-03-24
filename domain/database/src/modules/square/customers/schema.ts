import { varchar, timestamp, index } from "drizzle-orm/pg-core"
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

export type SquareCustomerPayload = {
  squareId: string
  givenName: string
  familyName: string
  emailAddress: string | null
  phoneNumber: string | null
  referenceId: string | null
  creationSource: string | null
  creationTime: Date
  contentHash: string
}

export type SquareCustomerDto = typeof squareCustomers.$inferSelect
export type SquareCustomerListDto = Omit<SquareCustomerDto, "contentHash" | "squareId">
