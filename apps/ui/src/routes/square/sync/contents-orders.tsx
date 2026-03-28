import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@analytics/ui-shared"
import type { SyncOrdersContentProps } from "./types"

export const SyncOrdersContent = ({
  register,
  errors,
  onSubmit,
  isPending,
  result,
  error,
  maxDays,
}: SyncOrdersContentProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Sync Orders</CardTitle>
      <CardDescription>
        Fetch orders from Square for a date range (max {maxDays} days) and update the database.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="space-y-2">
            <Label htmlFor="startAt">Start Date</Label>
            <Input id="startAt" type="date" {...register("startAt")} />
            {errors.startAt && <p className="text-sm text-destructive">{errors.startAt.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">End Date</Label>
            <Input id="endAt" type="date" {...register("endAt")} />
            {errors.endAt && <p className="text-sm text-destructive">{errors.endAt.message}</p>}
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Syncing..." : "Sync Orders"}
        </Button>
        {result && (
          <p className="text-sm text-muted-foreground">
            Sync complete: {result.synced} synced, {result.unchanged} unchanged, {result.skipped}{" "}
            skipped.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </CardContent>
  </Card>
)
