import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../../lib/api-client"
import { useApiScopeKey } from "../../../lib/auth-context"

type SyncRunListItem = {
  id: string
  customerId: string
  triggerType: string
  status: string
  startedAt: string
  completedAt: string | null
  errorMessage: string | null
  changedCount: number
  unchangedCount: number
  failedCount: number
  skippedCount: number
}

type SyncRunDetailItem = {
  id: string
  syncRunId: string
  dataType: string
  changedCount: number
  unchangedCount: number
  failedCount: number
  skippedCount: number
  changedRecordIds: string[]
  failedRecords: Array<{ id: string; error: string }>
  createdAt: string
}

type SyncRunsResponse = {
  syncRuns: SyncRunListItem[]
  totalCount: number
}

type SyncRunDetailResponse = {
  syncRun: SyncRunListItem
  details: SyncRunDetailItem[]
}

type WebhookHistoryResponse = {
  webhookLogs: Array<{
    id: string
    eventType: string
    orderId: string | null
    paymentId: string | null
    refundId: string | null
    processingResult: string | null
    receivedAt: string
  }>
  totalCount: number
}

export const useSyncRuns = (options: { page: number; limit: number }) => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["sync-runs", apiScopeKey, options],
    queryFn: async () => {
      const res = await apiClient.api.sync.history.$get({
        query: { page: String(options.page), limit: String(options.limit) },
      })
      if (!res.ok) throw new Error("Failed to fetch sync runs")
      return (await res.json()) as SyncRunsResponse
    },
  })
}

export const useSyncRunDetail = (runId: string | null) => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["sync-run-detail", apiScopeKey, runId],
    queryFn: async () => {
      const res = await apiClient.api.sync.history[":runId"].$get({ param: { runId: runId! } })
      if (!res.ok) throw new Error("Failed to fetch sync run detail")
      return (await res.json()) as SyncRunDetailResponse
    },
    enabled: Boolean(runId),
  })
}

export const useWebhookHistory = (options: {
  page: number
  limit: number
  eventType?: string
  processed?: boolean
}) => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["webhook-history", apiScopeKey, options],
    queryFn: async () => {
      const res = await apiClient.api.sync["webhook-history"].$get({
        query: {
          page: String(options.page),
          limit: String(options.limit),
          processed: options.processed,
          ...(options.eventType ? { eventType: options.eventType } : {}),
        },
      })
      if (!res.ok) throw new Error("Failed to fetch webhook history")
      return (await res.json()) as WebhookHistoryResponse
    },
  })
}
