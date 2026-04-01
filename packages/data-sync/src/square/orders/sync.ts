import {
  type DbClient,
  getLocationSquareIdMap,
  upsertOrder,
  deleteOrderLineItemsByOrderId,
  bulkInsertOrderLineItems,
  bulkInsertOrderFulfillments,
  bulkInsertOrderTenders,
  deleteOrderFulfillmentsByOrderId,
  deleteOrderTendersByOrderId,
} from "@analytics/database"
import { batchSearchOrders, detectChannel } from "@analytics/square"
import type { Square } from "square"
import { computeContentHash } from "../../utils/content-hash"

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

export const syncOrders = async (
  db: DbClient,
  customerId: string,
  startAt: string,
  endAt: string,
): Promise<{ synced: number; unchanged: number; skipped: number }> => {
  const locationMap = await getLocationSquareIdMap(db, customerId)
  const squareLocationIds = [...locationMap.keys()]

  console.log("SquareLocationIds for sync:", squareLocationIds, locationMap)

  if (squareLocationIds.length === 0) {
    return { synced: 0, unchanged: 0, skipped: 0 }
  }

  const squareOrders = await batchSearchOrders(customerId, squareLocationIds, startAt, endAt)

  let synced = 0
  let unchanged = 0
  let skipped = 0

  for (const order of squareOrders) {
    if (!order.id || !order.locationId || !order.createdAt) {
      skipped++
      continue
    }

    const internalLocationId = locationMap.get(order.locationId)
    if (!internalLocationId) {
      skipped++
      continue
    }

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
      squareCustomerId: order.customerId ?? null,
      ticketName: order.ticketName ?? null,
      closedAt: order.closedAt ? new Date(order.closedAt) : null,
      fulfillmentType: order.fulfillments?.[0]?.type ?? null,
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

      synced++
    } else {
      unchanged++
    }
  }

  return { synced, unchanged, skipped }
}
