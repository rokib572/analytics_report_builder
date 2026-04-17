import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@analytics/ui-shared"

type WebhookHistoryRow = {
  id: string
  eventType: string
  orderId: string | null
  paymentId?: string | null
  refundId?: string | null
  processingResult: string | null
  receivedAt: string | Date
}

type WebhookHistoryContentProps = {
  rows: WebhookHistoryRow[]
  totalCount: number
  page: number
  eventType: string
  processedFilter: string
  onEventTypeChange: (value: string) => void
  onProcessedFilterChange: (value: string) => void
  onPageChange: (page: number) => void
  isLoading: boolean
  error: string | null
}

const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

export const WebhookHistoryContent = ({
  rows,
  totalCount,
  page,
  eventType,
  processedFilter,
  onEventTypeChange,
  onProcessedFilterChange,
  onPageChange,
  isLoading,
  error,
}: WebhookHistoryContentProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Webhook History</CardTitle>
      <CardDescription>Recent webhook processing results and identifiers.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          value={eventType}
          onChange={(event) => onEventTypeChange(event.target.value)}
          placeholder="Filter by event type"
        />
        <Select value={processedFilter} onValueChange={onProcessedFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Processed status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading webhook history...</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!isLoading && !error ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.eventType}</TableCell>
                  <TableCell>{row.orderId ?? row.paymentId ?? row.refundId ?? "n/a"}</TableCell>
                  <TableCell>{row.processingResult ?? "pending"}</TableCell>
                  <TableCell>{formatDateTime(row.receivedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total events: {totalCount}</p>
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
