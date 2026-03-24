import { type DbClient, upsertLocation } from "@analytics/database"
import { fetchAllLocations } from "@analytics/square"
import { computeContentHash } from "../utils/content-hash"

export const syncLocations = async (
  db: DbClient,
  customerId: string,
): Promise<{ synced: number; unchanged: number }> => {
  const response = await fetchAllLocations(customerId)
  const squareLocations = response.locations ?? []

  let synced = 0
  let unchanged = 0

  for (const loc of squareLocations) {
    const hashInput = {
      id: loc.id,
      name: loc.name,
      address: loc.address,
      status: loc.status,
      timezone: loc.timezone,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertLocation(db, customerId, {
      squareId: loc.id!,
      name: loc.name ?? "",
      address: (loc.address as Record<string, unknown>) ?? null,
      status: loc.status ?? "ACTIVE",
      timezone: loc.timezone ?? null,
      contentHash,
    })

    if (result) {
      synced++
    } else {
      unchanged++
    }
  }

  return { synced, unchanged }
}
