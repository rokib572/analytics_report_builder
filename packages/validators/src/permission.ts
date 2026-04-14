import { z } from "zod"

export const ResourceSchema = z.enum([
  "sales",
  "locations",
  "orders",
  "sync",
  "api_keys",
  "users",
  "reports",
  "square-customers",
  "inventory",
])
export const ActionSchema = z.enum(["view", "create", "update", "delete"])
export const PermissionResourceSchema = ResourceSchema
export const PermissionActionSchema = ActionSchema

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

export const PermissionEntrySchema = z.object({
  resource: ResourceSchema,
  action: ActionSchema,
  allowed: z.boolean(),
})

export const BulkSetPermissionsSchema = z.object({
  permissions: z.array(PermissionEntrySchema),
})

export type Permission = z.infer<typeof PermissionSchema>
export type Resource = z.infer<typeof ResourceSchema>
export type Action = z.infer<typeof ActionSchema>
export type PermissionEntry = z.infer<typeof PermissionEntrySchema>
