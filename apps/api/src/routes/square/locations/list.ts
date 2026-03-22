import { Hono } from "hono"
import { fetchAllLocations } from "@analytics/square"
import type { AuthEnv } from "../../../middleware/auth"
import { DomainError } from "@analytics/shared-libs"

const listSquareLocation = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")
  const locationResponse = await fetchAllLocations(customerId)

  if (locationResponse.errors) {
    throw DomainError.makeError({
      code: "EXTERNAL_ERROR",
      message: "Error fetching locations from Square API",
      clientSafeMessage:
        "There was an error fetching your Square locations. Please try again later.",
      additionalContext: {
        errors: JSON.stringify(locationResponse.errors),
      },
    })
  }

  if (!locationResponse.locations) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: "No locations data returned from Square API",
      clientSafeMessage: "Location data not found.",
    })
  }

  return context.json({
    success: true,
    locations: locationResponse.locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      timezone: loc.timezone,
      status: loc.status,
      country: loc.country,
      currency: loc.currency,
      business_name: loc.businessName,
      type: loc.type,
    })),
  })
})

export default listSquareLocation
