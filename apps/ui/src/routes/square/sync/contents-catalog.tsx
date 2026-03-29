import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@analytics/ui-shared"
import type { SyncCatalogContentProps } from "./types"

export const SyncCatalogContent = ({
  onSync,
  isPending,
  result,
  error,
}: SyncCatalogContentProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Sync Catalog</CardTitle>
      <CardDescription>
        Fetch catalog items, variations, and categories from Square and update the database.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button onClick={onSync} disabled={isPending}>
        {isPending ? "Syncing..." : "Sync Catalog"}
      </Button>
      {result && (
        <p className="text-sm text-muted-foreground">
          Sync complete: {result.synced} synced, {result.unchanged} unchanged, {result.skipped}{" "}
          skipped.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </CardContent>
  </Card>
)
