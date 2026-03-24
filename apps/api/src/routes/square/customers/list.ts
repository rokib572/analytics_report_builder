import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { listSquareCustomers as listSquareCustomersDB } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const listSquareCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const listSquareCustomers = new Hono<AuthEnv>()
  .use(requirePermission("square-customers", "view"))
  .get("/", zValidator("query", listSquareCustomersQuerySchema), async (context) => {
    const customerId = context.get("customerId")
    const { page, limit } = context.req.valid("query")
    const customers = await listSquareCustomersDB(db, customerId, { page, limit })

    return context.json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
      },
    })
  })

export default listSquareCustomers
