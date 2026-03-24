import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createInvitation } from "@analytics/database"
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

    return context.json({ success: true, data: { ...invitation, link } })
  })

export default createInvitationRouter
