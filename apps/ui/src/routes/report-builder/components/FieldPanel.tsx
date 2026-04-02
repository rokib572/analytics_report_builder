import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { ChevronDown, ChevronRight, GripVertical, LayoutGrid, Sigma } from "lucide-react"
import {
  isSupportedMetric,
  type Dimension,
  type Metric,
  type SupportedMetric,
} from "@analytics/report-builder"
import {
  Badge,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@analytics/ui-shared"

type FieldPanelProps = {
  activeMetrics: string[]
  activeDimensions: string[]
}

type DraggableFieldProps = {
  id: string
  type: "metric" | "dimension"
  label: string
  isActive: boolean
}

const FIELD_LABELS: Record<string, string> = {
  netSales: "Net Sales",
  grossSales: "Gross Sales",
  orderCount: "Order Count",
  storeGrossSales: "Store Gross Sales",
  totalDiscounts: "Total Discounts",
  totalTax: "Total Tax",
  totalTips: "Total Tips",
  totalCollected: "Total Collected",
  locationId: "Location",
  saleDate: "Sale Date",
  dayOfWeek: "Day of Week",
  week: "Week",
  month: "Month",
}

const ALL_METRICS: Metric[] = [
  "netSales",
  "grossSales",
  "orderCount",
  "storeGrossSales",
  "uberGrossSales",
  "uberBogoRecoverable",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
]

const SUPPORTED_METRICS: SupportedMetric[] = ALL_METRICS.filter(isSupportedMetric)

const SUPPORTED_DIMENSIONS: Exclude<Dimension, "channel">[] = [
  "locationId",
  "saleDate",
  "dayOfWeek",
  "week",
  "month",
]

const DraggableField = ({ id, type, label, isActive }: DraggableFieldProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type, name: id },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const Icon = type === "metric" ? Sigma : LayoutGrid

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors",
        "cursor-grab hover:bg-accent hover:text-accent-foreground",
        (isDragging || isActive) && "opacity-50",
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <Badge variant="outline" className="h-6 w-6 rounded-full p-0">
        <Icon className="m-auto h-3.5 w-3.5" />
      </Badge>
      <span className="flex-1">{label}</span>
    </div>
  )
}

export const FieldPanel = ({ activeMetrics, activeDimensions }: FieldPanelProps) => {
  const [metricsOpen, setMetricsOpen] = useState(true)
  const [dimensionsOpen, setDimensionsOpen] = useState(true)

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-background">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Fields</h2>
        <p className="text-xs text-muted-foreground">
          Drag metrics and dimensions into the canvas.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-sm font-medium">
            <span>Metrics</span>
            {metricsOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {SUPPORTED_METRICS.map((metric) => (
              <DraggableField
                key={metric}
                id={metric}
                type="metric"
                label={FIELD_LABELS[metric]}
                isActive={activeMetrics.includes(metric)}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={dimensionsOpen} onOpenChange={setDimensionsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-sm font-medium">
            <span>Dimensions</span>
            {dimensionsOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {SUPPORTED_DIMENSIONS.map((dimension) => (
              <DraggableField
                key={dimension}
                id={dimension}
                type="dimension"
                label={FIELD_LABELS[dimension]}
                isActive={activeDimensions.includes(dimension)}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </aside>
  )
}
