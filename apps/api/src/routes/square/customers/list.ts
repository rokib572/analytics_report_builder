import { Hono } from "hono"
import { validator } from "hono/validator"
import { listSquareCustomers as listSquareCustomersDB } from "@analytics/database"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"
import { listSquareCustomersQuerySchema } from "./schema.output"

const listSquareCustomers = new Hono<AuthEnv>()
  .use(requirePermission("square-customers", "view"))
  .get(
    "/",
    validator("query", (input) => listSquareCustomersQuerySchema.parse(input)),
    async (context) => {
      const customerId = context.get("customerId")
      const { page, limit, name, phoneNumber, emailAddress, creationTimeFrom, creationTimeTo } =
        context.req.valid("query")
      const { customers, totalCount } = await listSquareCustomersDB(db, customerId, {
        page,
        limit,
        name,
        phoneNumber,
        emailAddress,
        creationTimeFrom,
        creationTimeTo,
      })

      return context.json({
        success: true,
        customers,
        pagination: {
          page,
          limit,
          totalCount,
        },
      })
    },
  )

export default listSquareCustomers
