import { useQuery, useMutation } from "@tanstack/react-query"
import type { ReportConfig } from "@analytics/validators"

// Run a live query with the current report config (called on every canvas change)
export const useReportQuery = (config: ReportConfig | null) => {
  return useQuery({
    queryKey: ["report-query", config],
    queryFn: async () => {
      // TODO: POST /api/reports/query with config → return ReportQueryResult
    },
    enabled: !!config && config.metrics.length > 0,
  })
}

// Load all saved reports for the current customer
export const useSavedReports = () => {
  return useQuery({
    queryKey: ["saved-reports"],
    queryFn: async () => {
      // TODO: GET /api/reports → return SavedReport[]
    },
  })
}

// Save the current report config
export const useSaveReport = () => {
  return useMutation({
    mutationFn: async (_payload: { name: string; config: ReportConfig }) => {
      // TODO: POST /api/reports → return SavedReport
    },
  })
}

// Delete a saved report
export const useDeleteReport = () => {
  return useMutation({
    mutationFn: async (_reportId: string) => {
      // TODO: DELETE /api/reports/:id
    },
  })
}
