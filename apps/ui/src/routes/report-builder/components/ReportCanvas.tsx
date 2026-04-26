import { useDroppable } from "@dnd-kit/core"
import { BarChart3, LineChart, Plus, Table2, X } from "lucide-react"
import {
  DEFAULT_PAYROLL_TAX_RATE_PERCENT,
  MAX_PAYROLL_TAX_RATE_PERCENT,
  MIN_PAYROLL_TAX_RATE_PERCENT,
  hasCrossModePivotConflict,
  hasIncompatibleDimensions,
  isChannelBreakdownEligibleMetric,
  type ExtraColumnDescriptor,
  type ExtraColumnKind,
  type Metric,
  type ReportConfig,
} from "@analytics/report-builder"
import {
  Badge,
  Button,
  Checkbox,
  cn,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@analytics/ui-shared"
import {
  DATE_PRESETS,
  FIELD_LABELS,
  SUPPORTED_DIMENSIONS,
  getDateRangeForPreset,
  type DatePreset,
} from "../constants"

type ReportCanvasProps = {
  config: ReportConfig
  onConfigChange: (config: ReportConfig) => void
  datePreset: DatePreset
  onDatePresetChange: (preset: DatePreset) => void
  comparisonDatePreset: DatePreset
  onComparisonDatePresetChange: (preset: DatePreset) => void
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

export const ReportCanvas = ({
  config,
  onConfigChange,
  datePreset,
  onDatePresetChange,
  comparisonDatePreset,
  onComparisonDatePresetChange,
}: ReportCanvasProps) => {
  const selectedDimensions = [...config.rows, ...config.columns]
  const hasPivotModeConflict = hasCrossModePivotConflict(
    config.metrics,
    config.rows,
    config.columns,
  )
  const inlineYtdMetrics = config.inlineYtdMetrics ?? []
  const channelBreakdownMetrics = config.channelBreakdownMetrics ?? []
  const channelBreakdownEligibleSelectedMetrics = config.metrics.filter(
    isChannelBreakdownEligibleMetric,
  )
  const comparisonMetrics = config.comparisonMetrics ?? []
  const comparisonYtdMetrics = config.comparisonYtdMetrics ?? []
  const comparisonYoyMetrics = config.comparisonYoyMetrics ?? []
  const comparisonDateFrom = config.comparisonDateRange?.from ?? ""
  const comparisonDateTo = config.comparisonDateRange?.to ?? ""
  const hasComparisonDateRange = Boolean(comparisonDateFrom && comparisonDateTo)
  const isCustomComparisonDateRange = comparisonDatePreset === "custom"
  const matchesExtraColumn = (
    descriptor: ExtraColumnDescriptor,
    kind: ExtraColumnKind,
    metric: Metric,
  ) => descriptor.kind === kind && descriptor.metric === metric

  const addExtraColumn = (
    list: ExtraColumnDescriptor[],
    kind: ExtraColumnKind,
    metric: Metric,
  ): ExtraColumnDescriptor[] =>
    list.some((entry) => matchesExtraColumn(entry, kind, metric))
      ? list
      : [...list, { kind, metric }]

  const removeExtraColumn = (
    list: ExtraColumnDescriptor[],
    kind: ExtraColumnKind,
    metric: Metric,
  ): ExtraColumnDescriptor[] => list.filter((entry) => !matchesExtraColumn(entry, kind, metric))

  const deriveExtraColumnOrderFromLegacy = (): ExtraColumnDescriptor[] => {
    const derived: ExtraColumnDescriptor[] = []
    for (const metric of inlineYtdMetrics) {
      derived.push({ kind: "inlineYtd", metric })
    }
    for (const metric of comparisonMetrics) {
      derived.push({ kind: "comparison", metric })
    }
    for (const metric of comparisonYtdMetrics) {
      derived.push({ kind: "comparisonYtd", metric })
    }
    for (const metric of comparisonYoyMetrics) {
      derived.push({ kind: "comparisonYoy", metric })
    }
    if (config.inlineYtdProducts) {
      derived.push({ kind: "inlineYtdProducts", metric: "unitsSold" })
    }
    return derived
  }

  const extraColumnOrder =
    config.extraColumnOrder && config.extraColumnOrder.length > 0
      ? config.extraColumnOrder
      : deriveExtraColumnOrderFromLegacy()
  const showPayrollTaxRateInput = config.metrics.includes("estimatedPayrollAfterTax")
  const payrollTaxRatePercent = config.payrollTaxRatePercent ?? DEFAULT_PAYROLL_TAX_RATE_PERCENT

  const setPayrollTaxRatePercent = (rawValue: string) => {
    if (rawValue.trim() === "") {
      onConfigChange({ ...config, payrollTaxRatePercent: undefined })
      return
    }
    const parsed = Number(rawValue)
    if (Number.isNaN(parsed)) return
    const clamped = Math.min(
      MAX_PAYROLL_TAX_RATE_PERCENT,
      Math.max(MIN_PAYROLL_TAX_RATE_PERCENT, parsed),
    )
    onConfigChange({ ...config, payrollTaxRatePercent: clamped })
  }

  const toggleInlineYtdMetric = (metric: Metric) => {
    const isCurrentlySelected = inlineYtdMetrics.includes(metric)
    const nextMetrics = isCurrentlySelected
      ? inlineYtdMetrics.filter((item) => item !== metric)
      : [...inlineYtdMetrics, metric]
    const nextOrder = isCurrentlySelected
      ? removeExtraColumn(extraColumnOrder, "inlineYtd", metric)
      : addExtraColumn(extraColumnOrder, "inlineYtd", metric)
    onConfigChange({
      ...config,
      inlineYtdMetrics: nextMetrics.length > 0 ? nextMetrics : undefined,
      extraColumnOrder: nextOrder.length > 0 ? nextOrder : undefined,
    })
  }

  const toggleInlineYtdProducts = () => {
    const isCurrentlySelected = Boolean(config.inlineYtdProducts)
    const nextOrder = isCurrentlySelected
      ? removeExtraColumn(extraColumnOrder, "inlineYtdProducts", "unitsSold")
      : addExtraColumn(extraColumnOrder, "inlineYtdProducts", "unitsSold")
    onConfigChange({
      ...config,
      inlineYtdProducts: isCurrentlySelected ? undefined : true,
      extraColumnOrder: nextOrder.length > 0 ? nextOrder : undefined,
    })
  }

  const toggleChannelBreakdownMetric = (metric: Metric) => {
    const next = channelBreakdownMetrics.includes(metric)
      ? channelBreakdownMetrics.filter((item) => item !== metric)
      : [...channelBreakdownMetrics, metric]
    onConfigChange({
      ...config,
      channelBreakdownMetrics: next.length > 0 ? next : undefined,
    })
  }

  const toggleComparisonMetric = (metric: Metric) => {
    const isCurrentlySelected = comparisonMetrics.includes(metric)
    const nextMetrics = isCurrentlySelected
      ? comparisonMetrics.filter((item) => item !== metric)
      : [...comparisonMetrics, metric]
    const nextYtdMetrics = isCurrentlySelected
      ? comparisonYtdMetrics.filter((item) => item !== metric)
      : comparisonYtdMetrics
    const nextYoyMetrics = isCurrentlySelected
      ? comparisonYoyMetrics.filter((item) => item !== metric)
      : comparisonYoyMetrics
    let nextOrder = isCurrentlySelected
      ? removeExtraColumn(extraColumnOrder, "comparison", metric)
      : addExtraColumn(extraColumnOrder, "comparison", metric)
    if (isCurrentlySelected) {
      nextOrder = removeExtraColumn(nextOrder, "comparisonYtd", metric)
      nextOrder = removeExtraColumn(nextOrder, "comparisonYoy", metric)
    }
    onConfigChange({
      ...config,
      comparisonMetrics: nextMetrics.length > 0 ? nextMetrics : undefined,
      comparisonYtdMetrics: nextYtdMetrics.length > 0 ? nextYtdMetrics : undefined,
      comparisonYoyMetrics: nextYoyMetrics.length > 0 ? nextYoyMetrics : undefined,
      extraColumnOrder: nextOrder.length > 0 ? nextOrder : undefined,
    })
  }

  const toggleComparisonYtdMetric = (metric: Metric) => {
    const isCurrentlySelected = comparisonYtdMetrics.includes(metric)
    const nextMetrics = isCurrentlySelected
      ? comparisonYtdMetrics.filter((item) => item !== metric)
      : [...comparisonYtdMetrics, metric]
    const nextYoyMetrics = isCurrentlySelected
      ? comparisonYoyMetrics.filter((item) => item !== metric)
      : comparisonYoyMetrics
    let nextOrder = isCurrentlySelected
      ? removeExtraColumn(extraColumnOrder, "comparisonYtd", metric)
      : addExtraColumn(extraColumnOrder, "comparisonYtd", metric)
    if (isCurrentlySelected) {
      nextOrder = removeExtraColumn(nextOrder, "comparisonYoy", metric)
    }
    onConfigChange({
      ...config,
      comparisonYtdMetrics: nextMetrics.length > 0 ? nextMetrics : undefined,
      comparisonYoyMetrics: nextYoyMetrics.length > 0 ? nextYoyMetrics : undefined,
      extraColumnOrder: nextOrder.length > 0 ? nextOrder : undefined,
    })
  }

  const toggleComparisonYoyMetric = (metric: Metric) => {
    const isCurrentlySelected = comparisonYoyMetrics.includes(metric)
    const nextMetrics = isCurrentlySelected
      ? comparisonYoyMetrics.filter((item) => item !== metric)
      : [...comparisonYoyMetrics, metric]
    const nextOrder = isCurrentlySelected
      ? removeExtraColumn(extraColumnOrder, "comparisonYoy", metric)
      : addExtraColumn(extraColumnOrder, "comparisonYoy", metric)
    onConfigChange({
      ...config,
      comparisonYoyMetrics: nextMetrics.length > 0 ? nextMetrics : undefined,
      extraColumnOrder: nextOrder.length > 0 ? nextOrder : undefined,
    })
  }

  const setComparisonDateField = (field: "from" | "to", nextValue: string) => {
    const nextRange = {
      from: field === "from" ? nextValue : comparisonDateFrom,
      to: field === "to" ? nextValue : comparisonDateTo,
    }
    onConfigChange({
      ...config,
      comparisonDateRange: nextRange.from || nextRange.to ? nextRange : undefined,
    })
  }

  const handleComparisonDatePresetChange = (preset: DatePreset) => {
    onComparisonDatePresetChange(preset)
    const nextRange = getDateRangeForPreset(preset)
    if (nextRange) {
      onConfigChange({ ...config, comparisonDateRange: nextRange })
    }
  }

  const handleDatePresetChange = (preset: DatePreset) => {
    onDatePresetChange(preset)
    const nextRange = getDateRangeForPreset(preset)
    if (nextRange) {
      onConfigChange({ ...config, dateRange: nextRange })
    }
  }

  const isCustomDateRange = datePreset === "custom"

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
      <div className="space-y-3 rounded-md border border-border bg-background p-3">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => {
            const isSelected = datePreset === preset.value
            return (
              <Button
                key={preset.value}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => handleDatePresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            )
          })}
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="space-y-2">
            <Label htmlFor="report-date-from">From</Label>
            <Input
              id="report-date-from"
              type="date"
              value={config.dateRange.from}
              disabled={!isCustomDateRange}
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
              disabled={!isCustomDateRange}
              onChange={(event) =>
                onConfigChange({
                  ...config,
                  dateRange: { ...config.dateRange, to: event.target.value },
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DropZone
          id="metrics"
          label="Metrics"
          items={config.metrics}
          onRemove={(item) => {
            const removedMetric = item as Metric
            const nextOrder = (config.extraColumnOrder ?? []).filter(
              (entry) => entry.metric !== removedMetric,
            )
            onConfigChange({
              ...config,
              metrics: config.metrics.filter((metric) => metric !== removedMetric),
              inlineYtdMetrics: (config.inlineYtdMetrics ?? []).filter(
                (metric) => metric !== removedMetric,
              ),
              comparisonMetrics: (config.comparisonMetrics ?? []).filter(
                (metric) => metric !== removedMetric,
              ),
              comparisonYtdMetrics: (config.comparisonYtdMetrics ?? []).filter(
                (metric) => metric !== removedMetric,
              ),
              comparisonYoyMetrics: (config.comparisonYoyMetrics ?? []).filter(
                (metric) => metric !== removedMetric,
              ),
              channelBreakdownMetrics: (config.channelBreakdownMetrics ?? []).filter(
                (metric) => metric !== removedMetric,
              ),
              extraColumnOrder: nextOrder.length > 0 ? nextOrder : undefined,
            })
          }}
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

      {showPayrollTaxRateInput && (
        <div className="space-y-2 rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="payroll-tax-rate-percent">Payroll Tax Rate</Label>
            <span className="text-xs text-muted-foreground">
              Applied to <em>Estimated Payroll (After Tax)</em>. Default{" "}
              {DEFAULT_PAYROLL_TAX_RATE_PERCENT}%.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="payroll-tax-rate-percent"
              type="number"
              min={MIN_PAYROLL_TAX_RATE_PERCENT}
              max={MAX_PAYROLL_TAX_RATE_PERCENT}
              step={0.1}
              value={payrollTaxRatePercent}
              onChange={(event) => setPayrollTaxRatePercent(event.target.value)}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      )}

      {(config.metrics.length > 0 || config.inlineYtdProducts) && (
        <div className="space-y-2 rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <Label>Inline YTD Columns</Label>
            <span className="text-xs text-muted-foreground">
              Adds a paired Year-to-Date column next to the selected metric.
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {config.metrics.map((metric) => {
              const checkboxId = `ytd-toggle-${metric}`
              return (
                <div
                  key={metric}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={inlineYtdMetrics.includes(metric)}
                    onCheckedChange={() => toggleInlineYtdMetric(metric)}
                  />
                  <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
                    YTD {FIELD_LABELS[metric] ?? metric}
                  </Label>
                </div>
              )
            })}
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm">
              <Checkbox
                id="ytd-toggle-products"
                checked={Boolean(config.inlineYtdProducts)}
                onCheckedChange={() => toggleInlineYtdProducts()}
              />
              <Label htmlFor="ytd-toggle-products" className="cursor-pointer font-normal">
                YTD Products
              </Label>
            </div>
          </div>
          {config.rows.length === 0 && (
            <p className="text-xs text-muted-foreground">
              YTD columns only apply when at least one row dimension is selected.
            </p>
          )}
        </div>
      )}

      {channelBreakdownEligibleSelectedMetrics.length > 0 && (
        <div className="space-y-2 rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <Label>Break down by channel</Label>
            <span className="text-xs text-muted-foreground">
              Emits one column per synced channel plus a grand-total column for the selected metric.
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {channelBreakdownEligibleSelectedMetrics.map((metric) => {
              const checkboxId = `channel-breakdown-toggle-${metric}`
              return (
                <div
                  key={metric}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={channelBreakdownMetrics.includes(metric)}
                    onCheckedChange={() => toggleChannelBreakdownMetric(metric)}
                  />
                  <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
                    {FIELD_LABELS[metric] ?? metric}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {config.metrics.length > 0 && (
        <div className="space-y-3 rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <Label>Prior-Period Comparison Column</Label>
            <span className="text-xs text-muted-foreground">
              Pulls the selected metric&rsquo;s value for each row over the chosen date range.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => {
              const isSelected = comparisonDatePreset === preset.value
              return (
                <Button
                  key={preset.value}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleComparisonDatePresetChange(preset.value)}
                >
                  {preset.label}
                </Button>
              )
            })}
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="space-y-1">
              <Label htmlFor="comparison-date-from" className="font-normal">
                From
              </Label>
              <Input
                id="comparison-date-from"
                type="date"
                className="w-44"
                value={comparisonDateFrom}
                disabled={!isCustomComparisonDateRange}
                onChange={(event) => setComparisonDateField("from", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="comparison-date-to" className="font-normal">
                To
              </Label>
              <Input
                id="comparison-date-to"
                type="date"
                className="w-44"
                value={comparisonDateTo}
                disabled={!isCustomComparisonDateRange}
                onChange={(event) => setComparisonDateField("to", event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {config.metrics.map((metric) => {
              const checkboxId = `comparison-toggle-${metric}`
              const ytdCheckboxId = `comparison-ytd-toggle-${metric}`
              const yoyCheckboxId = `comparison-yoy-toggle-${metric}`
              const isComparing = comparisonMetrics.includes(metric)
              return (
                <div
                  key={metric}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={isComparing}
                    onCheckedChange={() => toggleComparisonMetric(metric)}
                    disabled={!hasComparisonDateRange}
                  />
                  <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
                    {FIELD_LABELS[metric] ?? metric}
                  </Label>
                  <span className="ml-2 flex items-center gap-1 border-l border-border pl-2">
                    <Checkbox
                      id={ytdCheckboxId}
                      checked={comparisonYtdMetrics.includes(metric)}
                      onCheckedChange={() => toggleComparisonYtdMetric(metric)}
                      disabled={!hasComparisonDateRange || !isComparing}
                    />
                    <Label
                      htmlFor={ytdCheckboxId}
                      className="cursor-pointer text-xs font-normal text-muted-foreground"
                    >
                      YTD
                    </Label>
                  </span>
                  <span className="ml-2 flex items-center gap-1 border-l border-border pl-2">
                    <Checkbox
                      id={yoyCheckboxId}
                      checked={comparisonYoyMetrics.includes(metric)}
                      onCheckedChange={() => toggleComparisonYoyMetric(metric)}
                      disabled={
                        !hasComparisonDateRange ||
                        !isComparing ||
                        !comparisonYtdMetrics.includes(metric)
                      }
                    />
                    <Label
                      htmlFor={yoyCheckboxId}
                      className="cursor-pointer text-xs font-normal text-muted-foreground"
                    >
                      YOY
                    </Label>
                  </span>
                </div>
              )
            })}
          </div>
          {!hasComparisonDateRange && comparisonMetrics.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Pick a comparison date range to activate these columns.
            </p>
          )}
        </div>
      )}

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
