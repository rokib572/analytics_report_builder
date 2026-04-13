import { Hono } from "hono"
import { getLatestBackfill } from "@analytics/database"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"

const router = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .get("/", async (context) => {
    const customerId = context.get("customerId")
    const backfill = await getLatestBackfill(db, customerId)

    return context.json({ backfill })
  })

export default router
