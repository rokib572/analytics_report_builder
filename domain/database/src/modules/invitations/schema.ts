import { varchar, timestamp, index, uniqueIndex, char } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { authSchema, foreignKey, primaryKey } from "../../db/base"
import { customers } from "../customers/schema"
import { users } from "../users/schema"
import { ulid } from "ulidx"

export const invitations = authSchema.table(
  "invitations",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    token: char("token", { length: 26 }).notNull().unique().$defaultFn(ulid),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    invitedBy: foreignKey("invited_by")
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("invitations_customer_id_idx").on(t.customerId),
    index("invitations_email_idx").on(t.email),
    uniqueIndex("invitations_token_idx").on(t.token),
  ],
)

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  customerId: true,
  token: true,
  status: true,
  acceptedAt: true,
  createdAt: true,
  updatedAt: true,
})

export const selectInvitationSchema = createSelectSchema(invitations)

export type InvitationPayload = ReturnType<typeof insertInvitationSchema.parse>
export type InvitationDto = ReturnType<typeof selectInvitationSchema.parse>
