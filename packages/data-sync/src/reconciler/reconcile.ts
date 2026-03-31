import { type DbClient, countOrdersByLocationAndDate } from "@analytics/database"
import { batchSearchOrders } from "@analytics/square"

export const reconcile = async (
  db: DbClient,
  customerId: string,
  squareLocationId: string,
  internalLocationId: string,
  date: string,
): Promise<{ squareCount: number; dbCount: number; discrepancy: number }> => {
  const startAt = `${date}T00:00:00.000Z`
  const endAt = `${date}T23:59:59.999Z`
  const squareCount = (await batchSearchOrders(customerId, [squareLocationId], startAt, endAt))
    .length
  const dbCount = await countOrdersByLocationAndDate(db, internalLocationId, date)

  return {
    squareCount,
    dbCount,
    discrepancy: squareCount - dbCount,
  }
}
