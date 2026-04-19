export type CustomerRow = {
  id: string
  name: string
  slug: string
  companyName: string | null
  businessType: string | null
  createdAt: string
  ownerCount: number
}

export type CustomersTableProps = {
  customers: CustomerRow[]
  currentAssumedCustomerId: string | null
  isLoading: boolean
  error: string | null
  page: number
  limit: number
  totalCount: number
  onAssume: (customerId: string) => void
  onSwitchBack: () => void
  onPreviousPage: () => void
  onNextPage: () => void
}
