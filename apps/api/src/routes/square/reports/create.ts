import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createSavedReport } from "@analytics/database"
import { CreateSavedReportSchema } from "@analytics/validators"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const router = new Hono<AuthEnv>()
  .use(requirePermission("reports", "create"))
  .post("/", zValidator("json", CreateSavedReportSchema), async (context) => {
    const customerId = context.get("customerId")
    const data = context.req.valid("json")
    const savedReport = await createSavedReport(db, customerId, data)

    return context.json({ success: true, data: savedReport }, 201)
  })

export default router
