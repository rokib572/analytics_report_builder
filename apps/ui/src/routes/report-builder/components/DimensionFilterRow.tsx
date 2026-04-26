import { ChevronDown, X } from "lucide-react"
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Label,
} from "@analytics/ui-shared"
import { FIELD_LABELS, type DimensionFilter, type FilterDimension } from "@analytics/report-builder"

type Option = { value: string; label: string }

type DimensionFilterRowProps = {
  filter: DimensionFilter
  options: Option[]
  isLoading: boolean
  onChange: (next: DimensionFilter) => void
  onRemove: () => void
}

const renderTriggerLabel = (
  filter: DimensionFilter,
  options: Option[],
  isLoading: boolean,
): string => {
  if (isLoading) return "Loading…"
  if (filter.value.length === 0)
    return `Select ${FIELD_LABELS[filter.dimension] ?? filter.dimension}…`
  if (filter.value.length <= 2) {
    return filter.value
      .map((value) => options.find((option) => option.value === value)?.label ?? value)
      .join(", ")
  }
  return `${filter.value.length} selected`
}

export const DimensionFilterRow = ({
  filter,
  options,
  isLoading,
  onChange,
  onRemove,
}: DimensionFilterRowProps) => {
  const dimensionLabel = FIELD_LABELS[filter.dimension] ?? filter.dimension
  const triggerLabel = renderTriggerLabel(filter, options, isLoading)

  const toggleValue = (value: string) => {
    const isSelected = filter.value.includes(value)
    const nextValue = isSelected
      ? filter.value.filter((entry) => entry !== value)
      : [...filter.value, value]
    onChange({ ...filter, value: nextValue })
  }

  const clearAll = () => onChange({ ...filter, value: [] })

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
        <div className="space-y-2">
          <Label>Field</Label>
          <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm">
            {dimensionLabel}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Values</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <span className="truncate text-left">{triggerLabel}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
            >
              {options.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  {isLoading ? "Loading…" : "No options available."}
                </div>
              ) : (
                <>
                  {options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filter.value.includes(option.value)}
                      onCheckedChange={() => toggleValue(option.value)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {filter.value.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="mt-1 w-full px-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear selection
                    </button>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export type { FilterDimension }
