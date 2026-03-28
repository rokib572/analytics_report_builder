import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSyncLocations } from "../../data/locations/hooks"
import { useSyncOrders } from "../../data/sync/hooks"
import { SyncLocationsContent } from "./contents-location"
import { SyncOrdersContent } from "./contents-orders"
import { MAX_SYNC_DAYS, orderSyncSchema } from "./schemas"
import type { OrderSyncValues } from "./types"

export const SyncRoute = () => {
  const syncLocations = useSyncLocations()
  const [locResult, setLocResult] = useState<{ synced: number; unchanged: number } | null>(null)
  const [locError, setLocError] = useState<string | null>(null)

  const syncOrders = useSyncOrders()
  const [orderResult, setOrderResult] = useState<{
    synced: number
    unchanged: number
    skipped: number
  } | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderSyncValues>({
    resolver: zodResolver(orderSyncSchema),
  })

  const handleSyncLocations = async () => {
    setLocResult(null)
    setLocError(null)
    try {
      const data = await syncLocations.mutateAsync()
      const unchanged = "unchanged" in data ? data.unchanged : 0
      setLocResult({ synced: data.synced, unchanged })
    } catch (err) {
      setLocError(err instanceof Error ? err.message : "Failed to sync locations")
    }
  }

  const handleSyncOrders = async (values: OrderSyncValues) => {
    setOrderResult(null)
    setOrderError(null)
    try {
      const data = await syncOrders.mutateAsync(values)
      setOrderResult({
        synced: "synced" in data ? data.synced : 0,
        unchanged: "unchanged" in data ? data.unchanged : 0,
        skipped: "skipped" in data ? data.skipped : 0,
      })
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to sync orders")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Sync</h1>
        <p className="text-muted-foreground">Manually trigger data synchronization from Square.</p>
      </div>

      <SyncLocationsContent
        onSync={handleSyncLocations}
        isPending={syncLocations.isPending}
        result={locResult}
        error={locError}
      />

      <SyncOrdersContent
        register={register}
        errors={errors}
        onSubmit={handleSubmit(handleSyncOrders)}
        isPending={syncOrders.isPending}
        result={orderResult}
        error={orderError}
        maxDays={MAX_SYNC_DAYS}
      />
    </div>
  )
}
