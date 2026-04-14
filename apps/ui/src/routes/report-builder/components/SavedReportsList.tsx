import type { ReportConfig } from "@analytics/report-builder"
import { Button, Skeleton } from "@analytics/ui-shared"
import { Trash2 } from "lucide-react"
import { useDeleteReport, useSavedReports } from "../../../data/report-builder/hooks"
import { ExportMenu } from "./ExportMenu"

type SavedReportsListProps = {
  onOpen: (config: ReportConfig) => void
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

export const SavedReportsList = ({ onOpen }: SavedReportsListProps) => {
  const savedReports = useSavedReports()
  const deleteReport = useDeleteReport()

  if (savedReports.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (savedReports.error) {
    return <p className="text-sm text-destructive">Failed to load saved reports.</p>
  }

  if (!savedReports.data?.length) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
        No saved reports yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {savedReports.data.map((report) => (
        <div
          key={report.id}
          className="flex items-center justify-between rounded-lg border bg-card p-4"
        >
          <div className="space-y-1">
            <p className="font-medium">{report.name}</p>
            <p className="text-sm text-muted-foreground">Updated {formatDate(report.updatedAt)}</p>
          </div>
          <div className="flex gap-2">
            <ExportMenu config={report.config} savedReportName={report.name} />
            <Button type="button" variant="outline" onClick={() => onOpen(report.config)}>
              Open
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => deleteReport.mutate(report.id)}
              disabled={deleteReport.isPending}
              aria-label={`Delete ${report.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
