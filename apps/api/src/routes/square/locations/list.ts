import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { listLocations } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const listSquareLocationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().default(""), // search by location name, optional, defaults to empty string (no search)
})

const listSquareLocation = new Hono<AuthEnv>()
  .use(requirePermission("locations", "view"))
  .get("/", zValidator("query", listSquareLocationQuerySchema), async (context) => {
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
  })

export default listSquareLocation
