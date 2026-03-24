import { Hono } from "hono"
import { fetchAllSquareCustomers } from "@analytics/square"
import type { AuthEnv } from "../../../middleware/auth"
import { DomainError } from "@analytics/shared-libs"
import { requirePermission } from "../../../middleware/permission"

const listSquareCustomers = new Hono<AuthEnv>()
  .use(requirePermission("square-customers", "view"))
  .get("/", async (context) => {
    const customerId = context.get("customerId")

    try {
      const customerResponse = await fetchAllSquareCustomers(customerId)

      return context.json({
        success: true,
        customers: customerResponse.map((customer) => ({
          id: customer.id,
          givenName: customer.givenName,
          familyName: customer.familyName,
          email: customer.emailAddress,
          phone: customer.phoneNumber,
          createdAt: customer.createdAt,
        })),
      })
    } catch (error) {
      throw DomainError.makeError({
        code: "EXTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error fetching customers from Square API",
        clientSafeMessage: "Something went wrong while fetching customer data from Square API.",
      })
    }
  })

export default listSquareCustomers
