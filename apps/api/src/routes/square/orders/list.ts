import { Hono } from "hono"
import { validator } from "hono/validator"
import { listOrdersQuerySchema } from "@analytics/validators"
import { listOrders } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const listOrdersRouter = new Hono<AuthEnv>().use(requirePermission("orders", "view")).get(
  "/",
  validator("query", (input) => listOrdersQuerySchema.parse(input)),
  async (context) => {
    const customerId = context.get("customerId")
    const { page, limit, locationId, dateFrom, dateTo, state } = context.req.valid("query")
    const { orders, totalCount } = await listOrders(db, customerId, {
      page,
      limit,
      locationId,
      dateFrom,
      dateTo,
      state,
    })

    return context.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalCount,
      },
    })
  },
)

export default listOrdersRouter
