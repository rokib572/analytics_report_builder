import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@analytics/ui-shared"
import type { SyncLocationsContentProps } from "./types"

export const SyncLocationsContent = ({
  onSync,
  isPending,
  result,
  error,
}: SyncLocationsContentProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Sync Locations</CardTitle>
      <CardDescription>
        Fetch the latest locations from Square and update the database.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button onClick={onSync} disabled={isPending}>
        {isPending ? "Syncing..." : "Sync Locations"}
      </Button>
      {result && (
        <p className="text-sm text-muted-foreground">
          Sync complete: {result.synced} synced, {result.unchanged} unchanged.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </CardContent>
  </Card>
)
