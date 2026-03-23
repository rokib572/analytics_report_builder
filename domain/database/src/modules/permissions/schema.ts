import { varchar, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core"
import { authSchema, foreignKey, primaryKey } from "../../db/base"
import { customers } from "../customers/schema"
import { users } from "../users/schema"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const permissions = authSchema.table(
  "permissions",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    userId: foreignKey("user_id")
      .notNull()
      .references(() => users.id),
    resource: varchar("resource", { length: 100 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    allowed: boolean("allowed").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("permissions_user_id_idx").on(t.userId),
    index("permissions_customer_id_idx").on(t.customerId),
    uniqueIndex("permissions_unique_idx").on(t.customerId, t.userId, t.resource, t.action),
  ],
)

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
})
export const updatePermissionSchema = createInsertSchema(permissions).partial().omit({
  id: true,
  customerId: true,
  userId: true,
  createdAt: true,
})
export const selectPermissionSchema = createSelectSchema(permissions)

export type PermissionPayload = ReturnType<typeof insertPermissionSchema.parse>
export type UpdatePermissionPayload = ReturnType<typeof insertPermissionSchema.parse>
export type PermissionDto = ReturnType<typeof selectPermissionSchema.parse>
