import {
  type DbClient,
  bulkInsertOrderLineItems,
  bulkInsertOrderFulfillments,
  bulkInsertOrderTenders,
  deleteOrderLineItemsByOrderId,
  deleteOrderFulfillmentsByOrderId,
  deleteOrderTendersByOrderId,
  findWebhookLogByEventId,
  upsertChannelBySourceName,
  upsertDailySales,
  upsertOrder,
} from "@analytics/database"
import { batchSearchOrders, detectChannel } from "@analytics/square"
import type { Square } from "square"
import { computeContentHash, normalizeJsonValue } from "../utils/content-hash"
import { aggregateOrdersToDaily } from "../aggregator/daily"
import { validateWebhookLocation } from "./process.validate-location"
import { validateWebhookOrder } from "./process.validate-order"
import type { ProcessWebhookEvent, ProcessWebhookEventResult } from "./types"

const toBigInt = (money?: { amount?: bigint | null }): bigint | null =>
  money?.amount !== undefined && money?.amount !== null ? BigInt(money.amount) : null

const getOrderDiscountMap = (order: Square.Order): Map<string, Square.OrderLineItemDiscount> =>
  new Map(
    (order.discounts ?? [])
      .filter((discount) => Boolean(discount.uid))
      .map((discount) => [discount.uid!, discount]),
  )

const getOrderTaxMap = (order: Square.Order): Map<string, Square.OrderLineItemTax> =>
  new Map((order.taxes ?? []).filter((tax) => Boolean(tax.uid)).map((tax) => [tax.uid!, tax]))

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
    tenders: order.tenders,
    fulfillments: order.fulfillments,
    closedAt: order.closedAt,
    customerId: order.customerId,
    ticketName: order.ticketName,
    updatedAt: order.updatedAt,
  }
  const contentHash = computeContentHash(hashInput as Record<string, unknown>)
  const orderDiscountMap = getOrderDiscountMap(order)
  const orderTaxMap = getOrderTaxMap(order)
  const saleDate = order.createdAt.split("T")[0]
  const sourceName = order.source?.name ?? null
  const channel = sourceName ? await upsertChannelBySourceName(db, customerId, sourceName) : null

  const result = await upsertOrder(db, customerId, {
    squareId: order.id,
    locationId: internalLocationId,
    channelId: channel?.id ?? null,
    saleDate,
    state: order.state ?? "COMPLETED",
    totalMoney: toBigInt(order.totalMoney),
    totalTaxMoney: toBigInt(order.totalTaxMoney),
    totalDiscountMoney: toBigInt(order.totalDiscountMoney),
    totalTipMoney: toBigInt(order.totalTipMoney),
    totalServiceChargeMoney: toBigInt(order.totalServiceChargeMoney),
    netAmounts: (normalizeJsonValue(order.netAmounts) as Record<string, unknown> | null) ?? null,
    returnAmounts:
      (normalizeJsonValue(order.returnAmounts) as Record<string, unknown> | null) ?? null,
    sourceName,
    squareCustomerId: order.customerId ?? null,
    ticketName: order.ticketName ?? null,
    closedAt: order.closedAt ? new Date(order.closedAt) : null,
    fulfillmentType: order.fulfillments?.[0]?.type ?? null,
    rawJson: normalizeJsonValue(order) as Record<string, unknown>,
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
      modifiers:
        li.modifiers?.map((modifier) => ({
          name: modifier.name ?? null,
          catalogObjectId: modifier.catalogObjectId ?? null,
          basePriceMoney: modifier.basePriceMoney?.amount?.toString() ?? null,
        })) ?? null,
      appliedDiscounts:
        li.appliedDiscounts?.map((discount) => ({
          discountId: discount.discountUid ?? null,
          name: orderDiscountMap.get(discount.discountUid)?.name ?? null,
          type: orderDiscountMap.get(discount.discountUid)?.type ?? null,
          amountMoney: discount.appliedMoney?.amount?.toString() ?? null,
          percentage: orderDiscountMap.get(discount.discountUid)?.percentage ?? null,
        })) ?? null,
      appliedTaxes:
        li.appliedTaxes?.map((tax) => ({
          taxId: tax.taxUid ?? null,
          name: orderTaxMap.get(tax.taxUid)?.name ?? null,
          percentage: orderTaxMap.get(tax.taxUid)?.percentage ?? null,
          amountMoney: tax.appliedMoney?.amount?.toString() ?? null,
        })) ?? null,
    }))

    if (lineItemPayloads.length > 0) {
      await bulkInsertOrderLineItems(db, lineItemPayloads)
    }

    await deleteOrderTendersByOrderId(db, result.id)

    const tenderPayloads = (order.tenders ?? [])
      .filter((tender) => Boolean(tender.id))
      .map((tender) => ({
        orderId: result.id,
        locationId: internalLocationId,
        squareId: tender.id ?? "",
        type: tender.type ?? "OTHER",
        amountMoney: toBigInt(tender.amountMoney),
        tipMoney: toBigInt(tender.tipMoney),
        processingFeeMoney: toBigInt(tender.processingFeeMoney),
        cardBrand: tender.cardDetails?.card?.cardBrand ?? null,
        cardLast4: tender.cardDetails?.card?.last4 ?? null,
        cardEntryMethod: tender.cardDetails?.entryMethod ?? null,
        squareCustomerId: tender.customerId ?? null,
        paymentId: tender.paymentId ?? null,
      }))

    if (tenderPayloads.length > 0) {
      await bulkInsertOrderTenders(db, tenderPayloads)
    }

    await deleteOrderFulfillmentsByOrderId(db, result.id)

    const fulfillmentPayloads = (order.fulfillments ?? []).map((fulfillment) => ({
      orderId: result.id,
      squareUid: fulfillment.uid ?? null,
      type: fulfillment.type ?? "PICKUP",
      state: fulfillment.state ?? "PROPOSED",
      pickupAt: fulfillment.pickupDetails?.pickedUpAt
        ? new Date(fulfillment.pickupDetails.pickedUpAt)
        : null,
      deliveredAt: fulfillment.deliveryDetails?.deliveredAt
        ? new Date(fulfillment.deliveryDetails.deliveredAt)
        : null,
      canceledAt: fulfillment.pickupDetails?.canceledAt
        ? new Date(fulfillment.pickupDetails.canceledAt)
        : fulfillment.deliveryDetails?.canceledAt
          ? new Date(fulfillment.deliveryDetails.canceledAt)
          : null,
    }))

    if (fulfillmentPayloads.length > 0) {
      await bulkInsertOrderFulfillments(db, fulfillmentPayloads)
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
