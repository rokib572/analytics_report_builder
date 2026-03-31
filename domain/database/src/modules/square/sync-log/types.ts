import type { SyncLogDto } from "./schema"

export type ListSyncLogsOptions = {
  page: number
  limit: number
  locationId?: string
}

export type ListSyncLogsResult = {
  syncLogs: SyncLogDto[]
  totalCount: number
}
