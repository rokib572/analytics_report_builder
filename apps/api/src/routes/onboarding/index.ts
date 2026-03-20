import { Hono } from "hono"
import { updateCustomer } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"
import { schema } from "./input.schema"
import { schemaValidator } from "../../middleware/schema-validator"

const onboardingRouter = new Hono<AuthEnv>().post(
  "/",
  schemaValidator("json", schema),
  async (context) => {
    const data = context.req.valid("json")
    const customerId = context.get("customerId")

    const customer = await updateCustomer(db, customerId, data)

    if (!customer) {
      return context.json({ error: "Customer not found" }, 404)
    }

    return context.json({ success: true })
  },
)

export default onboardingRouter
