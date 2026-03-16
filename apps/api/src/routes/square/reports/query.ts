import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { ReportConfigSchema } from "@analytics/validators"

const router = new Hono()

router.post("/", zValidator("json", ReportConfigSchema), (c) => {
  // TODO: implement
  // 1. Parse validated ReportConfig from body
  // 2. Build dynamic Drizzle query from config.metrics + config.rows + config.columns + config.filters + config.dateRange
  // 3. Execute query against daily_sales (and order_line_items for channel splits)
  // 4. Shape result into { columns: string[], rows: Record<string, unknown>[] }
  // 5. Return ReportQueryResult
  return c.json({ columns: [], rows: [], generatedAt: new Date().toISOString() })
})

export default router
