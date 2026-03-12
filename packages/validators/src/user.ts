import { z } from "zod"

export const UserRoleSchema = z.enum(["owner", "admin", "member"])

export const UserSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema.default("member"),
})

export type User = z.infer<typeof UserSchema>
export type UserRole = z.infer<typeof UserRoleSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
