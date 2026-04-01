import type { RefundDto } from "./schema"

export type ListRefundsOptions = {
  page: number
  limit: number
  locationId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  paymentId?: string
}

export type ListRefundsResult = {
  items: RefundDto[]
  totalCount: number
}
