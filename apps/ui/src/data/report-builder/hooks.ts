import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  CreateSavedReport,
  ReportConfig,
  ReportExport,
  ReportQueryInput,
  ReportQueryResult,
  SavedReport,
} from "@analytics/validators"
import { apiClient, getAssumedCustomerId } from "../../lib/api-client"
import { apiBaseUrl } from "../../lib/api-base-url"
import { downloadBlob } from "../../lib/download"

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

const getFilenameFromDisposition = (header: string | null, fallback: string) => {
  if (!header) return fallback

  const match = header.match(/filename="?(?<filename>[^"]+)"?/)
  return match?.groups?.filename ?? fallback
}

const getExportErrorMessage = async (response: Response) => {
  try {
    const json = (await response.json()) as { message?: string }
    return json.message ?? "Failed to export report"
  } catch {
    return "Failed to export report"
  }
}

export const useExportReport = () => {
  const mutation = useMutation({
    mutationFn: async (payload: ReportExport) => {
      const headers = new Headers({ "Content-Type": "application/json" })
      const assumedCustomerId = getAssumedCustomerId()

      if (assumedCustomerId) headers.set("X-Assume-Customer-Id", assumedCustomerId)

      const response = await fetch(`${apiBaseUrl}/api/reports/export`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await getExportErrorMessage(response))
      }

      const blob = await response.blob()
      const filename = getFilenameFromDisposition(
        response.headers.get("Content-Disposition"),
        `report.${payload.format}`,
      )

      downloadBlob(blob, filename)
    },
  })

  return {
    ...mutation,
    exportReport: (payload: ReportExport) =>
      toast.promise(mutation.mutateAsync(payload), {
        loading: `Generating ${payload.format.toUpperCase()} export...`,
        success: `${payload.format.toUpperCase()} export downloaded.`,
        error: (error) => (error instanceof Error ? error.message : "Failed to export report"),
      }),
  }
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
