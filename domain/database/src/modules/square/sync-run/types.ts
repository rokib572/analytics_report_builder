import type { SyncRunDetailDto, SyncRunDto } from "./schema"

export type ListSyncRunsOptions = {
  page: number
  limit: number
}

export type SyncRunListItem = SyncRunDto & {
  changedCount: number
  unchangedCount: number
  failedCount: number
  skippedCount: number
}

export type ListSyncRunsResult = {
  syncRuns: SyncRunListItem[]
  totalCount: number
}

export type CompleteSyncRunPayload = Pick<SyncRunDto, "status" | "completedAt" | "errorMessage">

export type SyncRunWithDetails = {
  syncRun: SyncRunDto
  details: SyncRunDetailDto[]
}
