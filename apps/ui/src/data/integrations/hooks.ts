import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

export const SUPPORTED_APPS = ["square", "uber"] as const

export type SupportedApp = (typeof SUPPORTED_APPS)[number]

export const useIntegrations = () =>
  useQuery({
    queryKey: ["app-integrations"],
    queryFn: async () => {
      const res = await apiClient.api["app-integrations"].list.$get()
      if (!res.ok) throw new Error("Failed to fetch integrations")
      return res.json()
    },
  })
