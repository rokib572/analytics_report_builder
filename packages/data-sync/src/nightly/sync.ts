import {
  type DbClient,
  createSyncLog,
  getLocationSquareIdMap,
  listRetryDates,
  listActiveSquareCustomerIds,
  upsertDailySales,
} from "@analytics/database"
import { batchSearchOrders } from "@analytics/square"
import { aggregateOrdersToDaily } from "../aggregator/daily"
import { reconcile } from "../reconciler/reconcile"
import { syncCatalog } from "../square/catalog/sync"
import { syncCustomers } from "../square/customers/sync"
import { syncInventory } from "../square/inventory/sync"
import { syncOrders } from "../square/orders/sync"
import { syncPayments } from "../square/payments/sync"
import { syncRefunds } from "../square/refunds/sync"

const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - daysAgo)
  return date.toISOString().split("T")[0]!
}

const toRfc3339Range = (date: string) => ({
  startAt: `${date}T00:00:00.000Z`,
  endAt: `${date}T23:59:59.999Z`,
})

const createTypeErrorLog = async (
  db: DbClient,
  customerId: string,
  syncType: string,
  date: string,
  error: unknown,
) =>
  createSyncLog(db, {
    customerId,
    syncType,
    locationId: null,
    dateFrom: date,
    dateTo: date,
    squareCount: null,
    dbCount: null,
    discrepancy: null,
    ordersFetched: null,
    status: "error",
    errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
  })

const reconcileDate = async (
  db: DbClient,
  customerId: string,
  targetDate: string,
): Promise<void> => {
  const { startAt, endAt } = toRfc3339Range(targetDate)
  const locationMap = await getLocationSquareIdMap(db, customerId)

  for (const [squareLocationId, internalLocationId] of locationMap.entries()) {
    try {
      const { squareCount, dbCount, discrepancy } = await reconcile(
        db,
        customerId,
        squareLocationId,
        internalLocationId,
        targetDate,
      )

      if (discrepancy !== 0) {
        await syncOrders(db, customerId, startAt, endAt, [squareLocationId])

        const orders = await batchSearchOrders(customerId, [squareLocationId], startAt, endAt)
        const singleLocationMap = new Map([[squareLocationId, internalLocationId]])
        const dailyPayloads = aggregateOrdersToDaily(orders, singleLocationMap, "nightly")

        for (const payload of dailyPayloads) {
          await upsertDailySales(db, customerId, payload)
        }

        await createSyncLog(db, {
          customerId,
          syncType: "nightly",
          locationId: internalLocationId,
          dateFrom: targetDate,
          dateTo: targetDate,
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
        dateFrom: targetDate,
        dateTo: targetDate,
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
        dateFrom: targetDate,
        dateTo: targetDate,
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

export const nightlySync = async (db: DbClient): Promise<void> => {
  const customerIds = await listActiveSquareCustomerIds(db)
  const yesterday = getDateDaysAgo(1)
  const retryFloor = getDateDaysAgo(7)

  for (const customerId of customerIds) {
    const retryDates = await listRetryDates(db, customerId, "nightly", retryFloor)
    const datesToProcess = [...new Set([yesterday, ...retryDates])].sort()

    try {
      await syncCatalog(db, customerId)
    } catch (error) {
      await createTypeErrorLog(db, customerId, "nightly_catalog", yesterday, error)
    }

    try {
      await syncCustomers(db, customerId)
    } catch (error) {
      await createTypeErrorLog(db, customerId, "nightly_customers", yesterday, error)
    }

    for (const targetDate of datesToProcess) {
      await reconcileDate(db, customerId, targetDate)

      const syncRange = toRfc3339Range(targetDate)

      try {
        await syncPayments(db, customerId, syncRange.startAt, syncRange.endAt)
      } catch (error) {
        await createTypeErrorLog(db, customerId, "nightly_payments", targetDate, error)
      }

      try {
        await syncRefunds(db, customerId, syncRange.startAt, syncRange.endAt)
      } catch (error) {
        await createTypeErrorLog(db, customerId, "nightly_refunds", targetDate, error)
      }

      try {
        await syncInventory(db, customerId, syncRange.startAt, syncRange.endAt)
      } catch (error) {
        await createTypeErrorLog(db, customerId, "nightly_inventory", targetDate, error)
      }
    }
  }
}
