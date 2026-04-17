import { Hono } from "hono"
import { validator } from "hono/validator"
import { z } from "zod"
import { listWebhookLogs } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requireRole } from "../../../middleware/require-role"
import { db } from "../../../lib/db"

const webhookHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  eventType: z.string().min(1).optional(),
  processed: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
})

const router = new Hono<AuthEnv>().use(requireRole("system_admin")).get(
  "/",
  validator("query", (input) => webhookHistoryQuerySchema.parse(input)),
  async (context) => {
    const customerId = context.get("customerId")
    const { page, limit, eventType, processed } = context.req.valid("query")
    const result = await listWebhookLogs(db, customerId, {
      page,
      limit,
      eventType,
      processed,
    })

    return context.json(result)
  },
)

export default router
