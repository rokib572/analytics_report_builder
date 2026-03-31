import {
  type DbClient,
  createSyncLog,
  getLocationSquareIdMap,
  listActiveSquareCustomerIds,
  upsertDailySales,
} from "@analytics/database"
import { batchSearchOrders } from "@analytics/square"
import { aggregateOrdersToDaily } from "../aggregator/daily"
import { reconcile } from "../reconciler/reconcile"
import { syncOrders } from "../square/orders/sync"

const getYesterdayDate = (): string => {
  const yesterday = new Date()
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return yesterday.toISOString().split("T")[0]
}

export const nightlySync = async (db: DbClient): Promise<void> => {
  const customerIds = await listActiveSquareCustomerIds(db)
  const yesterday = getYesterdayDate()
  const startAt = `${yesterday}T00:00:00.000Z`
  const endAt = `${yesterday}T23:59:59.999Z`

  for (const customerId of customerIds) {
    const locationMap = await getLocationSquareIdMap(db, customerId)

    for (const [squareLocationId, internalLocationId] of locationMap.entries()) {
      try {
        const { squareCount, dbCount, discrepancy } = await reconcile(
          db,
          customerId,
          squareLocationId,
          internalLocationId,
          yesterday,
        )

        if (discrepancy !== 0) {
          await syncOrders(db, customerId, startAt, endAt)

          const orders = await batchSearchOrders(customerId, [squareLocationId], startAt, endAt)
          const dailyPayloads = aggregateOrdersToDaily(orders, locationMap, "nightly")

          for (const payload of dailyPayloads) {
            await upsertDailySales(db, customerId, payload)
          }

          await createSyncLog(db, {
            customerId,
            syncType: "nightly",
            locationId: internalLocationId,
            dateFrom: yesterday,
            dateTo: yesterday,
            squareCount,
            dbCount,
            discrepancy,
            ordersFetched: orders.length,
            status: "repaired",
            errorMessage: null,
          })

          continue
        }

        await createSyncLog(db, {
          customerId,
          syncType: "nightly",
          locationId: internalLocationId,
          dateFrom: yesterday,
          dateTo: yesterday,
          squareCount,
          dbCount,
          discrepancy,
          ordersFetched: squareCount,
          status: "verified",
          errorMessage: null,
        })
      } catch (error) {
        await createSyncLog(db, {
          customerId,
          syncType: "nightly",
          locationId: internalLocationId,
          dateFrom: yesterday,
          dateTo: yesterday,
          squareCount: null,
          dbCount: null,
          discrepancy: null,
          ordersFetched: null,
          status: "error",
          errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
        })
      }
    }
  }
}
