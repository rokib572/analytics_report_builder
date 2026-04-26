import { Hono } from "hono"
import { listCatalogCategories } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const router = new Hono<AuthEnv>()
  .use(requirePermission("reports", "view"))
  .get("/", async (context) => {
    const customerId = context.get("customerId")
    const data = await listCatalogCategories(db, customerId)

    return context.json({ success: true, data })
  })

export default router
