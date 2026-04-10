import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSyncLocations } from "../../../data/square/locations/hooks"
import { useSyncOrders, useSyncCatalog } from "../../../data/square/sync/hooks"
import { SyncLocationsContent } from "./contents-location"
import { SyncOrdersContent } from "./contents-orders"
import { SyncCatalogContent } from "./contents-catalog"
import { MAX_SYNC_DAYS, orderSyncSchema } from "./schemas"
import type { OrderSyncAsyncResult, OrderSyncResult, OrderSyncValues } from "./types"

const ZERO_FLAT = { synced: 0, unchanged: 0, skipped: 0 }
const ZERO_INVENTORY = {
  countsSynced: 0,
  adjustmentsSynced: 0,
  transfersSynced: 0,
  unchanged: 0,
  skipped: 0,
}

export const SyncRoute = () => {
  const syncLocations = useSyncLocations()
  const [locResult, setLocResult] = useState<{ synced: number; unchanged: number } | null>(null)
  const [locError, setLocError] = useState<string | null>(null)

  const syncOrders = useSyncOrders()
  const [orderResult, setOrderResult] = useState<OrderSyncResult | null>(null)
  const [orderAsyncResult, setOrderAsyncResult] = useState<OrderSyncAsyncResult | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  const syncCatalog = useSyncCatalog()
  const [catalogResult, setCatalogResult] = useState<{
    synced: number
    unchanged: number
    skipped: number
  } | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)

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
      const synced = "synced" in data ? data.synced : 0
      const unchanged = "unchanged" in data ? data.unchanged : 0
      setLocResult({ synced, unchanged })
    } catch (err) {
      setLocError(err instanceof Error ? err.message : "Failed to sync locations")
    }
  }

  const handleSyncOrders = async (values: OrderSyncValues) => {
    setOrderResult(null)
    setOrderAsyncResult(null)
    setOrderError(null)
    try {
      const data = await syncOrders.mutateAsync(values)
      if ("async" in data && data.async) {
        setOrderAsyncResult({
          async: true,
          syncLogId: data.syncLogId,
          message: data.message,
        })
        return
      }

      setOrderResult({
        orders: {
          synced: "synced" in data ? data.synced : 0,
          unchanged: "unchanged" in data ? data.unchanged : 0,
          skipped: "skipped" in data ? data.skipped : 0,
        },
        payments: "payments" in data ? (data.payments as OrderSyncResult["payments"]) : ZERO_FLAT,
        refunds: "refunds" in data ? (data.refunds as OrderSyncResult["refunds"]) : ZERO_FLAT,
        inventory:
          "inventory" in data ? (data.inventory as OrderSyncResult["inventory"]) : ZERO_INVENTORY,
        aggregated: "aggregated" in data ? (data.aggregated as number) : 0,
      })
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to sync orders")
    }
  }

  const handleSyncCatalog = async () => {
    setCatalogResult(null)
    setCatalogError(null)
    try {
      const data = await syncCatalog.mutateAsync()
      setCatalogResult({
        synced: "synced" in data ? data.synced : 0,
        unchanged: "unchanged" in data ? data.unchanged : 0,
        skipped: "skipped" in data ? data.skipped : 0,
      })
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : "Failed to sync catalog")
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
        asyncResult={orderAsyncResult}
        error={orderError}
        maxDays={MAX_SYNC_DAYS}
      />

      <SyncCatalogContent
        onSync={handleSyncCatalog}
        isPending={syncCatalog.isPending}
        result={catalogResult}
        error={catalogError}
      />
    </div>
  )
}
