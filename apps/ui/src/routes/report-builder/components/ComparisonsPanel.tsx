import type { ReportComparisons, ReportConfig } from "@analytics/report-builder"
import { Checkbox, Label } from "@analytics/ui-shared"

type ComparisonsPanelProps = {
  config: ReportConfig
  onConfigChange: (config: ReportConfig) => void
}

type ComparisonOption = {
  key: keyof ReportComparisons
  label: string
  description: string
}

const COMPARISON_OPTIONS: ComparisonOption[] = [
  { key: "total", label: "Total", description: "Sum across all rows for the selected period" },
  {
    key: "compingOnly",
    label: "Comping",
    description: "Stores open for at least a full year before the period start",
  },
  {
    key: "previousPeriod",
    label: "Previous Period",
    description: "Same range shifted back 7 days",
  },
  {
    key: "yearOverYear",
    label: "Year Over Year",
    description: "Same range shifted back one year",
  },
  {
    key: "yearToDate",
    label: "Year To Date",
    description: "From January 1 of the end-date's year through the end date",
  },
  {
    key: "includeChangePercent",
    label: "Change % vs Previous Period",
    description:
      "Percent change from Previous Period to Total — ((total − previous) / previous) × 100",
  },
  {
    key: "includeYearOverYearChangePercent",
    label: "Year Over Year Change %",
    description: "Percent change from Year Over Year to Total — ((total − yoy) / yoy) × 100",
  },
]

export const ComparisonsPanel = ({ config, onConfigChange }: ComparisonsPanelProps) => {
  const comparisons = config.comparisons ?? {}

  const updateComparison = (key: keyof ReportComparisons, value: boolean) => {
    const nextComparisons: ReportComparisons = { ...comparisons, [key]: value }
    const hasAnyEnabled = Object.values(nextComparisons).some(Boolean)
    onConfigChange({
      ...config,
      comparisons: hasAnyEnabled ? nextComparisons : undefined,
    })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <Label>Comparisons</Label>
        <p className="text-sm text-muted-foreground">
          Adds summary rows beneath the main table for side-by-side comparisons.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {COMPARISON_OPTIONS.map((option) => {
          const checkboxId = `comparison-${option.key}`
          return (
            <label
              key={option.key}
              htmlFor={checkboxId}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background p-3 hover:border-primary/50"
            >
              <Checkbox
                id={checkboxId}
                checked={Boolean(comparisons[option.key])}
                onCheckedChange={(checked) => updateComparison(option.key, checked === true)}
              />
              <div className="space-y-0.5">
                <span className="text-sm font-medium leading-none">{option.label}</span>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
