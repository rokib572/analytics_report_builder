import { Hono } from "hono"
import { getUser, listPermissions } from "@analytics/database"
import type { AuthEnv } from "../../middleware/auth"
import { db } from "../../lib/db"
import { assertCanManagePermissions } from "./authorization"

const router = new Hono<AuthEnv>().get("/users/:userId", async (context) => {
  const customerId = context.get("customerId")
  const user = context.get("user")
  const userId = context.req.param("userId")
  const targetUser = await getUser(db, { customerId, id: userId })

  assertCanManagePermissions(user, customerId, targetUser)

  const data = await listPermissions(db, customerId, userId)

  return context.json({ success: true, data })
})

export default router
