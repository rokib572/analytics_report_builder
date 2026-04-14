import { ChevronDown, Download } from "lucide-react"
import type { ReportConfig } from "@analytics/report-builder"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@analytics/ui-shared"
import { useExportReport } from "../../../data/report-builder/hooks"

type ExportMenuProps = {
  config: ReportConfig
  savedReportName?: string
  disabled?: boolean
}

export const ExportMenu = ({ config, savedReportName, disabled }: ExportMenuProps) => {
  const { exportReport, isPending } = useExportReport()
  const isDisabled = disabled || isPending

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" disabled={isDisabled}>
          <Download className="h-4 w-4" />
          {isPending ? "Exporting..." : "Export"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => void exportReport({ config, format: "csv", savedReportName })}
          disabled={isDisabled}
        >
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void exportReport({ config, format: "pdf", savedReportName })}
          disabled={isDisabled}
        >
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
