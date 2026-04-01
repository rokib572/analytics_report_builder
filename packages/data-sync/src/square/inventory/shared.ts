import type {
  InventoryAdjustmentPayload,
  InventoryCountPayload,
  InventoryTransferPayload,
} from "@analytics/database"
import type { Square } from "square"
import { computeContentHash } from "../../utils/content-hash"

export const computeInventoryCountContentHash = (count: Square.InventoryCount): string =>
  computeContentHash({
    catalogObjectId: count.catalogObjectId,
    locationId: count.locationId,
    state: count.state,
    quantity: count.quantity,
    calculatedAt: count.calculatedAt,
    isEstimated: count.isEstimated,
  } as Record<string, unknown>)

export const computeInventoryAdjustmentContentHash = (
  adjustment: Square.InventoryAdjustment,
): string =>
  computeContentHash({
    id: adjustment.id,
    catalogObjectId: adjustment.catalogObjectId,
    locationId: adjustment.locationId,
    fromState: adjustment.fromState,
    toState: adjustment.toState,
    quantity: adjustment.quantity,
    totalPriceMoney: adjustment.totalPriceMoney?.amount,
    occurredAt: adjustment.occurredAt,
    createdAt: adjustment.createdAt,
    transactionId: adjustment.transactionId,
    refundId: adjustment.refundId,
  } as Record<string, unknown>)

export const computeInventoryTransferContentHash = (transfer: Square.InventoryTransfer): string =>
  computeContentHash({
    id: transfer.id,
    catalogObjectId: transfer.catalogObjectId,
    fromLocationId: transfer.fromLocationId,
    toLocationId: transfer.toLocationId,
    state: transfer.state,
    quantity: transfer.quantity,
    occurredAt: transfer.occurredAt,
    createdAt: transfer.createdAt,
  } as Record<string, unknown>)

export const mapInventoryCountPayload = (
  count: Square.InventoryCount,
  internalLocationId: string,
  catalogItemVariationId: string | null,
  contentHash: string,
): InventoryCountPayload => ({
  locationId: internalLocationId,
  catalogObjectId: count.catalogObjectId ?? "",
  catalogItemVariationId,
  catalogObjectType: count.catalogObjectType ?? null,
  state: count.state ?? "IN_STOCK",
  quantity: count.quantity ?? "0",
  isEstimated: Boolean(count.isEstimated),
  calculatedAt: new Date(count.calculatedAt ?? new Date().toISOString()),
  contentHash,
})

export const mapInventoryAdjustmentPayload = (
  adjustment: Square.InventoryAdjustment,
  internalLocationId: string,
  catalogItemVariationId: string | null,
  contentHash: string,
): InventoryAdjustmentPayload => ({
  locationId: internalLocationId,
  squareId: adjustment.id ?? "",
  catalogObjectId: adjustment.catalogObjectId ?? "",
  catalogItemVariationId,
  catalogObjectType: adjustment.catalogObjectType ?? null,
  fromState: adjustment.fromState ?? null,
  toState: adjustment.toState ?? null,
  quantity: adjustment.quantity ?? "0",
  totalPriceMoney:
    adjustment.totalPriceMoney?.amount !== undefined && adjustment.totalPriceMoney.amount !== null
      ? BigInt(adjustment.totalPriceMoney.amount)
      : null,
  occurredAt: new Date(adjustment.occurredAt ?? adjustment.createdAt ?? new Date().toISOString()),
  createdAt: new Date(adjustment.createdAt ?? adjustment.occurredAt ?? new Date().toISOString()),
  teamMemberId: adjustment.teamMemberId ?? null,
  transactionId: adjustment.transactionId ?? null,
  refundId: adjustment.refundId ?? null,
  purchaseOrderId: adjustment.purchaseOrderId ?? null,
  goodsReceiptId: adjustment.goodsReceiptId ?? null,
  reason: null,
  contentHash,
})

export const mapInventoryTransferPayload = (
  transfer: Square.InventoryTransfer,
  catalogItemVariationId: string | null,
  fromLocationId: string | null,
  toLocationId: string | null,
  contentHash: string,
): InventoryTransferPayload => ({
  squareId: transfer.id ?? "",
  catalogObjectId: transfer.catalogObjectId ?? "",
  catalogItemVariationId,
  catalogObjectType: transfer.catalogObjectType ?? null,
  fromLocationId,
  toLocationId,
  fromSquareLocationId: transfer.fromLocationId ?? null,
  toSquareLocationId: transfer.toLocationId ?? null,
  state: transfer.state ?? null,
  quantity: transfer.quantity ?? "0",
  occurredAt: new Date(transfer.occurredAt ?? transfer.createdAt ?? new Date().toISOString()),
  createdAt: new Date(transfer.createdAt ?? transfer.occurredAt ?? new Date().toISOString()),
  teamMemberId: transfer.teamMemberId ?? null,
  contentHash,
})
