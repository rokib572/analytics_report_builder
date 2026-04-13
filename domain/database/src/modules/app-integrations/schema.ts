import { varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { authSchema, foreignKey, primaryKey } from "../../db/base"
import { customers } from "../customers/schema"
import type z from "zod"

export const appIntegrations = authSchema.table(
  "app_integrations",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    appName: varchar("app_name", { length: 100 }).notNull(),
    appKey: text("app_key"),
    appSecret: text("app_secret"),
    oauthAccessToken: text("oauth_access_token"),
    oauthRefreshToken: text("oauth_refresh_token"),
    oauthExpiresAt: timestamp("oauth_expires_at"),
    merchantId: varchar("merchant_id", { length: 255 }),
    scopes: text("scopes"),
    webhookSubscriptionId: varchar("webhook_subscription_id", { length: 255 }),
    webhookSignatureKey: text("webhook_signature_key"),
    environment: varchar("environment", { length: 20 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    label: varchar("label", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => [index("app_integrations_customer_id_idx").on(t.customerId)],
)

export const insertAppIntegrationSchema = createInsertSchema(appIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  customerId: true,
  isActive: true,
  lastUsedAt: true,
  oauthAccessToken: true,
  oauthRefreshToken: true,
  oauthExpiresAt: true,
  merchantId: true,
  scopes: true,
  webhookSubscriptionId: true,
  webhookSignatureKey: true,
})
export const selectAppIntegrationSchema = createSelectSchema(appIntegrations)
export const selectSafeAppIntegration = selectAppIntegrationSchema.omit({
  appKey: true,
  appSecret: true,
  oauthAccessToken: true,
  oauthRefreshToken: true,
  webhookSignatureKey: true,
})

export type AppIntegrationDto = z.infer<typeof selectSafeAppIntegration>
export type AppIntegrationPayload = z.infer<typeof insertAppIntegrationSchema>
