import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@analytics/ui-shared"

type SyncRunRow = {
  id: string
  status: string
  startedAt: string | Date
  completedAt: string | Date | null
  changedCount: number
  unchangedCount: number
  failedCount: number
}

type SyncHistoryContentProps = {
  syncRuns: SyncRunRow[]
  totalCount: number
  page: number
  onPageChange: (page: number) => void
  onSelectRun: (runId: string) => void
  selectedRunId: string | null
  isLoading: boolean
  error: string | null
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "completed") return "default"
  if (status === "completed_with_errors") return "secondary"
  if (status === "failed") return "destructive"
  return "outline"
}

const formatDateTime = (value: string | Date | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "In progress"

export const SyncHistoryContent = ({
  syncRuns,
  totalCount,
  page,
  onPageChange,
  onSelectRun,
  selectedRunId,
  isLoading,
  error,
}: SyncHistoryContentProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Nightly Sync History</CardTitle>
      <CardDescription>Recent nightly sync runs with aggregated change counts.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {isLoading ? <p className="text-sm text-muted-foreground">Loading sync runs...</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!isLoading && !error ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Changed</TableHead>
                <TableHead>Unchanged</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncRuns.map((run) => {
                return (
                  <TableRow key={run.id}>
                    <TableCell>{formatDateTime(run.startedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(run.status)}>{run.status}</Badge>
                    </TableCell>
                    <TableCell>{run.changedCount}</TableCell>
                    <TableCell>{run.unchangedCount}</TableCell>
                    <TableCell>{run.failedCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant={selectedRunId === run.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectRun(run.id)}
                      >
                        {selectedRunId === run.id ? "Selected" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total runs: {totalCount}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page * 20 >= totalCount}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </CardContent>
  </Card>
)
