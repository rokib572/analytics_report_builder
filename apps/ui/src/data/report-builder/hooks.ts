import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  CreateSavedReport,
  ReportConfig,
  ReportQueryResult,
  SavedReport,
} from "@analytics/validators"
import { apiClient } from "../../lib/api-client"

// Run a live query with the current report config (called on every canvas change)
export const useReportQuery = (config: ReportConfig | null) => {
  return useQuery({
    queryKey: ["report-query", config],
    queryFn: async () => {
      const res = await apiClient.api.reports.query.$post({ json: config! })
      if (!res.ok) throw new Error("Failed to run report query")
      return (await res.json()) as ReportQueryResult
    },
    enabled: !!config && config.metrics.length > 0,
  })
}

// Load all saved reports for the current customer
export const useSavedReports = () => {
  return useQuery({
    queryKey: ["saved-reports"],
    queryFn: async () => {
      const res = await apiClient.api.reports.$get()
      if (!res.ok) throw new Error("Failed to fetch saved reports")
      const json = (await res.json()) as { success: true; data: SavedReport[] }
      return json.data
    },
  })
}

// Save the current report config
export const useSaveReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSavedReport) => {
      const res = await apiClient.api.reports.$post({ json: payload })
      if (!res.ok) throw new Error("Failed to save report")
      const json = (await res.json()) as { success: true; data: SavedReport }
      return json.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-reports"] })
    },
  })
}

// Delete a saved report
export const useDeleteReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reportId: string) => {
      const res = await apiClient.api.reports[":id"].$delete({ param: { id: reportId } })
      if (!res.ok) throw new Error("Failed to delete report")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-reports"] })
    },
  })
}
