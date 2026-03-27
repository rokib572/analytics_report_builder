import { Hono } from "hono"
import { validator } from "hono/validator"
import { listSquareLocationQuerySchema } from "@analytics/validators"
import { listLocations } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const listSquareLocation = new Hono<AuthEnv>().use(requirePermission("locations", "view")).get(
  "/",
  validator("query", (input) => listSquareLocationQuerySchema.parse(input)),
  async (context) => {
    const customerId = context.get("customerId")
    const { page, limit, search } = context.req.valid("query")
    const { locations, totalCount } = await listLocations(db, customerId, { page, limit, search })

    return context.json({
      success: true,
      locations,
      pagination: {
        page,
        limit,
        totalCount,
      },
      filters: {
        search,
      },
    })
  },
)

export default listSquareLocation
