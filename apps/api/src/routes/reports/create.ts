import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { CreateSavedReportSchema } from "@analytics/validators"

const router = new Hono()

router.post("/", zValidator("json", CreateSavedReportSchema), (c) => {
  // TODO: save report config to DB → return SavedReport
  return c.json({})
})

export default router
