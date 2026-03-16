import { varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { authSchema, foreignKey, primaryKey } from "../../db/base"
import { customers } from "../customers/schema"

export const appIntegrations = authSchema.table(
  "app_integrations",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    appName: varchar("app_name", { length: 100 }).notNull(),
    appKey: text("app_key").notNull(),
    environment: varchar("environment", { length: 20 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    label: varchar("label", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => [index("app_integrations_customer_id_idx").on(t.customerId)],
)
