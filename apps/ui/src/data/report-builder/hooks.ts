import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  CreateSavedReport,
  ReportConfig,
  ReportQueryInput,
  ReportQueryResult,
  SavedReport,
} from "@analytics/validators"
import { apiClient } from "../../lib/api-client"

export const DEFAULT_REPORT_PAGE_SIZE = 10_000

const buildReportQueryInput = (
  config: ReportConfig,
  page: number,
  pageSize: number,
): ReportQueryInput => ({
  ...config,
  page,
  pageSize,
})

export const usePagedReportQuery = (
  config: ReportConfig | null,
  page: number,
  pageSize: number,
) => {
  return useQuery({
    queryKey: ["report-query", config, page, pageSize],
    queryFn: async () => {
      const res = await apiClient.api.reports.query.$post({
        json: buildReportQueryInput(config!, page, pageSize),
      })
      if (!res.ok) throw new Error("Failed to run report query")
      return (await res.json()) as ReportQueryResult
    },
    enabled: !!config && config.metrics.length > 0,
    placeholderData: (previousData) => previousData,
  })
}

export const useInfiniteReportQuery = (config: ReportConfig | null, pageSize: number) => {
  return useInfiniteQuery({
    queryKey: ["report-query", "infinite", config, pageSize],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.api.reports.query.$post({
        json: buildReportQueryInput(config!, pageParam, pageSize),
      })
      if (!res.ok) throw new Error("Failed to run report query")
      return (await res.json()) as ReportQueryResult
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: !!config && config.metrics.length > 0,
  })
}

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
