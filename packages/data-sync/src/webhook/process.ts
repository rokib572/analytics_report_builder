import {
  type DbClient,
  bulkInsertOrderLineItems,
  deleteOrderLineItemsByOrderId,
  findWebhookLogByEventId,
  upsertDailySales,
  upsertOrder,
} from "@analytics/database"
import { batchSearchOrders, detectChannel } from "@analytics/square"
import { computeContentHash } from "../utils/content-hash"
import { aggregateOrdersToDaily } from "../aggregator/daily"
import { validateWebhookLocation } from "./process.validate-location"
import { validateWebhookOrder } from "./process.validate-order"
import type { ProcessWebhookEvent, ProcessWebhookEventResult } from "./types"

const toBigInt = (money?: { amount?: bigint | null }): bigint | null =>
  money?.amount !== undefined && money?.amount !== null ? BigInt(money.amount) : null

export const processWebhookEvent = async (
  db: DbClient,
  customerId: string,
  event: ProcessWebhookEvent,
): Promise<ProcessWebhookEventResult> => {
  const webhookLog = await findWebhookLogByEventId(db, event.eventId)
  if (webhookLog?.processed) {
    return { processed: false, reason: "duplicate" }
  }

  const orderResult = await validateWebhookOrder(customerId, event.orderId)
  if (!orderResult.valid) {
    return { processed: false, reason: orderResult.reason }
  }
  const { order } = orderResult

  const locationResult = await validateWebhookLocation(db, customerId, order.locationId)
  if (!locationResult.valid) {
    return { processed: false, reason: locationResult.reason }
  }
  const { locationId: internalLocationId, locationMap } = locationResult

  const hashInput = {
    id: order.id,
    locationId: order.locationId,
    state: order.state,
    totalMoney: order.totalMoney?.amount,
    totalTaxMoney: order.totalTaxMoney?.amount,
    totalDiscountMoney: order.totalDiscountMoney?.amount,
    totalTipMoney: order.totalTipMoney?.amount,
    totalServiceChargeMoney: order.totalServiceChargeMoney?.amount,
    netAmounts: order.netAmounts,
    returnAmounts: order.returnAmounts,
    lineItems: order.lineItems,
    updatedAt: order.updatedAt,
  }
  const contentHash = computeContentHash(hashInput as Record<string, unknown>)
  const saleDate = order.createdAt.split("T")[0]

  const result = await upsertOrder(db, customerId, {
    squareId: order.id,
    locationId: internalLocationId,
    saleDate,
    state: order.state ?? "COMPLETED",
    totalMoney: toBigInt(order.totalMoney),
    totalTaxMoney: toBigInt(order.totalTaxMoney),
    totalDiscountMoney: toBigInt(order.totalDiscountMoney),
    totalTipMoney: toBigInt(order.totalTipMoney),
    totalServiceChargeMoney: toBigInt(order.totalServiceChargeMoney),
    netAmounts: order.netAmounts ?? null,
    returnAmounts: order.returnAmounts ?? null,
    sourceName: order.source?.name ?? null,
    rawJson: order,
    contentHash,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt ?? order.createdAt),
  })

  if (result) {
    await deleteOrderLineItemsByOrderId(db, result.id)

    const lineItemPayloads = (order.lineItems ?? []).map((li) => ({
      orderId: result.id,
      locationId: internalLocationId,
      saleDate,
      name: li.name ?? "",
      variationName: li.variationName ?? null,
      catalogObjectId: li.catalogObjectId ?? null,
      quantity: li.quantity ?? "0",
      channel: detectChannel(li.name ?? ""),
      basePriceMoney: toBigInt(li.basePriceMoney),
      grossSalesMoney: toBigInt(li.grossSalesMoney),
      totalDiscountMoney: toBigInt(li.totalDiscountMoney),
      totalTaxMoney: toBigInt(li.totalTaxMoney),
      totalMoney: toBigInt(li.totalMoney),
    }))

    if (lineItemPayloads.length > 0) {
      await bulkInsertOrderLineItems(db, lineItemPayloads)
    }
  }

  const startAt = new Date(`${saleDate}T00:00:00.000Z`).toISOString()
  const endDate = new Date(`${saleDate}T00:00:00.000Z`)
  endDate.setUTCDate(endDate.getUTCDate() + 1)
  const endAt = endDate.toISOString()
  const dayOrders = await batchSearchOrders(customerId, [order.locationId], startAt, endAt)
  const dailyPayloads = aggregateOrdersToDaily(dayOrders, locationMap, "webhook")

  for (const payload of dailyPayloads) {
    await upsertDailySales(db, customerId, payload)
  }

  return { processed: true }
}
