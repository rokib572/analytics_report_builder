import { useState } from "react"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { type Dimension, type Metric, type ReportConfig } from "@analytics/report-builder"
import { FieldPanel } from "./components/FieldPanel"

const SUPPORTED_METRICS: Metric[] = [
  "netSales",
  "grossSales",
  "orderCount",
  "storeGrossSales",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
]

const SUPPORTED_DIMENSIONS: Exclude<Dimension, "channel">[] = [
  "locationId",
  "saleDate",
  "dayOfWeek",
  "week",
  "month",
]

const isSupportedMetricValue = (value: string): value is Metric =>
  SUPPORTED_METRICS.includes(value as Metric)

const isSupportedDimension = (value: string): value is Exclude<Dimension, "channel"> =>
  SUPPORTED_DIMENSIONS.includes(value as Exclude<Dimension, "channel">)

const getDefaultDateRange = () => {
  const today = new Date()
  const from = new Date()
  from.setDate(today.getDate() - 30)

  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  }
}

export const ReportBuilderRoute = () => {
  const [config, setConfig] = useState<ReportConfig>({
    metrics: [],
    rows: [],
    columns: [],
    filters: [],
    chartType: "table",
    dateRange: getDefaultDateRange(),
  })

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
        <div className="flex-1 p-4">
          <div className="rounded-lg border border-dashed border-border p-6">
            <h1 className="text-lg font-semibold">Report Builder</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Report canvas and preview panel will be implemented in tasks 3.4 and 3.5.
            </p>
          </div>
        </div>
      </div>
    </DndContext>
  )
}
