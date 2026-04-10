import type { ColumnDef } from "@tanstack/react-table"
import type { InventoryCount } from "../../../data/square/inventory/hooks"

export const columns: ColumnDef<InventoryCount, unknown>[] = [
  {
    accessorKey: "itemName",
    header: "Item",
    cell: ({ row }) => row.getValue<string | null>("itemName") ?? "—",
  },
  {
    accessorKey: "variationName",
    header: "Variation",
    cell: ({ row }) => row.getValue<string | null>("variationName") ?? "—",
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => {
      const sku = row.getValue<string | null>("sku")
      return sku ? <span className="font-mono text-xs">{sku}</span> : "—"
    },
  },
  {
    accessorKey: "locationName",
    header: "Location",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => <span className="font-medium">{row.getValue("quantity")}</span>,
  },
  {
    accessorKey: "calculatedAt",
    header: "Last Updated",
    cell: ({ row }) => new Date(row.getValue<string>("calculatedAt")).toLocaleString(),
  },
]
