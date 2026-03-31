import { type DbClient, getLocationSquareIdMap } from "@analytics/database"
import type { ValidateWebhookLocationResult } from "./types"

export const validateWebhookLocation = async (
  db: DbClient,
  customerId: string,
  squareLocationId: string,
): Promise<ValidateWebhookLocationResult> => {
  const locationMap = await getLocationSquareIdMap(db, customerId)
  const internalLocationId = locationMap.get(squareLocationId)

  if (!internalLocationId) {
    return { valid: false, reason: "location_not_mapped" }
  }

  return { valid: true, locationId: internalLocationId, locationMap }
}
