import { useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@analytics/ui-shared"
import { useSyncLocations } from "../../data/locations/hooks"

export const SyncRoute = () => {
  const syncLocations = useSyncLocations()
  const [result, setResult] = useState<{ synced: number; unchanged: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSyncLocations = async () => {
    setResult(null)
    setError(null)
    try {
      const data = await syncLocations.mutateAsync()
      setResult({ synced: data.synced, unchanged: data.unchanged })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync locations")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Sync</h1>
        <p className="text-muted-foreground">Manually trigger data synchronization from Square.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Locations</CardTitle>
          <CardDescription>
            Fetch the latest locations from Square and update the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleSyncLocations} disabled={syncLocations.isPending}>
            {syncLocations.isPending ? "Syncing..." : "Sync Locations"}
          </Button>
          {result && (
            <p className="text-sm text-muted-foreground">
              Sync complete: {result.synced} synced, {result.unchanged} unchanged.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
