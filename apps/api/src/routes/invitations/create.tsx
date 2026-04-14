import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { getCustomer, createInvitation } from "@analytics/database"
import { sendEmail } from "@analytics/email"
import { InvitationEmail } from "../../emails/invitation-email"
import { CreateInvitationSchema } from "@analytics/validators"
import type { AuthEnv } from "../../middleware/auth"
import { requireRole } from "../../middleware/require-role"
import { db } from "../../lib/db"

const createInvitationRouter = new Hono<AuthEnv>()
  .use(requireRole("owner", "admin", "system_admin"))
  .post("/", zValidator("json", CreateInvitationSchema), async (context) => {
    const user = context.get("user")
    const customerId = context.get("customerId")
    const { email, role, expiresInHours } = context.req.valid("json")

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    const invitation = await createInvitation(db, customerId, {
      email,
      role,
      invitedBy: user.id,
      expiresAt,
    })

    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:5173"
    const link = `${baseUrl}/accept-invite?token=${invitation.token}`
    const customer = await getCustomer(db, customerId)
    const customerName = customer?.companyName ?? customer?.name ?? "Analytics"
    let emailSent = false

    if (process.env.NODE_ENV === "production") {
      try {
        await sendEmail({
          to: email,
          subject: `${user.name} invited you to ${customerName} on Analytics`,
          template: (
            <InvitationEmail
              inviterName={user.name}
              inviterEmail={user.email}
              customerName={customerName}
              role={role}
              acceptUrl={link}
              expiresAt={expiresAt}
            />
          ),
        })
        emailSent = true
      } catch (error) {
        console.error("Invitation email send failed", {
          invitationId: invitation.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    } else {
      console.info("Invitation email skipped (non-production env)", {
        invitationId: invitation.id,
        acceptUrl: link,
      })
    }

    return context.json({ success: true, data: { ...invitation, link, emailSent } })
  })

export default createInvitationRouter
