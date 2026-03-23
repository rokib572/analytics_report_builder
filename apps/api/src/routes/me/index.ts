import { Hono } from "hono"
import { listPermissions } from "@analytics/database"
import { isAccountAdmin, isSystemAdmin } from "@analytics/validators"
import type { AuthEnv } from "../../middleware/auth"
import { db } from "../../lib/db"

const meRouter = new Hono<AuthEnv>().get("/", async (context) => {
  const user = context.get("user")

  // Owner/admin/system_admin have full access — no need to fetch permissions
  const permissions =
    isAccountAdmin(user.role) || isSystemAdmin(user.role)
      ? []
      : await listPermissions(db, user.customerId, user.id)

  return context.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    },
    permissions,
  })
})

export default meRouter
