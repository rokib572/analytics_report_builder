import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { buildReportQuery } from "@analytics/database"
import { ReportQuerySchema } from "@analytics/validators"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const router = new Hono<AuthEnv>()
  .use(requirePermission("reports", "view"))
  .post("/", zValidator("json", ReportQuerySchema), async (context) => {
    const customerId = context.get("customerId")
    const config = context.req.valid("json")
    const result = await buildReportQuery(db, customerId, config)

    return context.json(result)
  })

export default router
