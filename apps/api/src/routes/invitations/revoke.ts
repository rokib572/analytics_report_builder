import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { revokeInvitation } from "@analytics/database"
import type { AuthEnv } from "../../middleware/auth"
import { requireRole } from "../../middleware/require-role"
import { db } from "../../lib/db"

const revokeInvitationRouter = new Hono<AuthEnv>()
  .use(requireRole("owner", "admin", "system_admin"))
  .post("/", zValidator("json", z.object({ id: z.string() })), async (context) => {
    const customerId = context.get("customerId")
    const { id } = context.req.valid("json")

    const data = await revokeInvitation(db, customerId, { id })

    return context.json({ success: true, data })
  })

export default revokeInvitationRouter
