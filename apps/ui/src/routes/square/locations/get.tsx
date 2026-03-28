import { Button, Card, CardContent, CardHeader, CardTitle } from "@analytics/ui-shared"
import { useLocation } from "../../../data/square/locations/hooks"
import { Router } from "../../../router"

const formatFullAddress = (address: unknown): string => {
  if (!address || typeof address !== "object") return "—"
  const addr = address as Record<string, string>
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    addr.addressLine3,
    [addr.locality, addr.administrativeDistrictLevel1, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join("\n") : "—"
}

export const LocationGetRoute = () => {
  const route = Router.useRoute(["SquareLocationGet"])
  const id = route?.params?.id ?? ""
  const { data, isPending } = useLocation(id)
  const location = data?.location

  if (isPending) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Location not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => Router.push("SquareLocations")}>
          Back to Locations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => Router.push("SquareLocations")}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{location.name}</h1>
          <p className="text-muted-foreground">Location details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Square ID" value={location.squareId} />
            <DetailItem
              label="Status"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    location.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {location.status}
                </span>
              }
            />
            <DetailItem
              label="Address"
              value={
                <span className="whitespace-pre-line">{formatFullAddress(location.address)}</span>
              }
            />
            <DetailItem label="Timezone" value={location.timezone ?? "—"} />
            <DetailItem
              label="Last Synced"
              value={location.syncedAt ? new Date(location.syncedAt).toLocaleString() : "—"}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm">{value}</dd>
  </div>
)
