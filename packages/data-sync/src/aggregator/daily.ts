import type { DailySalesPayload } from "@analytics/database"
import type { Square } from "square"

const amt = (money?: { amount?: bigint | null }): bigint => money?.amount ?? 0n

export const aggregateOrdersToDaily = (
  orders: Square.Order[],
  locationMap: Map<string, string>,
  syncSource: string,
): DailySalesPayload[] => {
  const grouped = new Map<string, Required<DailySalesPayload>>()

  for (const order of orders) {
    if (order.state !== "COMPLETED" || !order.locationId || !order.createdAt) {
      continue
    }

    const internalLocationId = locationMap.get(order.locationId)
    if (!internalLocationId) {
      continue
    }

    const saleDate = order.createdAt.split("T")[0]
    const groupKey = `${order.locationId}|${saleDate}`

    const discountMoney = amt(order.netAmounts?.discountMoney)
    const returnMoney = amt(order.returnAmounts?.totalMoney)
    const grossSales = amt(order.netAmounts?.totalMoney) + discountMoney + returnMoney
    const totalDiscounts = discountMoney
    const totalReturns = returnMoney
    const netSales = grossSales - totalDiscounts - totalReturns
    const totalTax = amt(order.netAmounts?.taxMoney)
    const totalTips = amt(order.netAmounts?.tipMoney)
    const totalServiceCharges = amt(order.netAmounts?.serviceChargeMoney)
    const totalCollected = netSales + totalTax + totalTips + totalServiceCharges

    const existing = grouped.get(groupKey)

    if (existing) {
      existing.grossSales += grossSales
      existing.totalDiscounts += totalDiscounts
      existing.totalReturns += totalReturns
      existing.netSales += netSales
      existing.totalTax += totalTax
      existing.totalTips += totalTips
      existing.totalServiceCharges += totalServiceCharges
      existing.totalCollected += totalCollected
      existing.storeGrossSales += grossSales
      existing.orderCount += 1
      continue
    }

    grouped.set(groupKey, {
      locationId: internalLocationId,
      saleDate,
      grossSales,
      totalDiscounts,
      totalReturns,
      netSales,
      totalTax,
      totalTips,
      totalServiceCharges,
      totalCollected,
      storeGrossSales: grossSales,
      uberGrossSales: 0n,
      uberBogoDiscountAmount: 0n,
      uberBogoRecoverable: 0n,
      orderCount: 1,
      syncSource,
    })
  }

  return [...grouped.values()]
}
