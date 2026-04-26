import { useMemo } from "react"
import { Plus } from "lucide-react"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
} from "@analytics/ui-shared"
import {
  FIELD_LABELS,
  type DimensionFilter,
  type FilterDimension,
  type FilterMetric,
  type MetricFilter,
  type ReportConfig,
  type ReportFilter,
} from "@analytics/report-builder"
import { useChannels } from "../../../data/channels/hooks"
import { useLocations } from "../../../data/square/locations/hooks"
import { useProductCategoriesList, useProductsList } from "../../../data/products/hooks"
import { useSquareCustomerNamesList } from "../../../data/square-customers/hooks"
import { FILTER_DIMENSIONS, FILTER_METRIC_LABELS, FILTER_METRICS } from "../constants"
import { DimensionFilterRow } from "./DimensionFilterRow"
import { MetricFilterRow } from "./MetricFilterRow"

type Option = { value: string; label: string }

type FilterSectionProps = {
  config: ReportConfig
  onConfigChange: (config: ReportConfig) => void
}

const buildEmptyDimensionFilter = (dimension: FilterDimension): DimensionFilter => ({
  kind: "dimension",
  dimension,
  operator: "in",
  value: [],
})

const buildEmptyMetricFilter = (metric: FilterMetric): MetricFilter => ({
  kind: "metric",
  metric,
  operator: "eq",
  value: "",
})

export const FilterSection = ({ config, onConfigChange }: FilterSectionProps) => {
  const locationsQuery = useLocations({ page: 1, limit: 100, search: "" })
  const channelsQuery = useChannels()
  const productsQuery = useProductsList()
  const productCategoriesQuery = useProductCategoriesList()
  const customerNamesQuery = useSquareCustomerNamesList()

  const locationOptions: Option[] = useMemo(() => {
    const payload = locationsQuery.data as
      | { locations?: Array<{ id: string; name: string }> }
      | undefined
    const list = payload?.locations
    if (!list) return []
    return list.map((entry) => ({ value: entry.id, label: entry.name }))
  }, [locationsQuery.data])

  const channelOptions: Option[] = useMemo(
    () =>
      (channelsQuery.data ?? []).map((entry) => ({ value: entry.id, label: entry.displayName })),
    [channelsQuery.data],
  )

  const productOptions: Option[] = useMemo(
    () => (productsQuery.data ?? []).map((name) => ({ value: name, label: name })),
    [productsQuery.data],
  )
  const productCategoryOptions: Option[] = useMemo(
    () => (productCategoriesQuery.data ?? []).map((name) => ({ value: name, label: name })),
    [productCategoriesQuery.data],
  )
  const customerOptions: Option[] = useMemo(
    () => (customerNamesQuery.data ?? []).map((name) => ({ value: name, label: name })),
    [customerNamesQuery.data],
  )

  const optionsForDimension = (
    dimension: FilterDimension,
  ): {
    options: Option[]
    isLoading: boolean
  } => {
    if (dimension === "locationId")
      return { options: locationOptions, isLoading: locationsQuery.isLoading }
    if (dimension === "channel")
      return { options: channelOptions, isLoading: channelsQuery.isLoading }
    if (dimension === "customer")
      return { options: customerOptions, isLoading: customerNamesQuery.isLoading }
    if (dimension === "product")
      return { options: productOptions, isLoading: productsQuery.isLoading }
    return { options: productCategoryOptions, isLoading: productCategoriesQuery.isLoading }
  }

  const replaceFilter = (index: number, next: ReportFilter) => {
    onConfigChange({
      ...config,
      filters: config.filters.map((entry, entryIndex) => (entryIndex === index ? next : entry)),
    })
  }

  const removeFilter = (index: number) => {
    onConfigChange({
      ...config,
      filters: config.filters.filter((_, entryIndex) => entryIndex !== index),
    })
  }

  const addDimensionFilter = (dimension: FilterDimension) => {
    onConfigChange({
      ...config,
      filters: [...config.filters, buildEmptyDimensionFilter(dimension)],
    })
  }

  const addMetricFilter = (metric: FilterMetric) => {
    onConfigChange({
      ...config,
      filters: [...config.filters, buildEmptyMetricFilter(metric)],
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Filters</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Dimensions</DropdownMenuLabel>
            {FILTER_DIMENSIONS.map((dimension) => (
              <DropdownMenuItem key={dimension} onSelect={() => addDimensionFilter(dimension)}>
                {FIELD_LABELS[dimension] ?? dimension}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Metrics</DropdownMenuLabel>
            {FILTER_METRICS.map((metric) => (
              <DropdownMenuItem key={metric} onSelect={() => addMetricFilter(metric)}>
                {FILTER_METRIC_LABELS[metric]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {config.filters.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          No filters added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {config.filters.map((filter, index) => {
            if (filter.kind === "dimension") {
              const { options, isLoading } = optionsForDimension(filter.dimension)
              return (
                <DimensionFilterRow
                  key={`${filter.kind}-${filter.dimension}-${index}`}
                  filter={filter}
                  options={options}
                  isLoading={isLoading}
                  onChange={(next) => replaceFilter(index, next)}
                  onRemove={() => removeFilter(index)}
                />
              )
            }
            return (
              <MetricFilterRow
                key={`${filter.kind}-${filter.metric}-${index}`}
                filter={filter}
                onChange={(next) => replaceFilter(index, next)}
                onRemove={() => removeFilter(index)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
