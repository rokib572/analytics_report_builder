import { Hono } from "hono"
import { removeSavedReport } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const router = new Hono<AuthEnv>()
  .use(requirePermission("reports", "delete"))
  .delete("/:id", async (context) => {
    const customerId = context.get("customerId")
    const id = context.req.param("id")

    await removeSavedReport(db, customerId, id)

    return context.json({ success: true })
  })

export default router
