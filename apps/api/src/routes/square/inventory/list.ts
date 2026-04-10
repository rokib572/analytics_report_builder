import { Hono } from "hono"
import { validator } from "hono/validator"
import { listInventoryCountsQuerySchema } from "@analytics/validators"
import { listInventoryCounts } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const listInventoryRouter = new Hono<AuthEnv>().use(requirePermission("inventory", "view")).get(
  "/",
  validator("query", (input) => listInventoryCountsQuerySchema.parse(input)),
  async (context) => {
    const customerId = context.get("customerId")
    const { page, limit, locationId, search } = context.req.valid("query")
    const { items, totalCount } = await listInventoryCounts(db, customerId, {
      page,
      limit,
      locationId,
      search,
    })

    return context.json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        totalCount,
      },
    })
  },
)

export default listInventoryRouter
