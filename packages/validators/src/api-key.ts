import { z } from "zod"

export const ApiKeyEnvironmentSchema = z.enum(["sandbox", "live"])

export const ApiKeySchema = z.object({
  id: z.string(),
  customerId: z.string(),
  appName: z.string(),
  environment: ApiKeyEnvironmentSchema,
  isActive: z.boolean(),
  label: z.string().nullable(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
})

export const CreateApiKeySchema = z.object({
  appName: z.string(),
  keyValue: z.string().min(1),
  environment: ApiKeyEnvironmentSchema,
  label: z.string().optional(),
})

export type ApiKey = z.infer<typeof ApiKeySchema>
export type ApiKeyEnvironment = z.infer<typeof ApiKeyEnvironmentSchema>
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>
