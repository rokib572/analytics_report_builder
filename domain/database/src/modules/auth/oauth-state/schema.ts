import { varchar, boolean, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { authSchema, foreignKey } from "../../../db/base"
import { customers } from "../../customers/schema"
import type z from "zod"

export const oauthState = authSchema.table("oauth_state", {
  state: varchar("state", { length: 64 }).primaryKey(),
  customerId: foreignKey("customer_id")
    .notNull()
    .references(() => customers.id),
  userId: varchar("user_id", { length: 26 }).notNull(),
  environment: varchar("environment", { length: 20 }).notNull(),
  backfillScope: varchar("backfill_scope", { length: 10 }).notNull().default("12m"),
  consumed: boolean("consumed").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const insertOAuthStateSchema = createInsertSchema(oauthState).omit({
  consumed: true,
  createdAt: true,
})
export const selectOAuthStateSchema = createSelectSchema(oauthState)

export type OAuthStatePayload = z.infer<typeof insertOAuthStateSchema>
export type OAuthStateDto = z.infer<typeof selectOAuthStateSchema>
