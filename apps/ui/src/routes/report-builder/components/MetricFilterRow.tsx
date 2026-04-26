import { X } from "lucide-react"
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@analytics/ui-shared"
import type { MetricFilter } from "@analytics/report-builder"
import { FILTER_METRIC_LABELS, isMonetaryFilterMetric } from "../constants"

type MetricFilterRowProps = {
  filter: MetricFilter
  onChange: (next: MetricFilter) => void
  onRemove: () => void
}

const OPERATOR_OPTIONS: Array<{ value: MetricFilter["operator"]; label: string }> = [
  { value: "eq", label: "Equal" },
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "between", label: "Between" },
]

const getInputPlaceholder = (filter: MetricFilter): string => {
  if (isMonetaryFilterMetric(filter.metric)) return "0.00"
  return "0"
}

export const MetricFilterRow = ({ filter, onChange, onRemove }: MetricFilterRowProps) => {
  const fieldLabel = FILTER_METRIC_LABELS[filter.metric]
  const isBetween = filter.operator === "between"
  const placeholder = getInputPlaceholder(filter)

  const handleOperatorChange = (nextOperator: MetricFilter["operator"]) => {
    if (nextOperator === "between") {
      onChange({ ...filter, operator: "between", value: ["", ""] })
      return
    }
    onChange({ ...filter, operator: nextOperator, value: "" })
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
        <div className="space-y-2">
          <Label>Field</Label>
          <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm">
            {fieldLabel}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Operator</Label>
          <Select value={filter.operator} onValueChange={handleOperatorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {OPERATOR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Value</Label>
          {isBetween ? (
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                type="number"
                step="any"
                value={Array.isArray(filter.value) ? filter.value[0] : ""}
                placeholder="From"
                onChange={(event) =>
                  onChange({
                    ...filter,
                    operator: "between",
                    value: [event.target.value, Array.isArray(filter.value) ? filter.value[1] : ""],
                  })
                }
              />
              <Input
                type="number"
                step="any"
                value={Array.isArray(filter.value) ? filter.value[1] : ""}
                placeholder="To"
                onChange={(event) =>
                  onChange({
                    ...filter,
                    operator: "between",
                    value: [Array.isArray(filter.value) ? filter.value[0] : "", event.target.value],
                  })
                }
              />
            </div>
          ) : (
            <Input
              type="number"
              step="any"
              value={typeof filter.value === "string" ? filter.value : ""}
              placeholder={placeholder}
              onChange={(event) =>
                onChange({
                  ...filter,
                  operator: filter.operator === "between" ? "eq" : filter.operator,
                  value: event.target.value,
                })
              }
            />
          )}
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
