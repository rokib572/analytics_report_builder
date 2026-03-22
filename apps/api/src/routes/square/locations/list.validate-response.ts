import type { fetchAllLocations } from "@analytics/square"
import { DomainError } from "@analytics/shared-libs"

type ListLocationsResponse = Awaited<ReturnType<typeof fetchAllLocations>>

export const validateListLocationsResponse = (locationResponse: ListLocationsResponse) => {
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

  return locationResponse.locations
}
