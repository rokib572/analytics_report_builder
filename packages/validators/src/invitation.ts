import { z } from "zod"

export const InvitableRoleSchema = z.enum(["member", "admin"])

export const InvitationStatusSchema = z.enum(["pending", "accepted", "expired", "revoked"])

export const CreateInvitationSchema = z.object({
  email: z.string().email(),
  role: InvitableRoleSchema.default("member"),
  expiresInHours: z.number().min(1).max(168).default(48),
})

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1),
})

export const InvitationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  email: z.string().email(),
  role: InvitableRoleSchema,
  token: z.string(),
  status: InvitationStatusSchema,
  invitedBy: z.string(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type InvitableRole = z.infer<typeof InvitableRoleSchema>
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>
export type CreateInvitation = z.infer<typeof CreateInvitationSchema>
export type AcceptInvitation = z.infer<typeof AcceptInvitationSchema>
export type Invitation = z.infer<typeof InvitationSchema>
