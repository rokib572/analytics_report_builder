import {
  type DbClient,
  findCatalogItemVariationIdBySquareId,
  getLocationSquareIdMap,
  upsertInventoryAdjustment,
  upsertInventoryCount,
  upsertInventoryTransfer,
} from "@analytics/database"
import { listInventoryChanges, listInventoryCounts } from "@analytics/square"
import {
  computeInventoryAdjustmentContentHash,
  computeInventoryCountContentHash,
  computeInventoryTransferContentHash,
  mapInventoryAdjustmentPayload,
  mapInventoryCountPayload,
  mapInventoryTransferPayload,
} from "./shared"
import type { SyncInventoryCollectors } from "../../utils/sync-collector"

type SyncInventoryResult = {
  countsSynced: number
  countsUnchanged: number
  countsSkipped: number
  adjustmentsSynced: number
  adjustmentsUnchanged: number
  adjustmentsSkipped: number
  transfersSynced: number
  transfersUnchanged: number
  transfersSkipped: number
  unchanged: number
  skipped: number
}

export const syncInventory = async (
  db: DbClient,
  customerId: string,
  startAt: string,
  endAt: string,
  collectors?: SyncInventoryCollectors,
): Promise<SyncInventoryResult> => {
  const locationMap = await getLocationSquareIdMap(db, customerId)
  const squareLocationIds = [...locationMap.keys()]

  if (squareLocationIds.length === 0) {
    return {
      countsSynced: 0,
      countsUnchanged: 0,
      countsSkipped: 0,
      adjustmentsSynced: 0,
      adjustmentsUnchanged: 0,
      adjustmentsSkipped: 0,
      transfersSynced: 0,
      transfersUnchanged: 0,
      transfersSkipped: 0,
      unchanged: 0,
      skipped: 0,
    }
  }

  let countsSynced = 0
  let countsUnchanged = 0
  let countsSkipped = 0
  let adjustmentsSynced = 0
  let adjustmentsUnchanged = 0
  let adjustmentsSkipped = 0
  let transfersSynced = 0
  let transfersUnchanged = 0
  let transfersSkipped = 0
  let unchanged = 0
  let skipped = 0

  const counts = await listInventoryCounts(customerId, squareLocationIds, startAt)
  for (const count of counts) {
    if (!count.catalogObjectId || !count.locationId || !count.state || !count.quantity) {
      skipped++
      countsSkipped++
      continue
    }

    const internalLocationId = locationMap.get(count.locationId)
    if (!internalLocationId) {
      skipped++
      countsSkipped++
      continue
    }

    const catalogItemVariationId = await findCatalogItemVariationIdBySquareId(
      db,
      customerId,
      count.catalogObjectId,
    )
    const contentHash = computeInventoryCountContentHash(count, catalogItemVariationId)
    const result = await upsertInventoryCount(
      db,
      customerId,
      mapInventoryCountPayload(count, internalLocationId, catalogItemVariationId, contentHash),
    )

    if (result) {
      countsSynced++
      collectors?.counts?.changed.push(count.catalogObjectId)
    } else {
      unchanged++
      countsUnchanged++
    }
  }

  const changes = await listInventoryChanges(customerId, squareLocationIds, startAt, endAt)
  for (const change of changes) {
    if (change.type === "ADJUSTMENT" && change.adjustment) {
      const adjustment = change.adjustment
      if (
        !adjustment.id ||
        !adjustment.catalogObjectId ||
        !adjustment.locationId ||
        !adjustment.quantity
      ) {
        skipped++
        adjustmentsSkipped++
        continue
      }

      const internalLocationId = locationMap.get(adjustment.locationId)
      if (!internalLocationId) {
        skipped++
        adjustmentsSkipped++
        continue
      }

      const catalogItemVariationId = await findCatalogItemVariationIdBySquareId(
        db,
        customerId,
        adjustment.catalogObjectId,
      )
      const contentHash = computeInventoryAdjustmentContentHash(adjustment)
      const result = await upsertInventoryAdjustment(
        db,
        customerId,
        mapInventoryAdjustmentPayload(
          adjustment,
          internalLocationId,
          catalogItemVariationId,
          contentHash,
        ),
      )

      if (result) {
        adjustmentsSynced++
        collectors?.adjustments?.changed.push(adjustment.id)
      } else {
        unchanged++
        adjustmentsUnchanged++
      }
    } else if (change.type === "TRANSFER" && change.transfer) {
      const transfer = change.transfer
      if (!transfer.id || !transfer.catalogObjectId || !transfer.quantity) {
        skipped++
        transfersSkipped++
        continue
      }

      const catalogItemVariationId = await findCatalogItemVariationIdBySquareId(
        db,
        customerId,
        transfer.catalogObjectId,
      )
      const contentHash = computeInventoryTransferContentHash(transfer)
      const result = await upsertInventoryTransfer(
        db,
        customerId,
        mapInventoryTransferPayload(
          transfer,
          catalogItemVariationId,
          transfer.fromLocationId ? (locationMap.get(transfer.fromLocationId) ?? null) : null,
          transfer.toLocationId ? (locationMap.get(transfer.toLocationId) ?? null) : null,
          contentHash,
        ),
      )

      if (result) {
        transfersSynced++
        collectors?.transfers?.changed.push(transfer.id)
      } else {
        unchanged++
        transfersUnchanged++
      }
    }
  }

  return {
    countsSynced,
    countsUnchanged,
    countsSkipped,
    adjustmentsSynced,
    adjustmentsUnchanged,
    adjustmentsSkipped,
    transfersSynced,
    transfersUnchanged,
    transfersSkipped,
    unchanged,
    skipped,
  }
}
