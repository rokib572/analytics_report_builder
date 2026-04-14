import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { bulkSetPermissionsForUser, getUser } from "@analytics/database"
import { BulkSetPermissionsSchema } from "@analytics/validators"
import type { AuthEnv } from "../../middleware/auth"
import { db } from "../../lib/db"
import { assertCanManagePermissions } from "./authorization"

const router = new Hono<AuthEnv>().put(
  "/users/:userId",
  zValidator("json", BulkSetPermissionsSchema),
  async (context) => {
    const customerId = context.get("customerId")
    const user = context.get("user")
    const userId = context.req.param("userId")
    const targetUser = await getUser(db, { customerId, id: userId })

    assertCanManagePermissions(user, customerId, targetUser)

    const body = context.req.valid("json")
    const data = await bulkSetPermissionsForUser(db, customerId, userId, body.permissions)

    return context.json({ success: true, data })
  },
)

export default router
