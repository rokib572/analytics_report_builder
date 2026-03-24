import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { getInvitationByToken, getCustomer, baUserExistsByEmail } from "@analytics/database"
import { db } from "../../lib/db"

const validateInvitationRouter = new Hono().get(
  "/",
  zValidator("query", z.object({ token: z.string().min(1) })),
  async (context) => {
    const { token } = context.req.valid("query")

    const invitation = await getInvitationByToken(db, { token })

    if (!invitation) {
      return context.json({ valid: false as const, reason: "Invitation not found." })
    }

    if (invitation.status !== "pending") {
      return context.json({
        valid: false as const,
        reason: `Invitation has already been ${invitation.status}.`,
      })
    }

    if (new Date(invitation.expiresAt) <= new Date()) {
      return context.json({ valid: false as const, reason: "Invitation has expired." })
    }

    const customer = await getCustomer(db, invitation.customerId)
    const existingAccount = await baUserExistsByEmail(db, { email: invitation.email })

    return context.json({
      valid: true as const,
      email: invitation.email,
      role: invitation.role,
      customerName: customer?.companyName ?? customer?.name ?? "",
      existingAccount,
    })
  },
)

export default validateInvitationRouter
