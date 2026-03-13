import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { updateCustomer } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"

const onboardingRouter = new Hono<AuthEnv>().post(
  "/",
  zValidator(
    "json",
    z.object({
      companyName: z.string().min(1),
      businessType: z.string().min(1),
      businessSize: z.string().min(1),
      phone: z.string().optional(),
      address: z.string().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid("json")
    const customerId = c.get("customerId")

    const customer = await updateCustomer(db, customerId, data)

    if (!customer) {
      return c.json({ error: "Customer not found" }, 404)
    }

    return c.json({ success: true })
  },
)

export default onboardingRouter
