import {
  type DbClient,
  getLocationSquareIdMap,
  getSyncLogById,
  updateSyncLog,
  upsertDailySales,
} from "@analytics/database"
import { batchSearchOrders } from "@analytics/square"
import { aggregateOrdersToDaily } from "../aggregator/daily"
import { syncCatalog } from "../square/catalog/sync"
import { syncCustomers } from "../square/customers/sync"
import { syncInventory } from "../square/inventory/sync"
import { syncOrders } from "../square/orders/sync"
import { syncPayments } from "../square/payments/sync"
import { syncRefunds } from "../square/refunds/sync"
import { getBackfillChunk } from "./chunk"

const MAX_ALL_HISTORY_MONTHS = 60
const EMPTY_CHUNK_STOP_THRESHOLD = 3

const toRfc3339Range = (startAt: string, endAt: string) => ({
  startAt: `${startAt}T00:00:00.000Z`,
  endAt: `${endAt}T23:59:59.999Z`,
})

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR"

const getAllHistoryFloor = () => {
  const floor = new Date()
  floor.setUTCMonth(floor.getUTCMonth() - MAX_ALL_HISTORY_MONTHS)
  return floor.toISOString().split("T")[0]!
}

export const getBackfillDateRange = (
  backfillScope: "30d" | "3m" | "6m" | "12m" | "24m" | "all",
) => {
  const endDate = new Date()
  const endAt = endDate.toISOString().split("T")[0]!
  const startDate = new Date(`${endAt}T00:00:00.000Z`)

  if (backfillScope === "30d") {
    startDate.setUTCDate(startDate.getUTCDate() - 29)
  } else if (backfillScope === "3m") {
    startDate.setUTCMonth(startDate.getUTCMonth() - 3)
  } else if (backfillScope === "6m") {
    startDate.setUTCMonth(startDate.getUTCMonth() - 6)
  } else if (backfillScope === "12m") {
    startDate.setUTCMonth(startDate.getUTCMonth() - 12)
  } else if (backfillScope === "24m") {
    startDate.setUTCMonth(startDate.getUTCMonth() - 24)
  } else {
    startDate.setUTCMonth(startDate.getUTCMonth() - MAX_ALL_HISTORY_MONTHS)
  }

  return {
    startAt: startDate.toISOString().split("T")[0]!,
    endAt,
  }
}

export const runBackfill = async (
  db: DbClient,
  customerId: string,
  syncLogId: string,
): Promise<void> => {
  const row = await getSyncLogById(db, syncLogId)

  if (!row || row.customerId !== customerId || row.syncType !== "backfill") {
    return
  }

  if (row.status === "verified") {
    return
  }

  const isAllHistory = (() => {
    return row.dateFrom === getAllHistoryFloor()
  })()

  await updateSyncLog(db, syncLogId, {
    status: "running",
    errorMessage: null,
  })

  try {
    await syncCatalog(db, customerId)
    await syncCustomers(db, customerId)

    let cursor = row.dateTo
    let ordersFetched = row.ordersFetched ?? 0
    let emptyStreak = 0

    while (true) {
      const chunk = getBackfillChunk(cursor, row.dateFrom)
      if (!chunk) {
        break
      }

      const syncRange = toRfc3339Range(chunk.chunkStart, chunk.chunkEnd)
      const orderResult = await syncOrders(db, customerId, syncRange.startAt, syncRange.endAt)
      await syncPayments(db, customerId, syncRange.startAt, syncRange.endAt)
      await syncRefunds(db, customerId, syncRange.startAt, syncRange.endAt)
      await syncInventory(db, customerId, syncRange.startAt, syncRange.endAt)

      const locationMap = await getLocationSquareIdMap(db, customerId)
      const squareLocationIds = [...locationMap.keys()]

      if (squareLocationIds.length > 0) {
        const orders = await batchSearchOrders(
          customerId,
          squareLocationIds,
          syncRange.startAt,
          syncRange.endAt,
        )
        const dailyPayloads = aggregateOrdersToDaily(orders, locationMap, "backfill")
        emptyStreak = orders.length === 0 ? emptyStreak + 1 : 0

        for (const payload of dailyPayloads) {
          await upsertDailySales(db, customerId, payload)
        }
      } else {
        emptyStreak++
      }

      ordersFetched += orderResult.synced

      if (chunk.isFinalChunk || (isAllHistory && emptyStreak >= EMPTY_CHUNK_STOP_THRESHOLD)) {
        await updateSyncLog(db, syncLogId, {
          dateTo: chunk.chunkStart,
          ordersFetched,
          status: "verified",
          errorMessage: null,
        })
        break
      }

      cursor = chunk.nextCursor
      await updateSyncLog(db, syncLogId, {
        dateTo: cursor,
        ordersFetched,
        status: "running",
        errorMessage: null,
      })
    }
  } catch (error) {
    await updateSyncLog(db, syncLogId, {
      status: "error",
      errorMessage: getErrorMessage(error),
    })
    throw error
  }
}
