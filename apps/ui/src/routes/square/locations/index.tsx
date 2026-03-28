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
import { useLocations } from "../../../data/square/locations/hooks"
import { Router } from "../../../router"
import { columns } from "./column-definition"

export const LocationsRoute = () => {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10 })
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isPending } = useLocations({
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search ?? "",
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground">Your synced Square locations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <CardDescription>{data?.pagination.totalCount ?? 0} location(s) synced.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.locations ?? []}
            pagination={data?.pagination ?? { page: 1, limit: 10, totalCount: 0 }}
            onPaginationChange={setPagination}
            searchConfig={[
              { type: "text", field: "search", placeholder: "Search by location name" },
            ]}
            filterValues={filters}
            onFilterChange={(f) => {
              setFilters(f)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            isLoading={isPending}
            emptyMessage="No locations found. Connect a Square account to sync locations."
            onRowClick={(row) => Router.push("SquareLocationGet", { id: row.id })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
