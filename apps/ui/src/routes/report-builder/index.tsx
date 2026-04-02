import { useState } from "react"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import type { ReportConfig } from "@analytics/report-builder"
import { useReportQuery } from "../../data/report-builder/hooks"
import { ReportCanvas } from "./components/ReportCanvas"
import { FieldPanel } from "./components/FieldPanel"
import { PreviewPanel } from "./components/PreviewPanel"
import { getDefaultDateRange, isSupportedDimension, isSupportedMetricValue } from "./constants"

export const ReportBuilderRoute = () => {
  const [config, setConfig] = useState<ReportConfig>({
    metrics: [],
    rows: [],
    columns: [],
    filters: [],
    chartType: "table",
    dateRange: getDefaultDateRange(),
  })
  const reportQuery = useReportQuery(config.metrics.length > 0 ? config : null)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return

    const dragData = active.data.current
    if (!dragData) return

    const fieldType = dragData.type
    const fieldName = dragData.name

    if (typeof fieldType !== "string" || typeof fieldName !== "string") return

    setConfig((current: ReportConfig) => {
      if (
        fieldType === "metric" &&
        isSupportedMetricValue(fieldName) &&
        over.id === "metrics" &&
        !current.metrics.includes(fieldName)
      ) {
        return { ...current, metrics: [...current.metrics, fieldName] }
      }

      if (
        fieldType === "dimension" &&
        isSupportedDimension(fieldName) &&
        over.id === "rows" &&
        !current.rows.includes(fieldName) &&
        !current.columns.includes(fieldName)
      ) {
        return { ...current, rows: [...current.rows, fieldName] }
      }

      if (
        fieldType === "dimension" &&
        isSupportedDimension(fieldName) &&
        over.id === "columns" &&
        !current.columns.includes(fieldName) &&
        !current.rows.includes(fieldName)
      ) {
        return { ...current, columns: [...current.columns, fieldName] }
      }

      return current
    })
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-[calc(100vh-4rem)]">
        <FieldPanel
          activeMetrics={config.metrics}
          activeDimensions={[...config.rows, ...config.columns]}
        />
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <ReportCanvas config={config} onConfigChange={setConfig} />
          <PreviewPanel
            result={reportQuery.data}
            chartType={config.chartType}
            isLoading={reportQuery.isLoading}
            error={reportQuery.error}
          />
        </div>
      </div>
    </DndContext>
  )
}
