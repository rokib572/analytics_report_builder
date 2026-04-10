import { Hono } from "hono"
import { getLatestBackfill } from "@analytics/database"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"

const router = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")
  const backfill = await getLatestBackfill(db, customerId)

  return context.json({ backfill })
})

export default router
