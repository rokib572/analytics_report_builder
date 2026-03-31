import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../../lib/api-client"

export type Order = {
  id: string
  customerId: string
  locationId: string
  squareId: string
  saleDate: string
  state: string
  totalMoney: string | bigint | null
  totalTaxMoney: string | bigint | null
  totalDiscountMoney: string | bigint | null
  totalTipMoney: string | bigint | null
  totalServiceChargeMoney: string | bigint | null
  sourceName: string | null
  syncedAt: string | null
  createdAt: string
  updatedAt: string
}

export type OrderLineItem = {
  id: string
  orderId: string
  locationId: string
  saleDate: string
  name: string
  variationName: string | null
  catalogObjectId: string | null
  quantity: string
  channel: string
  basePriceMoney: string | bigint | null
  grossSalesMoney: string | bigint | null
  totalDiscountMoney: string | bigint | null
  totalTaxMoney: string | bigint | null
  totalMoney: string | bigint | null
}

type OrdersResponse = {
  success: true
  orders: Order[]
  pagination: {
    page: number
    limit: number
    totalCount: number
  }
}

type OrderResponse = {
  success: true
  order: Order
  lineItems: OrderLineItem[]
}

type UseOrdersOptions = {
  page: number
  limit: number
  locationId?: string
  dateFrom?: string
  dateTo?: string
}

export const useOrders = ({ page, limit, locationId, dateFrom, dateTo }: UseOrdersOptions) =>
  useQuery({
    queryKey: ["orders", page, limit, locationId, dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.api.square.orders.list.$get({
        query: {
          page: String(page),
          limit: String(limit),
          ...(locationId ? { locationId: String(locationId) } : {}),
          ...(dateFrom ? { dateFrom: String(dateFrom) } : {}),
          ...(dateTo ? { dateTo: String(dateTo) } : {}),
        },
      })
      if (!res.ok) throw new Error("Failed to fetch orders")
      return (await res.json()) as OrdersResponse
    },
  })

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await apiClient.api.square.orders.get[":id"].$get({ param: { id } })
      if (!res.ok) throw new Error("Failed to fetch order")
      return (await res.json()) as OrderResponse
    },
    enabled: !!id,
  })
