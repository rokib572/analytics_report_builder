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

type SyncInventoryResult = {
  countsSynced: number
  adjustmentsSynced: number
  transfersSynced: number
  unchanged: number
  skipped: number
}

export const syncInventory = async (
  db: DbClient,
  customerId: string,
  startAt: string,
  endAt: string,
): Promise<SyncInventoryResult> => {
  const locationMap = await getLocationSquareIdMap(db, customerId)
  const squareLocationIds = [...locationMap.keys()]

  if (squareLocationIds.length === 0) {
    return { countsSynced: 0, adjustmentsSynced: 0, transfersSynced: 0, unchanged: 0, skipped: 0 }
  }

  let countsSynced = 0
  let adjustmentsSynced = 0
  let transfersSynced = 0
  let unchanged = 0
  let skipped = 0

  const counts = await listInventoryCounts(customerId, squareLocationIds, startAt)
  for (const count of counts) {
    if (!count.catalogObjectId || !count.locationId || !count.state || !count.quantity) {
      skipped++
      continue
    }

    const internalLocationId = locationMap.get(count.locationId)
    if (!internalLocationId) {
      skipped++
      continue
    }

    const catalogItemVariationId = await findCatalogItemVariationIdBySquareId(
      db,
      customerId,
      count.catalogObjectId,
    )
    const contentHash = computeInventoryCountContentHash(count)
    const result = await upsertInventoryCount(
      db,
      customerId,
      mapInventoryCountPayload(count, internalLocationId, catalogItemVariationId, contentHash),
    )

    if (result) {
      countsSynced++
    } else {
      unchanged++
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
        continue
      }

      const internalLocationId = locationMap.get(adjustment.locationId)
      if (!internalLocationId) {
        skipped++
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
      } else {
        unchanged++
      }
    } else if (change.type === "TRANSFER" && change.transfer) {
      const transfer = change.transfer
      if (!transfer.id || !transfer.catalogObjectId || !transfer.quantity) {
        skipped++
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
      } else {
        unchanged++
      }
    }
  }

  return { countsSynced, adjustmentsSynced, transfersSynced, unchanged, skipped }
}
