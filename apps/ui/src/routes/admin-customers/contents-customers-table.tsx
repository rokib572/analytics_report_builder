import {
  Button,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@analytics/ui-shared"
import type { CustomersTableProps } from "./types"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))

export const CustomersTableContent = ({
  customers,
  currentAssumedCustomerId,
  isLoading,
  error,
  page,
  limit,
  totalCount,
  onAssume,
  onSwitchBack,
  onPreviousPage,
  onNextPage,
}: CustomersTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Customers</CardTitle>
      <CardDescription>Choose a customer to assume their owner context.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Business Type</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading customers...
              </TableCell>
            </TableRow>
          ) : customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => {
              const isAssumed = currentAssumedCustomerId === customer.id
              const canAssume = customer.ownerCount > 0
              const actionLabel = isAssumed ? "Stop Assuming" : "Assume"

              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium">{customer.companyName ?? customer.name}</div>
                    {customer.companyName ? (
                      <div className="text-xs text-muted-foreground">{customer.name}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{customer.slug}</TableCell>
                  <TableCell>{customer.businessType ?? "-"}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>
                    {!canAssume ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button type="button" variant="outline" size="sm" disabled>
                                Assume
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Customer has no active owner to assume.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button
                        type="button"
                        variant={isAssumed ? "outline" : "default"}
                        size="sm"
                        onClick={() => (isAssumed ? onSwitchBack() : onAssume(customer.id))}
                      >
                        {actionLabel}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {Math.max(1, Math.ceil(totalCount / limit))} · {totalCount} customer(s)
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={page * limit >= totalCount}
          >
            Next
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)
