import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  type PaginationState,
} from "@analytics/ui-shared"
import { type OrderLineItem, useOrder } from "../../../data/square/orders/hooks"
import { Router } from "../../../router"

const formatCurrency = (cents: string | bigint | null): string =>
  cents !== null && cents !== undefined ? `$${(Number(cents) / 100).toFixed(2)}` : "—"

const lineItemColumns: ColumnDef<OrderLineItem, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "variationName",
    header: "Variation",
    cell: ({ row }) => row.getValue("variationName") ?? "—",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "channel",
    header: "Channel",
  },
  {
    accessorKey: "basePriceMoney",
    header: "Base Price",
    cell: ({ row }) => formatCurrency(row.getValue("basePriceMoney")),
  },
  {
    accessorKey: "grossSalesMoney",
    header: "Gross",
    cell: ({ row }) => formatCurrency(row.getValue("grossSalesMoney")),
  },
  {
    accessorKey: "totalDiscountMoney",
    header: "Discount",
    cell: ({ row }) => formatCurrency(row.getValue("totalDiscountMoney")),
  },
  {
    accessorKey: "totalTaxMoney",
    header: "Tax",
    cell: ({ row }) => formatCurrency(row.getValue("totalTaxMoney")),
  },
  {
    accessorKey: "totalMoney",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.getValue("totalMoney")),
  },
]

export const OrderGetRoute = () => {
  const route = Router.useRoute(["SquareOrderGet"])
  const id = route?.params?.id ?? ""
  const [lineItemsPagination, setLineItemsPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
  })
  const { data, isPending } = useOrder(id)
  const order = data?.order
  const lineItems = data?.lineItems ?? []
  const lineItemsOffset = (lineItemsPagination.page - 1) * lineItemsPagination.limit
  const paginatedLineItems = lineItems.slice(
    lineItemsOffset,
    lineItemsOffset + lineItemsPagination.limit,
  )

  if (isPending) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => Router.push("SquareOrders")}>
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => Router.push("SquareOrders")}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Detail</h1>
          <p className="text-muted-foreground">Square order and line item breakdown.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Order ID" value={order.id} />
              <DetailItem label="Square ID" value={order.squareId} />
              <DetailItem label="Sale Date" value={new Date(order.saleDate).toLocaleDateString()} />
              <DetailItem
                label="State"
                value={
                  <Badge variant={order.state === "COMPLETED" ? "default" : "secondary"}>
                    {order.state}
                  </Badge>
                }
              />
              <DetailItem label="Location" value={order.locationId} />
              <DetailItem label="Source" value={order.sourceName ?? "—"} />
              <DetailItem
                label="Last Synced"
                value={order.syncedAt ? new Date(order.syncedAt).toLocaleString() : "—"}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Money Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Total" value={formatCurrency(order.totalMoney)} />
              <DetailItem label="Tax" value={formatCurrency(order.totalTaxMoney)} />
              <DetailItem label="Discount" value={formatCurrency(order.totalDiscountMoney)} />
              <DetailItem label="Tip" value={formatCurrency(order.totalTipMoney)} />
              <DetailItem
                label="Service Charge"
                value={formatCurrency(order.totalServiceChargeMoney)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={lineItemColumns}
            data={paginatedLineItems}
            pagination={{
              page: lineItemsPagination.page,
              limit: lineItemsPagination.limit,
              totalCount: lineItems.length,
            }}
            onPaginationChange={setLineItemsPagination}
            emptyMessage="No line items found for this order."
          />
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
