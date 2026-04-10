import type { FieldErrors, UseFormRegister } from "react-hook-form"

export type OrderSyncValues = {
  startAt: string
  endAt: string
}

export type SyncLocationsContentProps = {
  onSync: () => void
  isPending: boolean
  result: { synced: number; unchanged: number } | null
  error: string | null
}

export type OrderSyncResult = {
  orders: { synced: number; unchanged: number; skipped: number }
  payments: { synced: number; unchanged: number; skipped: number }
  refunds: { synced: number; unchanged: number; skipped: number }
  inventory: {
    countsSynced: number
    adjustmentsSynced: number
    transfersSynced: number
    unchanged: number
    skipped: number
  }
  aggregated: number
}

export type SyncOrdersContentProps = {
  register: UseFormRegister<OrderSyncValues>
  errors: FieldErrors<OrderSyncValues>
  onSubmit: () => void
  isPending: boolean
  result: OrderSyncResult | null
  error: string | null
  maxDays: number
}

export type SyncCatalogContentProps = {
  onSync: () => void
  isPending: boolean
  result: { synced: number; unchanged: number; skipped: number } | null
  error: string | null
}
