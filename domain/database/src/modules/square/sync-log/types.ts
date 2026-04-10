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

export type UpdateSyncLogPayload = Partial<
  Pick<
    SyncLogDto,
    | "dateFrom"
    | "dateTo"
    | "squareCount"
    | "dbCount"
    | "discrepancy"
    | "ordersFetched"
    | "status"
    | "errorMessage"
    | "locationId"
  >
>
