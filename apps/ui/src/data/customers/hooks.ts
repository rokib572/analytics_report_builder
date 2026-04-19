import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

type CustomerListItem = {
  id: string
  name: string
  slug: string
  companyName: string | null
  businessType: string | null
  businessSize: string | null
  phone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  ownerCount: number
}

type CustomersListResponse = {
  success: true
  data: CustomerListItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
  }
}

export const useCustomersList = ({ page, limit }: { page: number; limit: number }) =>
  useQuery({
    queryKey: ["customers", page, limit],
    queryFn: async () => {
      const res = await apiClient.api.customers.$get({
        query: {
          page: String(page),
          limit: String(limit),
        },
      })

      if (!res.ok) {
        const error = (await res.json()) as { message?: string }
        throw new Error(error.message ?? "Failed to fetch customers")
      }

      return (await res.json()) as CustomersListResponse
    },
  })
