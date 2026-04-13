import { z } from "zod"

export const AppIntegrationEnvironmentSchema = z.enum(["sandbox", "production"])

export const AppIntegrationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  appName: z.string(),
  environment: AppIntegrationEnvironmentSchema,
  isActive: z.boolean(),
  label: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUsedAt: z.string().nullable(),
})

export const CreateAppIntegrationSchema = z.object({
  appName: z
    .string({ error: "App name is required" })
    .min(1, { error: "App name cannot be empty" }),
  appKey: z.string().optional(),
  appSecret: z
    .string({ error: "App secret is required" })
    .min(1, { error: "App secret cannot be empty" }),
  environment: z
    .string({ error: "Environment is required" })
    .min(1, { error: "Environment cannot be empty" }),
  isActive: z.boolean().default(true),
  label: z.string().optional(),
})

export const ConnectSquareSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  accessKey: z.string().optional(),
  environment: AppIntegrationEnvironmentSchema.default("sandbox"),
  backfillScope: z.enum(["30d", "3m", "6m", "12m", "24m", "all"]).default("12m"),
})

export const InitiateOAuthSchema = z.object({
  backfillScope: z.enum(["30d", "3m", "6m", "12m", "24m", "all"]).default("12m"),
})

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "State parameter is required"),
})

export type AppIntegration = z.infer<typeof AppIntegrationSchema>
export type AppIntegrationEnvironment = z.infer<typeof AppIntegrationEnvironmentSchema>
export type CreateAppIntegration = z.infer<typeof CreateAppIntegrationSchema>
export type ConnectSquare = z.infer<typeof ConnectSquareSchema>
export type InitiateOAuth = z.infer<typeof InitiateOAuthSchema>
export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>
