import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

export const SUPPORTED_APPS = ["square", "uber"] as const

export type SupportedApp = (typeof SUPPORTED_APPS)[number]
export type AppIntegration = {
  id: string
  customerId: string
  appName: string
  oauthExpiresAt: string | null
  merchantId: string | null
  scopes: string | null
  webhookSubscriptionId: string | null
  environment: string
  isActive: boolean
  label: string | null
  createdAt: string
  updatedAt: string
  lastUsedAt: string | null
}

type IntegrationsResponse = {
  success: true
  data: AppIntegration[]
}

export const useIntegrations = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery<IntegrationsResponse>({
    queryKey: ["app-integrations", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api["app-integrations"].list.$get()
      if (!res.ok) throw new Error("Failed to fetch integrations")
      return (await res.json()) as IntegrationsResponse
    },
  })
}

export const useDisconnectSquare = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.api.square.oauth.disconnect.$post()
      if (!res.ok) throw new Error("Failed to disconnect Square")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["app-integrations"] })
      void queryClient.removeQueries({ queryKey: ["locations"] })
      void queryClient.removeQueries({ queryKey: ["orders"] })
      void queryClient.removeQueries({ queryKey: ["inventory-counts"] })
      void queryClient.removeQueries({ queryKey: ["dashboard-summary"] })
      void queryClient.removeQueries({ queryKey: ["square-backfill-status"] })
    },
  })
}
