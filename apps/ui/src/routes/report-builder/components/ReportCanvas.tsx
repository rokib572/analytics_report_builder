import { useDroppable } from "@dnd-kit/core"
import { BarChart3, LineChart, Plus, Table2, X } from "lucide-react"
import {
  hasCrossModePivotConflict,
  hasIncompatibleDimensions,
  type ReportConfig,
} from "@analytics/report-builder"
import {
  Badge,
  Button,
  cn,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@analytics/ui-shared"
import { FIELD_LABELS, SUPPORTED_DIMENSIONS } from "../constants"

type ReportCanvasProps = {
  config: ReportConfig
  onConfigChange: (config: ReportConfig) => void
}

type DropZoneProps = {
  id: "metrics" | "rows" | "columns"
  label: string
  items: string[]
  onRemove: (item: string) => void
}

const FILTER_OPERATORS: ReportConfig["filters"][number]["operator"][] = ["eq", "in", "between"]

const DropZone = ({ id, label, items, onRemove }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-28 rounded-lg border border-dashed border-border bg-background p-3 transition-colors",
          isOver && "border-primary bg-primary/5",
        )}
      >
        {items.length === 0 ? (
          <div className="flex h-full min-h-20 items-center justify-center text-sm text-muted-foreground">
            Drop {label.toLowerCase()} here
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="flex items-center gap-1 rounded-full px-2 py-1"
              >
                <span>{FIELD_LABELS[item] ?? item}</span>
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="rounded-full p-0.5 hover:bg-black/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const ReportCanvas = ({ config, onConfigChange }: ReportCanvasProps) => {
  const selectedDimensions = [...config.rows, ...config.columns]
  const hasPivotModeConflict = hasCrossModePivotConflict(config.rows, config.columns)

  const updateFilter = (
    index: number,
    field: keyof ReportConfig["filters"][number],
    value: ReportConfig["filters"][number][keyof ReportConfig["filters"][number]],
  ) => {
    onConfigChange({
      ...config,
      filters: config.filters.map((filter, filterIndex) =>
        filterIndex === index ? { ...filter, [field]: value } : filter,
      ),
    })
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DropZone
          id="metrics"
          label="Metrics"
          items={config.metrics}
          onRemove={(item) =>
            onConfigChange({
              ...config,
              metrics: config.metrics.filter((metric) => metric !== item),
            })
          }
        />
        <DropZone
          id="rows"
          label="Rows"
          items={config.rows}
          onRemove={(item) =>
            onConfigChange({
              ...config,
              rows: config.rows.filter((row) => row !== item),
            })
          }
        />
        <DropZone
          id="columns"
          label="Columns"
          items={config.columns}
          onRemove={(item) =>
            onConfigChange({
              ...config,
              columns: config.columns.filter((column) => column !== item),
            })
          }
        />
      </div>

      {(hasIncompatibleDimensions(selectedDimensions) || hasPivotModeConflict) && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {hasPivotModeConflict
            ? "Rows and columns must use dimensions from the same query mode when pivoting."
            : "Product and Payment Method cannot be used in the same report."}
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="space-y-2">
            <Label htmlFor="report-date-from">From</Label>
            <Input
              id="report-date-from"
              type="date"
              value={config.dateRange.from}
              onChange={(event) =>
                onConfigChange({
                  ...config,
                  dateRange: { ...config.dateRange, from: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-date-to">To</Label>
            <Input
              id="report-date-to"
              type="date"
              value={config.dateRange.to}
              onChange={(event) =>
                onConfigChange({
                  ...config,
                  dateRange: { ...config.dateRange, to: event.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Chart Type</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={config.chartType === "table" ? "default" : "outline"}
              onClick={() => onConfigChange({ ...config, chartType: "table" })}
            >
              <Table2 className="mr-2 h-4 w-4" />
              Table
            </Button>
            <Button
              type="button"
              variant={config.chartType === "bar" ? "default" : "outline"}
              onClick={() => onConfigChange({ ...config, chartType: "bar" })}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Bar
            </Button>
            <Button
              type="button"
              variant={config.chartType === "line" ? "default" : "outline"}
              onClick={() => onConfigChange({ ...config, chartType: "line" })}
            >
              <LineChart className="mr-2 h-4 w-4" />
              Line
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Filters</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onConfigChange({
                ...config,
                filters: [
                  ...config.filters,
                  {
                    dimension: "locationId",
                    operator: "eq",
                    value: "",
                  },
                ],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
        </div>

        {config.filters.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No filters added yet.
          </div>
        ) : (
          <div className="space-y-3">
            {config.filters.map((filter, index) => (
              <div
                key={`${filter.dimension}-${index}`}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1.6fr_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>Dimension</Label>
                    <Select
                      value={filter.dimension}
                      onValueChange={(value) =>
                        onConfigChange({
                          ...config,
                          filters: config.filters.map((currentFilter, filterIndex) =>
                            filterIndex === index
                              ? {
                                  ...currentFilter,
                                  dimension: value as (typeof SUPPORTED_DIMENSIONS)[number],
                                }
                              : currentFilter,
                          ),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dimension" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_DIMENSIONS.map((dimension) => (
                          <SelectItem key={dimension} value={dimension}>
                            {FIELD_LABELS[dimension]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={filter.operator}
                      onValueChange={(value) =>
                        onConfigChange({
                          ...config,
                          filters: config.filters.map((currentFilter, filterIndex) =>
                            filterIndex === index
                              ? {
                                  ...currentFilter,
                                  operator: value as ReportConfig["filters"][number]["operator"],
                                  value: value === "between" ? ["", ""] : "",
                                }
                              : currentFilter,
                          ),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_OPERATORS.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Value</Label>
                    {filter.operator === "between" ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          value={Array.isArray(filter.value) ? (filter.value[0] ?? "") : ""}
                          onChange={(event) =>
                            updateFilter(index, "value", [
                              event.target.value,
                              Array.isArray(filter.value) ? (filter.value[1] ?? "") : "",
                            ])
                          }
                          placeholder="From"
                        />
                        <Input
                          value={Array.isArray(filter.value) ? (filter.value[1] ?? "") : ""}
                          onChange={(event) =>
                            updateFilter(index, "value", [
                              Array.isArray(filter.value) ? (filter.value[0] ?? "") : "",
                              event.target.value,
                            ])
                          }
                          placeholder="To"
                        />
                      </div>
                    ) : (
                      <Input
                        value={Array.isArray(filter.value) ? filter.value.join(",") : filter.value}
                        onChange={(event) =>
                          updateFilter(
                            index,
                            "value",
                            filter.operator === "in"
                              ? event.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                              : event.target.value,
                          )
                        }
                        placeholder={filter.operator === "in" ? "A, B, C" : "Enter value"}
                      />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onConfigChange({
                        ...config,
                        filters: config.filters.filter((_, filterIndex) => filterIndex !== index),
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
