import {
  type DbClient,
  findCatalogItemVariationIdBySquareId,
  findWebhookLogByEventId,
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
} from "../square/inventory/shared"
import type { ProcessInventoryWebhookEvent, ProcessWebhookEventResult } from "./types"

export const processInventoryWebhookEvent = async (
  db: DbClient,
  customerId: string,
  event: ProcessInventoryWebhookEvent,
): Promise<ProcessWebhookEventResult> => {
  const webhookLog = await findWebhookLogByEventId(db, event.eventId)
  if (webhookLog?.processed) {
    return { processed: false, reason: "duplicate" }
  }

  const locationMap = await getLocationSquareIdMap(db, customerId)
  const internalLocationId = locationMap.get(event.locationId)
  if (!internalLocationId) {
    return { processed: false, reason: "location_not_mapped" }
  }

  const now = new Date()
  const updatedAfter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const updatedBefore = now.toISOString()
  const catalogObjectIds = event.catalogObjectIds.length > 0 ? event.catalogObjectIds : undefined

  const counts = await listInventoryCounts(
    customerId,
    [event.locationId],
    updatedAfter,
    catalogObjectIds,
  )
  for (const count of counts) {
    if (!count.catalogObjectId || !count.state || !count.quantity) {
      continue
    }

    const catalogItemVariationId = await findCatalogItemVariationIdBySquareId(
      db,
      customerId,
      count.catalogObjectId,
    )
    const contentHash = computeInventoryCountContentHash(count)
    await upsertInventoryCount(
      db,
      customerId,
      mapInventoryCountPayload(count, internalLocationId, catalogItemVariationId, contentHash),
    )
  }

  const changes = await listInventoryChanges(
    customerId,
    [event.locationId],
    updatedAfter,
    updatedBefore,
    catalogObjectIds,
  )
  for (const change of changes) {
    if (change.type === "ADJUSTMENT" && change.adjustment) {
      const adjustment = change.adjustment
      if (!adjustment.id || !adjustment.catalogObjectId || !adjustment.quantity) {
        continue
      }

      const locationId = adjustment.locationId ? locationMap.get(adjustment.locationId) : null
      if (!locationId) {
        continue
      }

      const catalogItemVariationId = await findCatalogItemVariationIdBySquareId(
        db,
        customerId,
        adjustment.catalogObjectId,
      )
      const contentHash = computeInventoryAdjustmentContentHash(adjustment)
      await upsertInventoryAdjustment(
        db,
        customerId,
        mapInventoryAdjustmentPayload(adjustment, locationId, catalogItemVariationId, contentHash),
      )
    } else if (change.type === "TRANSFER" && change.transfer) {
      const transfer = change.transfer
      if (!transfer.id || !transfer.catalogObjectId || !transfer.quantity) {
        continue
      }

      const catalogItemVariationId = await findCatalogItemVariationIdBySquareId(
        db,
        customerId,
        transfer.catalogObjectId,
      )
      const contentHash = computeInventoryTransferContentHash(transfer)
      await upsertInventoryTransfer(
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
    }
  }

  return { processed: true }
}
