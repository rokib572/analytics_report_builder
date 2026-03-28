import { useEffect, useRef, useState } from "react"
import { Input } from "../input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"
import { Label } from "../label"
import type { SearchConfig } from "./types"

type DataTableToolbarProps = {
  searchConfig: SearchConfig[]
  filterValues: Record<string, string>
  onFilterChange: (filters: Record<string, string>) => void
}

const DEBOUNCE_MS = 300

const TextFilter = ({
  config,
  value,
  onChange,
}: {
  config: { field: string; placeholder?: string }
  value: string
  onChange: (field: string, value: string) => void
}) => {
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onChange(config.field, newValue)
    }, DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <Input
      placeholder={config.placeholder ?? "Search..."}
      value={localValue}
      onChange={handleChange}
      className="h-9 min-w-[200px] flex-1"
    />
  )
}

const SelectFilter = ({
  config,
  value,
  onChange,
}: {
  config: {
    field: string
    label?: string
    options: Array<{ label: string; value: string }>
    placeholder?: string
  }
  value: string
  onChange: (field: string, value: string) => void
}) => {
  return (
    <div className="flex items-center gap-2">
      {config.label && (
        <Label className="text-sm text-muted-foreground whitespace-nowrap">{config.label}</Label>
      )}
      <Select
        value={value || undefined}
        onValueChange={(v) => onChange(config.field, v === "__all__" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder={config.placeholder ?? "All"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{config.placeholder ?? "All"}</SelectItem>
          {config.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const DateRangeFilter = ({
  config,
  valueFrom,
  valueTo,
  onChange,
}: {
  config: { fieldFrom: string; fieldTo: string; label?: string }
  valueFrom: string
  valueTo: string
  onChange: (field: string, value: string) => void
}) => {
  return (
    <div className="flex items-center gap-2">
      {config.label && (
        <Label className="text-sm text-muted-foreground whitespace-nowrap">{config.label}</Label>
      )}
      <Input
        type="date"
        value={valueFrom}
        onChange={(e) => onChange(config.fieldFrom, e.target.value)}
        className="h-9 w-[150px]"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        value={valueTo}
        onChange={(e) => onChange(config.fieldTo, e.target.value)}
        className="h-9 w-[150px]"
      />
    </div>
  )
}

export const DataTableToolbar = ({
  searchConfig,
  filterValues,
  onFilterChange,
}: DataTableToolbarProps) => {
  const handleChange = (field: string, value: string) => {
    onFilterChange({ ...filterValues, [field]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      {searchConfig.map((config) => {
        switch (config.type) {
          case "text":
            return (
              <TextFilter
                key={config.field}
                config={config}
                value={filterValues[config.field] ?? ""}
                onChange={handleChange}
              />
            )
          case "select":
            return (
              <SelectFilter
                key={config.field}
                config={config}
                value={filterValues[config.field] ?? ""}
                onChange={handleChange}
              />
            )
          case "date-range":
            return (
              <DateRangeFilter
                key={`${config.fieldFrom}-${config.fieldTo}`}
                config={config}
                valueFrom={filterValues[config.fieldFrom] ?? ""}
                valueTo={filterValues[config.fieldTo] ?? ""}
                onChange={handleChange}
              />
            )
        }
      })}
    </div>
  )
}
