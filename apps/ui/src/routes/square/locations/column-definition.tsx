import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@analytics/ui-shared"

type Location = {
  id: string
  name: string
  status: string
  address: unknown
  timezone: string | null
  syncedAt: string | null
}

const formatAddress = (address: unknown): string => {
  if (!address || typeof address !== "object") return "—"
  const addr = address as Record<string, string>
  const parts = [addr.addressLine1, addr.locality, addr.administrativeDistrictLevel1].filter(
    Boolean,
  )
  return parts.length > 0 ? parts.join(", ") : "—"
}

export const columns: ColumnDef<Location, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status")
      return <Badge variant={status === "ACTIVE" ? "default" : "destructive"}>{status}</Badge>
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => formatAddress(row.getValue("address")),
  },
  {
    accessorKey: "timezone",
    header: "Timezone",
    cell: ({ row }) => row.getValue("timezone") ?? "—",
  },
  {
    accessorKey: "syncedAt",
    header: "Last Synced",
    cell: ({ row }) => {
      const syncedAt = row.getValue<string | null>("syncedAt")
      return syncedAt ? new Date(syncedAt).toLocaleString() : "—"
    },
  },
]
