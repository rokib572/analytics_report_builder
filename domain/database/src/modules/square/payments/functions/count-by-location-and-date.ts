import { and, count, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { payments } from "../schema"

export const countPaymentsByLocationAndDate = async (
  db: DbClient,
  locationId: string,
  saleDate: string,
): Promise<number> => {
  const startAt = new Date(`${saleDate}T00:00:00.000Z`)
  const endAt = new Date(`${saleDate}T23:59:59.999Z`)

  const [row] = await db
    .select({ count: count() })
    .from(payments)
    .where(
      and(
        eq(payments.locationId, locationId),
        gte(payments.createdAt, startAt),
        lte(payments.createdAt, endAt),
      ),
    )

  return Number(row?.count ?? 0)
}
