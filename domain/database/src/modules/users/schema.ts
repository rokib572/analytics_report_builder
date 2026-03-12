import { varchar, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { authSchema, foreignKey, primaryKey } from "../../db/base"
import { customers } from "../customers/schema"

export const users = authSchema.table(
  "users",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("users_customer_id_idx").on(t.customerId)],
)
