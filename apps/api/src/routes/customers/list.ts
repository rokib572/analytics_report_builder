import { Hono } from "hono"
import { validator } from "hono/validator"
import { z } from "zod"
import { listCustomers } from "@analytics/database"
import type { AuthEnv } from "../../middleware/auth"
import { requireRole } from "../../middleware/require-role"
import { db } from "../../lib/db"

const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const listCustomersRouter = new Hono<AuthEnv>().use(requireRole("system_admin")).get(
  "/",
  validator("query", (input) => listCustomersQuerySchema.parse(input)),
  async (context) => {
    const { page, limit } = context.req.valid("query")
    const { customers, totalCount } = await listCustomers(db, { page, limit })

    return context.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        totalCount,
      },
    })
  },
)

export default listCustomersRouter
