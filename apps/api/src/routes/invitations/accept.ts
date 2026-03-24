import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { getInvitationByToken, createUser, updateInvitationStatus } from "@analytics/database"
import { AcceptInvitationSchema } from "@analytics/validators"
import { DomainError } from "@analytics/shared-libs"
import type { AuthEnv } from "../../middleware/auth"
import { db } from "../../lib/db"

const acceptInvitationRouter = new Hono<AuthEnv>().post(
  "/",
  zValidator("json", AcceptInvitationSchema),
  async (context) => {
    const user = context.get("user")
    const betterAuthUserId = context.get("betterAuthUserId")
    const { token } = context.req.valid("json")

    const invitation = await getInvitationByToken(db, { token })

    if (!invitation) {
      throw DomainError.makeError({
        code: "NOT_FOUND",
        message: "Invitation not found",
        clientSafeMessage: "Invitation not found.",
      })
    }

    if (invitation.status !== "pending") {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: `Invitation already ${invitation.status}`,
        clientSafeMessage: `This invitation has already been ${invitation.status}.`,
      })
    }

    if (new Date(invitation.expiresAt) <= new Date()) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: "Invitation has expired",
        clientSafeMessage: "This invitation has expired.",
      })
    }

    if (invitation.email !== user.email) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: `Invitation email mismatch: expected ${invitation.email}, got ${user.email}`,
        clientSafeMessage: "This invitation was sent to a different email address.",
      })
    }

    // Create a new app user for the invitation's customer, linked to the same BA account
    await createUser(db, invitation.customerId, {
      email: invitation.email,
      name: user.name,
      role: invitation.role,
      betterAuthUserId,
    })

    await updateInvitationStatus(db, {
      id: invitation.id,
      status: "accepted",
      acceptedAt: new Date(),
    })

    return context.json({ success: true })
  },
)

export default acceptInvitationRouter
