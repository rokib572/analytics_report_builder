import { and, count, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type CustomerDto, customers } from "../schema"
import { users } from "../../users/schema"

type ListCustomersOptions = {
  page: number
  limit: number
}

export type CustomerListItem = CustomerDto & {
  ownerCount: number
}

export const listCustomers = async (
  db: DbClient,
  options: ListCustomersOptions,
): Promise<{ customers: CustomerListItem[]; totalCount: number }> => {
  const offset = (options.page - 1) * options.limit
  const ownerJoinClause = and(
    eq(users.customerId, customers.id),
    eq(users.role, "owner"),
    eq(users.isActive, true),
  )

  const [customerRows, countResult] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        slug: customers.slug,
        companyName: customers.companyName,
        businessType: customers.businessType,
        businessSize: customers.businessSize,
        phone: customers.phone,
        address: customers.address,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        ownerCount: count(users.id),
      })
      .from(customers)
      .leftJoin(users, ownerJoinClause)
      .groupBy(
        customers.id,
        customers.name,
        customers.slug,
        customers.companyName,
        customers.businessType,
        customers.businessSize,
        customers.phone,
        customers.address,
        customers.createdAt,
        customers.updatedAt,
      )
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(customers),
  ])

  return {
    customers: customerRows.map((customer) => ({
      ...customer,
      ownerCount: Number(customer.ownerCount),
    })),
    totalCount: Number(countResult[0]?.totalCount ?? 0),
  }
}
