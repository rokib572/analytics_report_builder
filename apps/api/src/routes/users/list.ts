import { Hono } from "hono"
import { listUsers } from "@analytics/database"
import type { AuthEnv } from "../../middleware/auth"
import { requireRole } from "../../middleware/require-role"
import { db } from "../../lib/db"

const usersRouter = new Hono<AuthEnv>()
  .use(requireRole("owner", "admin", "system_admin"))
  .get("/", async (context) => {
    const customerId = context.get("customerId")

    const data = await listUsers(db, customerId)

    return context.json({ success: true, data })
  })

export default usersRouter
