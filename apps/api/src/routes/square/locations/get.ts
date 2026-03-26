import { Hono } from "hono"
import { getLocation } from "@analytics/database"
import { DomainError } from "@analytics/shared-libs"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const getLocationRouter = new Hono<AuthEnv>()
  .use(requirePermission("locations", "view"))
  .get("/:id", async (context) => {
    const customerId = context.get("customerId")
    const id = context.req.param("id")

    const location = await getLocation(db, customerId, id)

    if (!location) {
      throw DomainError.makeError({
        code: "NOT_FOUND",
        message: `Location ${id} not found for customer ${customerId}`,
        clientSafeMessage: "Location not found.",
      })
    }

    return context.json({ success: true, location })
  })

export default getLocationRouter
