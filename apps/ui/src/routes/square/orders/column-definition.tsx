import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@analytics/ui-shared"
import type { Order } from "../../../data/square/orders/hooks"

const formatCurrency = (cents: string | bigint | null): string =>
  cents !== null && cents !== undefined ? `$${(Number(cents) / 100).toFixed(2)}` : "—"

export const columns: ColumnDef<Order, unknown>[] = [
  {
    accessorKey: "saleDate",
    header: "Date",
    cell: ({ row }) => new Date(row.getValue<string>("saleDate")).toLocaleDateString(),
  },
  {
    accessorKey: "locationId",
    header: "Location",
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("locationId")}</span>,
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => {
      const state = row.getValue<string>("state")
      return <Badge variant={state === "COMPLETED" ? "default" : "secondary"}>{state}</Badge>
    },
  },
  {
    accessorKey: "totalMoney",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.getValue("totalMoney")),
  },
  {
    accessorKey: "totalTaxMoney",
    header: "Tax",
    cell: ({ row }) => formatCurrency(row.getValue("totalTaxMoney")),
  },
  {
    accessorKey: "totalDiscountMoney",
    header: "Discount",
    cell: ({ row }) => formatCurrency(row.getValue("totalDiscountMoney")),
  },
  {
    accessorKey: "sourceName",
    header: "Source",
    cell: ({ row }) => row.getValue("sourceName") ?? "—",
  },
]
