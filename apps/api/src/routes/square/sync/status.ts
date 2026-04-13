import { Hono } from "hono"
import { validator } from "hono/validator"
import { z } from "zod"
import { listSyncLogs } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import { requireRole } from "../../../middleware/require-role"
import { db } from "../../../lib/db"

const listSyncStatusQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  locationId: z.string().min(1).optional(),
})

const router = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .use(requireRole("system_admin"))
  .get(
    "/",
    validator("query", (input) => listSyncStatusQuerySchema.parse(input)),
    async (context) => {
      const customerId = context.get("customerId")
      const { page, limit, locationId } = context.req.valid("query")
      const { syncLogs, totalCount } = await listSyncLogs(db, customerId, {
        page,
        limit,
        locationId,
      })

      return context.json({ syncLogs, totalCount })
    },
  )

export default router
