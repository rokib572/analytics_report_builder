import {
  type DailySalesDto,
  type DbClient,
  getDailySales,
  getLocationSquareIdMap,
  upsertDailySales,
} from "@analytics/database"
import { batchSearchOrders } from "@analytics/square"
import { aggregateOrdersToDaily } from "../aggregator/daily"

const isStale = (syncedAt: Date | string): boolean => {
  const syncedTime = new Date(syncedAt).getTime()
  return syncedTime < Date.now() - 60 * 60 * 1000
}

const isToday = (date: string): boolean => date === new Date().toISOString().split("T")[0]

export const jitSync = async (
  db: DbClient,
  customerId: string,
  locationId: string,
  date: string,
): Promise<DailySalesDto | null> => {
  const cached = await getDailySales(db, customerId, locationId, date)

  if (cached) {
    if (!isToday(date)) {
      return cached
    }

    if (!isStale(cached.syncedAt)) {
      return cached
    }
  }

  const locationMap = await getLocationSquareIdMap(db, customerId)
  const squareLocationId = [...locationMap.entries()].find(
    ([, internalId]) => internalId === locationId,
  )?.[0]

  if (!squareLocationId) {
    return null
  }

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`
  const orders = await batchSearchOrders(customerId, [squareLocationId], startOfDay, endOfDay)

  if (orders.length === 0) {
    return null
  }

  const dailyPayload = aggregateOrdersToDaily(orders, locationMap, "jit").find(
    (payload) => payload.locationId === locationId && payload.saleDate === date,
  )

  if (!dailyPayload) {
    return null
  }

  await upsertDailySales(db, customerId, dailyPayload)

  return (await getDailySales(db, customerId, locationId, date)) ?? null
}
