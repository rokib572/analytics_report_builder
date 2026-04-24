import { asc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type ChannelDto, channels } from "../schema"

export const listChannels = async (db: DbClient, customerId: string): Promise<ChannelDto[]> => {
  const rows = await db
    .select()
    .from(channels)
    .where(eq(channels.customerId, customerId))
    .orderBy(asc(channels.displayName))

  return rows as ChannelDto[]
}
