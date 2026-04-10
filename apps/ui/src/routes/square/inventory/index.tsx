import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type PaginationState,
} from "@analytics/ui-shared"
import { useInventoryCounts } from "../../../data/square/inventory/hooks"
import { useLocations } from "../../../data/square/locations/hooks"
import { columns } from "./column-definition"

export const InventoryRoute = () => {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 20 })
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isPending } = useInventoryCounts({
    page: pagination.page,
    limit: pagination.limit,
    locationId: filters.locationId,
    search: filters.search,
  })
  const { data: locationsData } = useLocations({ page: 1, limit: 100, search: "" })
  const locationOptions = (locationsData?.locations ?? []).map(
    (location: { id: string; name: string }) => ({
      label: location.name,
      value: location.id,
    }),
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Current in-stock quantities across your locations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>{data?.pagination.totalCount ?? 0} item(s) in stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            pagination={data?.pagination ?? { page: 1, limit: 20, totalCount: 0 }}
            onPaginationChange={setPagination}
            searchConfig={[
              { type: "text", field: "search", placeholder: "Search by item name or SKU" },
              {
                type: "select",
                field: "locationId",
                label: "Location",
                options: locationOptions,
                placeholder: "All locations",
              },
            ]}
            filterValues={filters}
            onFilterChange={(nextFilters) => {
              setFilters(nextFilters)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            isLoading={isPending}
            emptyMessage="No inventory items found."
          />
        </CardContent>
      </Card>
    </div>
  )
}
