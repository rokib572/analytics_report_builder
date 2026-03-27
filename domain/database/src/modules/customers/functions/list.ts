import { count } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type CustomerDto, customers } from "../schema"

type ListCustomersOptions = {
  page: number
  limit: number
}

export const listCustomers = async (
  db: DbClient,
  options: ListCustomersOptions,
): Promise<{ customers: CustomerDto[]; totalCount: number }> => {
  const offset = (options.page - 1) * options.limit

  const [customerRows, countResult] = await Promise.all([
    db.select().from(customers).limit(options.limit).offset(offset),
    db.select({ totalCount: count() }).from(customers),
  ])

  return {
    customers: customerRows,
    totalCount: Number(countResult[0]?.totalCount ?? 0),
  }
}
