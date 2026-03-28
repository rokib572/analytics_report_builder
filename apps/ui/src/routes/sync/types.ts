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

export type SyncOrdersContentProps = {
  register: UseFormRegister<OrderSyncValues>
  errors: FieldErrors<OrderSyncValues>
  onSubmit: () => void
  isPending: boolean
  result: { synced: number; unchanged: number; skipped: number } | null
  error: string | null
  maxDays: number
}
