import type { SquareCustomerListDto } from "./schema"

export type ListSquareCustomersOptions = {
  page: number
  limit: number
  name?: string
  phoneNumber?: string
  emailAddress?: string
  creationTimeFrom?: Date
  creationTimeTo?: Date
}

export type ListSquareCustomersResult = {
  customers: SquareCustomerListDto[]
  totalCount: number
}
