import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@analytics/ui-shared"
import { useLocations } from "../../data/locations/hooks"
import { Router } from "../../router"

const formatAddress = (address: unknown): string => {
  if (!address || typeof address !== "object") return "—"
  const addr = address as Record<string, string>
  const parts = [addr.addressLine1, addr.locality, addr.administrativeDistrictLevel1].filter(
    Boolean,
  )
  return parts.length > 0 ? parts.join(", ") : "—"
}

export const LocationsRoute = () => {
  const { data, isPending } = useLocations()
  const locations = data?.locations ?? []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground">Your synced Square locations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <CardDescription>{locations.length} location(s) synced.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : locations.length === 0 ? (
            <p className="text-muted-foreground">
              No locations found. Connect a Square account to sync locations.
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
                    onClick={() => Router.push("LocationGet", { id: loc.id })}
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
