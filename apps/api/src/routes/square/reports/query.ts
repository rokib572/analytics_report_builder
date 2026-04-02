import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { ReportConfigSchema } from "@analytics/validators"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"

const router = new Hono<AuthEnv>()
  .use(requirePermission("reports", "view"))
  .post("/", zValidator("json", ReportConfigSchema), (context) => {
    // TODO: implement
    // 1. Parse validated ReportConfig from body
    // 2. Build dynamic Drizzle query from config.metrics + config.rows + config.columns + config.filters + config.dateRange
    // 3. Execute query against daily_sales (and order_line_items for channel splits)
    // 4. Shape result into { columns: string[], rows: Record<string, unknown>[] }
    // 5. Return ReportQueryResult
    return context.json({ columns: [], rows: [], generatedAt: new Date().toISOString() })
  })

export default router
