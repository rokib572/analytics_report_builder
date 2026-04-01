import type { PaymentDto } from "./schema"

export type ListPaymentsOptions = {
  page: number
  limit: number
  locationId?: string
  dateFrom?: string
  dateTo?: string
  sourceType?: string
  status?: string
}

export type ListPaymentsResult = {
  items: PaymentDto[]
  totalCount: number
}
