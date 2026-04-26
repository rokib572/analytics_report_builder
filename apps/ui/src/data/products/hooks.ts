import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

export const useProductsList = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["products-list", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api.square.products.$get()
      if (!res.ok) throw new Error("Failed to fetch products")
      const json = (await res.json()) as { success: true; data: string[] }
      return json.data
    },
  })
}

export const useProductCategoriesList = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["product-categories-list", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api.square["product-categories"].$get()
      if (!res.ok) throw new Error("Failed to fetch product categories")
      const json = (await res.json()) as { success: true; data: string[] }
      return json.data
    },
  })
}
