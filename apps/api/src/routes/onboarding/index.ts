import { Hono } from "hono"
import { validator } from "hono/validator"
import { updateCustomer } from "@analytics/database"
import { OnboardingSchema } from "@analytics/validators"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"
import { DomainError } from "@analytics/shared-libs"

const onboardingRouter = new Hono<AuthEnv>().post(
  "/",
  validator("json", (input) => OnboardingSchema.parse(input)),
  async (context) => {
    const data = context.req.valid("json")
    const customerId = context.get("customerId")

    const customer = await updateCustomer(db, customerId, data)

    if (!customer) {
      throw DomainError.makeError({
        code: "NOT_FOUND",
        message: `Customer with ID ${customerId} not found`,
        clientSafeMessage: "Customer not found. Please check your details and try again.",
        additionalContext: { customerId },
      })
    }

    return context.json({ success: true })
  },
)

export default onboardingRouter
