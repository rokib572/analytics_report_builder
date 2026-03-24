import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LocationDto, type LocationPayload, locations } from "../schema"

export const upsertLocation = async (
  db: DbClient,
  customerId: string,
  data: LocationPayload,
): Promise<LocationDto | undefined> => {
  const [location] = await db
    .insert(locations)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: locations.squareId,
      set: {
        name: sql`excluded.name`,
        address: sql`excluded.address`,
        status: sql`excluded.status`,
        timezone: sql`excluded.timezone`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${locations.contentHash}`,
    })
    .returning()
  return location
}
