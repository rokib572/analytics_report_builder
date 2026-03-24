import { Hono } from "hono"
import { listLocations } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const listSquareLocation = new Hono<AuthEnv>()
  .use(requirePermission("locations", "view"))
  .get("/", async (context) => {
    const customerId = context.get("customerId")
    const locations = await listLocations(db, customerId)

    return context.json({ success: true, locations })
  })

export default listSquareLocation
