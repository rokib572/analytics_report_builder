import { z } from "zod"

export const ResourceSchema = z.enum(["sales", "locations", "sync", "api_keys", "users"])
export const ActionSchema = z.enum(["view", "create", "update", "delete"])

export const PermissionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  userId: z.string(),
  resource: ResourceSchema,
  action: ActionSchema,
  allowed: z.boolean(),
})

export const UpsertPermissionSchema = z.object({
  userId: z.string(),
  resource: ResourceSchema,
  action: ActionSchema,
  allowed: z.boolean(),
})

export type Permission = z.infer<typeof PermissionSchema>
export type Resource = z.infer<typeof ResourceSchema>
export type Action = z.infer<typeof ActionSchema>
