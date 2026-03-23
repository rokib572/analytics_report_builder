import { Hono } from "hono"
import { listCustomers } from "@analytics/database"
import type { AuthEnv } from "../../middleware/auth"
import { requireRole } from "../../middleware/require-role"
import { db } from "../../lib/db"

const listCustomersRouter = new Hono<AuthEnv>()
  .use(requireRole("system_admin"))
  .get("/", async (context) => {
    const data = await listCustomers(db)
    return context.json({ success: true, data })
  })

export default listCustomersRouter
