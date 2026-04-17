export type SyncRecordCollector = {
  changed: string[]
  failed: Array<{ id: string; error: string }>
}

export type SyncInventoryCollectors = {
  counts?: SyncRecordCollector
  adjustments?: SyncRecordCollector
  transfers?: SyncRecordCollector
}

export const createSyncRecordCollector = (): SyncRecordCollector => ({
  changed: [],
  failed: [],
})

export const capChangedRecordIds = (recordIds: string[]): string[] => recordIds.slice(0, 1000)
