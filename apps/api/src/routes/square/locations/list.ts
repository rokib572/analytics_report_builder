import { Hono } from "hono"
import { fetchAllLocations } from "@analytics/square"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { validateListLocationsResponse } from "./list.validate-response"

const listSquareLocation = new Hono<AuthEnv>()
  .use(requirePermission("locations", "view"))
  .get("/", async (context) => {
    const customerId = context.get("customerId")
    const locationResponse = await fetchAllLocations(customerId)

    const locations = validateListLocationsResponse(locationResponse)

    return context.json({
      success: true,
      locations: locations.map((loc) => ({
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
