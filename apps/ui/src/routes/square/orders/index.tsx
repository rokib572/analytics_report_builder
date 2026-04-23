import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type PaginationState,
} from "@analytics/ui-shared"
import { useLocations } from "../../../data/square/locations/hooks"
import { useOrders } from "../../../data/square/orders/hooks"
import { Router } from "../../../router"
import { buildColumns } from "./column-definition"

export const OrdersRoute = () => {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10 })
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isPending } = useOrders({
    page: pagination.page,
    limit: pagination.limit,
    locationId: filters.locationId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  })
  const { data: locationsData } = useLocations({ page: 1, limit: 100, search: "" })
  const locations = locationsData?.locations ?? []
  const locationOptions = locations.map((location) => ({
    label: location.name,
    value: location.id,
  }))
  const locationNames = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations],
  )
  const columns = useMemo(() => buildColumns(locationNames), [locationNames])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Browse synced Square orders and inspect line items.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>{data?.pagination.totalCount ?? 0} order(s) available.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.orders ?? []}
            pagination={data?.pagination ?? { page: 1, limit: 10, totalCount: 0 }}
            onPaginationChange={setPagination}
            searchConfig={[
              {
                type: "select",
                field: "locationId",
                label: "Location",
                options: locationOptions,
                placeholder: "All locations",
              },
              { type: "date-range", fieldFrom: "dateFrom", fieldTo: "dateTo", label: "Sale Date" },
            ]}
            filterValues={filters}
            onFilterChange={(nextFilters) => {
              setFilters(nextFilters)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            isLoading={isPending}
            emptyMessage="No orders found."
            onRowClick={(row) => Router.push("SquareOrderGet", { id: row.id })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
