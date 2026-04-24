import {
  type DbClient,
  completeSyncRun,
  createSyncRun,
  createSyncRunDetail,
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
import { syncLabor, type LaborSyncCollectors } from "../square/labor/sync"
import { syncOrders } from "../square/orders/sync"
import { syncPayments } from "../square/payments/sync"
import { syncRefunds } from "../square/refunds/sync"
import {
  capChangedRecordIds,
  createSyncRecordCollector,
  type SyncInventoryCollectors,
  type SyncRecordCollector,
} from "../utils/sync-collector"

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
  ordersCollector?: SyncRecordCollector,
): Promise<{ synced: number; unchanged: number; skipped: number }> => {
  const { startAt, endAt } = toRfc3339Range(targetDate)
  const locationMap = await getLocationSquareIdMap(db, customerId)
  let synced = 0
  let unchanged = 0
  let skipped = 0

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
        const orderResult = await syncOrders(
          db,
          customerId,
          startAt,
          endAt,
          [squareLocationId],
          ordersCollector,
        )
        synced += orderResult.synced
        unchanged += orderResult.unchanged
        skipped += orderResult.skipped

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

  return { synced, unchanged, skipped }
}

const createDetailFromCollector = async (
  db: DbClient,
  syncRunId: string,
  dataType: string,
  counts: {
    changedCount: number
    unchangedCount: number
    skippedCount: number
  },
  collector: SyncRecordCollector,
) =>
  await createSyncRunDetail(db, {
    syncRunId,
    dataType,
    changedCount: counts.changedCount,
    unchangedCount: counts.unchangedCount,
    failedCount: collector.failed.length,
    skippedCount: counts.skippedCount,
    changedRecordIds: capChangedRecordIds(collector.changed),
    failedRecords: collector.failed,
  })

export const nightlySync = async (db: DbClient): Promise<void> => {
  const customerIds = await listActiveSquareCustomerIds(db)
  const yesterday = getDateDaysAgo(1)
  const retryFloor = getDateDaysAgo(7)

  for (const customerId of customerIds) {
    const syncRun = await createSyncRun(db, {
      customerId,
      triggerType: "nightly",
      status: "running",
      completedAt: null,
      errorMessage: null,
    })
    const retryDates = await listRetryDates(db, customerId, "nightly", retryFloor)
    const datesToProcess = [...new Set([yesterday, ...retryDates])].sort()
    let hasErrors = false

    const catalogCollector = createSyncRecordCollector()
    const customerCollector = createSyncRecordCollector()
    const ordersCollector = createSyncRecordCollector()
    const paymentsCollector = createSyncRecordCollector()
    const refundsCollector = createSyncRecordCollector()
    const inventoryCollectors: SyncInventoryCollectors = {
      counts: createSyncRecordCollector(),
      adjustments: createSyncRecordCollector(),
      transfers: createSyncRecordCollector(),
    }
    const laborCollectors: LaborSyncCollectors = {
      timecards: createSyncRecordCollector(),
      breakTypes: createSyncRecordCollector(),
      teamMemberWages: createSyncRecordCollector(),
    }

    try {
      try {
        const result = await syncCatalog(db, customerId, catalogCollector)
        await createDetailFromCollector(
          db,
          syncRun.id,
          "catalog",
          {
            changedCount: result.synced,
            unchangedCount: result.unchanged,
            skippedCount: result.skipped,
          },
          catalogCollector,
        )
      } catch (error) {
        hasErrors = true
        catalogCollector.failed.push({
          id: "catalog",
          error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
        })
        await createTypeErrorLog(db, customerId, "nightly_catalog", yesterday, error)
        await createDetailFromCollector(
          db,
          syncRun.id,
          "catalog",
          {
            changedCount: 0,
            unchangedCount: 0,
            skippedCount: 0,
          },
          catalogCollector,
        )
      }

      try {
        const result = await syncCustomers(db, customerId, customerCollector)
        await createDetailFromCollector(
          db,
          syncRun.id,
          "customers",
          {
            changedCount: result.synced,
            unchangedCount: result.unchanged,
            skippedCount: result.skipped,
          },
          customerCollector,
        )
      } catch (error) {
        hasErrors = true
        customerCollector.failed.push({
          id: "customers",
          error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
        })
        await createTypeErrorLog(db, customerId, "nightly_customers", yesterday, error)
        await createDetailFromCollector(
          db,
          syncRun.id,
          "customers",
          {
            changedCount: 0,
            unchangedCount: 0,
            skippedCount: 0,
          },
          customerCollector,
        )
      }

      let orderTotals = { synced: 0, unchanged: 0, skipped: 0 }
      let paymentTotals = { synced: 0, unchanged: 0, skipped: 0 }
      let refundTotals = { synced: 0, unchanged: 0, skipped: 0 }
      let inventoryTotals = {
        countsSynced: 0,
        countsUnchanged: 0,
        countsSkipped: 0,
        adjustmentsSynced: 0,
        adjustmentsUnchanged: 0,
        adjustmentsSkipped: 0,
        transfersSynced: 0,
        transfersUnchanged: 0,
        transfersSkipped: 0,
      }
      let laborTotals = {
        timecardsSynced: 0,
        timecardsUnchanged: 0,
        timecardsSkipped: 0,
        breakTypesSynced: 0,
        breakTypesUnchanged: 0,
        breakTypesSkipped: 0,
        teamMemberWagesSynced: 0,
        teamMemberWagesUnchanged: 0,
        teamMemberWagesSkipped: 0,
      }

      for (const targetDate of datesToProcess) {
        const reconcileResult = await reconcileDate(db, customerId, targetDate, ordersCollector)
        orderTotals = {
          synced: orderTotals.synced + reconcileResult.synced,
          unchanged: orderTotals.unchanged + reconcileResult.unchanged,
          skipped: orderTotals.skipped + reconcileResult.skipped,
        }

        const syncRange = toRfc3339Range(targetDate)

        try {
          const result = await syncPayments(
            db,
            customerId,
            syncRange.startAt,
            syncRange.endAt,
            paymentsCollector,
          )
          paymentTotals = {
            synced: paymentTotals.synced + result.synced,
            unchanged: paymentTotals.unchanged + result.unchanged,
            skipped: paymentTotals.skipped + result.skipped,
          }
        } catch (error) {
          hasErrors = true
          paymentsCollector.failed.push({
            id: targetDate,
            error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          })
          await createTypeErrorLog(db, customerId, "nightly_payments", targetDate, error)
        }

        try {
          const result = await syncRefunds(
            db,
            customerId,
            syncRange.startAt,
            syncRange.endAt,
            refundsCollector,
          )
          refundTotals = {
            synced: refundTotals.synced + result.synced,
            unchanged: refundTotals.unchanged + result.unchanged,
            skipped: refundTotals.skipped + result.skipped,
          }
        } catch (error) {
          hasErrors = true
          refundsCollector.failed.push({
            id: targetDate,
            error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          })
          await createTypeErrorLog(db, customerId, "nightly_refunds", targetDate, error)
        }

        try {
          const result = await syncLabor(
            db,
            customerId,
            syncRange.startAt,
            syncRange.endAt,
            laborCollectors,
          )
          laborTotals = {
            timecardsSynced: laborTotals.timecardsSynced + result.timecards.synced,
            timecardsUnchanged: laborTotals.timecardsUnchanged + result.timecards.unchanged,
            timecardsSkipped: laborTotals.timecardsSkipped + result.timecards.skipped,
            breakTypesSynced: laborTotals.breakTypesSynced + result.breakTypes.synced,
            breakTypesUnchanged: laborTotals.breakTypesUnchanged + result.breakTypes.unchanged,
            breakTypesSkipped: laborTotals.breakTypesSkipped + result.breakTypes.skipped,
            teamMemberWagesSynced:
              laborTotals.teamMemberWagesSynced + result.teamMemberWages.synced,
            teamMemberWagesUnchanged:
              laborTotals.teamMemberWagesUnchanged + result.teamMemberWages.unchanged,
            teamMemberWagesSkipped:
              laborTotals.teamMemberWagesSkipped + result.teamMemberWages.skipped,
          }
        } catch (error) {
          hasErrors = true
          laborCollectors.timecards.failed.push({
            id: targetDate,
            error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          })
          await createTypeErrorLog(db, customerId, "nightly_labor", targetDate, error)
        }

        try {
          const result = await syncInventory(
            db,
            customerId,
            syncRange.startAt,
            syncRange.endAt,
            inventoryCollectors,
          )
          inventoryTotals = {
            countsSynced: inventoryTotals.countsSynced + result.countsSynced,
            countsUnchanged: inventoryTotals.countsUnchanged + result.countsUnchanged,
            countsSkipped: inventoryTotals.countsSkipped + result.countsSkipped,
            adjustmentsSynced: inventoryTotals.adjustmentsSynced + result.adjustmentsSynced,
            adjustmentsUnchanged:
              inventoryTotals.adjustmentsUnchanged + result.adjustmentsUnchanged,
            adjustmentsSkipped: inventoryTotals.adjustmentsSkipped + result.adjustmentsSkipped,
            transfersSynced: inventoryTotals.transfersSynced + result.transfersSynced,
            transfersUnchanged: inventoryTotals.transfersUnchanged + result.transfersUnchanged,
            transfersSkipped: inventoryTotals.transfersSkipped + result.transfersSkipped,
          }
        } catch (error) {
          hasErrors = true
          inventoryCollectors.counts?.failed.push({
            id: targetDate,
            error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          })
          inventoryCollectors.adjustments?.failed.push({
            id: targetDate,
            error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          })
          inventoryCollectors.transfers?.failed.push({
            id: targetDate,
            error: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          })
          await createTypeErrorLog(db, customerId, "nightly_inventory", targetDate, error)
        }
      }

      await createDetailFromCollector(
        db,
        syncRun.id,
        "orders",
        {
          changedCount: orderTotals.synced,
          unchangedCount: orderTotals.unchanged,
          skippedCount: orderTotals.skipped,
        },
        ordersCollector,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "payments",
        {
          changedCount: paymentTotals.synced,
          unchangedCount: paymentTotals.unchanged,
          skippedCount: paymentTotals.skipped,
        },
        paymentsCollector,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "refunds",
        {
          changedCount: refundTotals.synced,
          unchangedCount: refundTotals.unchanged,
          skippedCount: refundTotals.skipped,
        },
        refundsCollector,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "inventory_counts",
        {
          changedCount: inventoryTotals.countsSynced,
          unchangedCount: inventoryTotals.countsUnchanged,
          skippedCount: inventoryTotals.countsSkipped,
        },
        inventoryCollectors.counts!,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "inventory_adjustments",
        {
          changedCount: inventoryTotals.adjustmentsSynced,
          unchangedCount: inventoryTotals.adjustmentsUnchanged,
          skippedCount: inventoryTotals.adjustmentsSkipped,
        },
        inventoryCollectors.adjustments!,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "inventory_transfers",
        {
          changedCount: inventoryTotals.transfersSynced,
          unchangedCount: inventoryTotals.transfersUnchanged,
          skippedCount: inventoryTotals.transfersSkipped,
        },
        inventoryCollectors.transfers!,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "labor_timecards",
        {
          changedCount: laborTotals.timecardsSynced,
          unchangedCount: laborTotals.timecardsUnchanged,
          skippedCount: laborTotals.timecardsSkipped,
        },
        laborCollectors.timecards,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "labor_break_types",
        {
          changedCount: laborTotals.breakTypesSynced,
          unchangedCount: laborTotals.breakTypesUnchanged,
          skippedCount: laborTotals.breakTypesSkipped,
        },
        laborCollectors.breakTypes,
      )
      await createDetailFromCollector(
        db,
        syncRun.id,
        "labor_team_member_wages",
        {
          changedCount: laborTotals.teamMemberWagesSynced,
          unchangedCount: laborTotals.teamMemberWagesUnchanged,
          skippedCount: laborTotals.teamMemberWagesSkipped,
        },
        laborCollectors.teamMemberWages,
      )

      await completeSyncRun(db, syncRun.id, {
        status: hasErrors ? "completed_with_errors" : "completed",
        completedAt: new Date(),
        errorMessage: hasErrors ? "One or more nightly sync steps failed." : null,
      })
    } catch (error) {
      await completeSyncRun(db, syncRun.id, {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
      })
    }
  }
}
