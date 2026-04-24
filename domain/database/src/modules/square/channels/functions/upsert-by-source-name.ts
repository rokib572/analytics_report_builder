import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type ChannelDto, channels } from "../schema"

export const upsertChannelBySourceName = async (
  db: DbClient,
  customerId: string,
  squareSourceName: string,
): Promise<ChannelDto> => {
  const [channel] = await db
    .insert(channels)
    .values({
      customerId,
      squareSourceName,
      displayName: squareSourceName,
    })
    .onConflictDoUpdate({
      target: [channels.customerId, channels.squareSourceName],
      set: { updatedAt: sql`now()` },
    })
    .returning()

  return channel as ChannelDto
}
