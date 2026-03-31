import { Hono } from "hono"
import { getOrder } from "@analytics/database"
import { DomainError } from "@analytics/shared-libs"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const getOrderRouter = new Hono<AuthEnv>()
  .use(requirePermission("orders", "view"))
  .get("/:id", async (context) => {
    const customerId = context.get("customerId")
    const id = context.req.param("id")

    const result = await getOrder(db, customerId, id)

    if (!result) {
      throw DomainError.makeError({
        code: "NOT_FOUND",
        message: `Order ${id} not found for customer ${customerId}`,
        clientSafeMessage: "Order not found.",
      })
    }

    return context.json({ success: true, order: result.order, lineItems: result.lineItems })
  })

export default getOrderRouter
