import {
  type DbClient,
  getLocationSquareIdMap,
  upsertOrder,
  deleteOrderLineItemsByOrderId,
  bulkInsertOrderLineItems,
} from "@analytics/database"
import { batchSearchOrders, detectChannel } from "@analytics/square"
import { computeContentHash } from "../../utils/content-hash"

const toBigInt = (money?: { amount?: bigint | null }): bigint | null =>
  money?.amount !== undefined && money?.amount !== null ? BigInt(money.amount) : null

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

      synced++
    } else {
      unchanged++
    }
  }

  return { synced, unchanged, skipped }
}
