import { useEffect, useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@analytics/ui-shared"
import { useLocations } from "../../../data/square/locations/hooks"
import { Router } from "../../../router"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const formatAddress = (address: unknown): string => {
  if (!address || typeof address !== "object") return "—"
  const addr = address as Record<string, string>
  const parts = [addr.addressLine1, addr.locality, addr.administrativeDistrictLevel1].filter(
    Boolean,
  )
  return parts.length > 0 ? parts.join(", ") : "—"
}

const getPageItems = (currentPage: number, totalPages: number): Array<number | "ellipsis"> => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items: Array<number | "ellipsis"> = []

  for (const page of sortedPages) {
    const previous = items[items.length - 1]
    if (typeof previous === "number" && page - previous > 1) {
      items.push("ellipsis")
    }
    items.push(page)
  }

  return items
}

export const LocationsRoute = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]!)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const { data, isPending } = useLocations({ page, limit: pageSize, search })
  const locations = data?.locations ?? []
  const totalCount = data?.pagination.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endRecord = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount)
  const pageItems = getPageItems(page, totalPages)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground">Your synced Square locations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <CardDescription>{totalCount} location(s) synced.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-muted-foreground">
                Show
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">entries</span>
            </div>

            <div className="w-full md:max-w-sm">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by location name"
                aria-label="Search locations"
              />
            </div>
          </div>

          {isPending ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : locations.length === 0 ? (
            <p className="text-muted-foreground">
              {search
                ? "No locations match your search."
                : "No locations found. Connect a Square account to sync locations."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Last Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow
                    key={loc.id}
                    className="cursor-pointer"
                    onClick={() => Router.push("SquareLocationGet", { id: loc.id })}
                  >
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={loc.status} />
                    </TableCell>
                    <TableCell>{formatAddress(loc.address)}</TableCell>
                    <TableCell>{loc.timezone ?? "—"}</TableCell>
                    <TableCell>
                      {loc.syncedAt ? new Date(loc.syncedAt).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Total: {totalCount} locations</p>
              <p>
                Showing records from {startRecord} to {endRecord}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
              </Button>

              {totalCount > 0 &&
                pageItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === page ? "default" : "outline"}
                      onClick={() => setPage(item)}
                      disabled={item === page}
                    >
                      {item}
                    </Button>
                  ),
                )}

              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || totalCount === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      status === "ACTIVE"
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }`}
  >
    {status}
  </span>
)
