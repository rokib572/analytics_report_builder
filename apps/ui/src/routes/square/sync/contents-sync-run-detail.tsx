import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@analytics/ui-shared"
import { useState } from "react"

type SyncRunDetail = {
  id: string
  dataType: string
  changedCount: number
  unchangedCount: number
  failedCount: number
  skippedCount: number
  changedRecordIds: string[]
  failedRecords: Array<{ id: string; error: string }>
}

type SyncRunDetailContentProps = {
  runId: string | null
  details: SyncRunDetail[]
  isLoading: boolean
  error: string | null
}

export const SyncRunDetailContent = ({
  runId,
  details,
  isLoading,
  error,
}: SyncRunDetailContentProps) => {
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Detail</CardTitle>
        <CardDescription>
          {runId ? `Detailed counts for run ${runId}.` : "Select a nightly sync run to inspect."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading run detail...</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!runId && !isLoading ? (
          <p className="text-sm text-muted-foreground">No run selected.</p>
        ) : null}
        {details.map((detail) => {
          const isExpanded = expandedDetailId === detail.id

          return (
            <div key={detail.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{detail.dataType}</h3>
                  <p className="text-sm text-muted-foreground">
                    Changed {detail.changedCount}, unchanged {detail.unchangedCount}, failed{" "}
                    {detail.failedCount}, skipped {detail.skippedCount}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedDetailId(isExpanded ? null : detail.id)}
                >
                  {isExpanded ? "Hide" : "Show"}
                </Button>
              </div>
              {isExpanded ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Changed Records</p>
                    {detail.changedRecordIds.length > 0 ? (
                      <div className="mt-1 max-h-40 overflow-auto rounded border bg-muted/30 p-2 font-mono text-xs">
                        {detail.changedRecordIds.join("\n")}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No changed record IDs captured.</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Failed Records</p>
                    {detail.failedRecords.length > 0 ? (
                      <div className="mt-1 space-y-2 rounded border bg-muted/30 p-2">
                        {detail.failedRecords.map((record, index) => (
                          <div key={`${record.id}-${index}`}>
                            <p className="font-mono text-xs">{record.id}</p>
                            <p className="text-muted-foreground">{record.error}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No failed records captured.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
