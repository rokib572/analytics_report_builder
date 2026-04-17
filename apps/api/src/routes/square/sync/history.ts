import { Hono } from "hono"
import { validator } from "hono/validator"
import { z } from "zod"
import { getSyncRunWithDetails, listSyncRuns } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requireRole } from "../../../middleware/require-role"
import { db } from "../../../lib/db"

const listSyncRunsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const router = new Hono<AuthEnv>()
  .use(requireRole("system_admin"))
  .get(
    "/",
    validator("query", (input) => listSyncRunsQuerySchema.parse(input)),
    async (context) => {
      const customerId = context.get("customerId")
      const { page, limit } = context.req.valid("query")
      const result = await listSyncRuns(db, customerId, { page, limit })

      return context.json(result)
    },
  )
  .get("/:runId", async (context) => {
    const customerId = context.get("customerId")
    const runId = context.req.param("runId")
    const result = await getSyncRunWithDetails(db, customerId, runId)

    if (!result) {
      return context.json({ message: "Sync run not found" }, 404)
    }

    return context.json(result)
  })

export default router
