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

export const ConnectSquareSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  environment: AppIntegrationEnvironmentSchema.default("sandbox"),
})

export type AppIntegration = z.infer<typeof AppIntegrationSchema>
export type AppIntegrationEnvironment = z.infer<typeof AppIntegrationEnvironmentSchema>
export type ConnectSquare = z.infer<typeof ConnectSquareSchema>
