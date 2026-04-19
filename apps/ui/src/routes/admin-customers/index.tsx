import { useMemo, useState } from "react"
import { Building2 } from "lucide-react"
import { useCustomersList } from "../../data/customers/hooks"
import { setAssumedCustomerId, getAssumedCustomerId } from "../../lib/api-client"
import { CustomersTableContent } from "./contents-customers-table"
import type { CustomerRow } from "./types"

const PAGE_SIZE = 20

export const AdminCustomersRoute = () => {
  const [page, setPage] = useState(1)
  const currentAssumedCustomerId = getAssumedCustomerId()
  const { data, isLoading, error } = useCustomersList({ page, limit: PAGE_SIZE })

  const customers = useMemo<CustomerRow[]>(
    () =>
      (data?.data ?? []).map((customer) => ({
        id: customer.id,
        name: customer.name,
        slug: customer.slug,
        companyName: customer.companyName,
        businessType: customer.businessType,
        createdAt: customer.createdAt,
        ownerCount: customer.ownerCount,
      })),
    [data],
  )

  const handleAssume = (customerId: string) => {
    setAssumedCustomerId(customerId)
    window.location.reload()
  }

  const handleSwitchBack = () => {
    setAssumedCustomerId(null)
    window.location.reload()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Building2 className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Assume a customer to experience the app as their owner.
          </p>
        </div>
      </div>

      <CustomersTableContent
        customers={customers}
        currentAssumedCustomerId={currentAssumedCustomerId}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : null}
        page={data?.pagination.page ?? page}
        limit={data?.pagination.limit ?? PAGE_SIZE}
        totalCount={data?.pagination.totalCount ?? 0}
        onAssume={handleAssume}
        onSwitchBack={handleSwitchBack}
        onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setPage((current) => current + 1)}
      />
    </div>
  )
}
