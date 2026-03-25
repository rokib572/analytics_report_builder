import { and, eq, desc, count, gte, ilike, lte, or, type SQL } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type SquareCustomerListDto, squareCustomers } from "../schema"

type ListSquareCustomersOptions = {
  page: number
  limit: number
  name?: string
  phoneNumber?: string
  emailAddress?: string
  creationTimeFrom?: Date
  creationTimeTo?: Date
}

export const listSquareCustomers = async (
  db: DbClient,
  customerId: string,
  options: ListSquareCustomersOptions,
): Promise<{ customers: SquareCustomerListDto[]; totalCount: number }> => {
  const offset = (options.page - 1) * options.limit
  const whereConditions = [eq(squareCustomers.customerId, customerId)]

  if (options.name) {
    const nameConditions: SQL[] = [
      ilike(squareCustomers.givenName, `%${options.name}%`),
      ilike(squareCustomers.familyName, `%${options.name}%`),
    ].filter((condition): condition is SQL => condition !== undefined)

    const nameWhereClause = or(...nameConditions)

    if (nameWhereClause) {
      whereConditions.push(nameWhereClause)
    }
  }

  if (options.phoneNumber) {
    whereConditions.push(ilike(squareCustomers.phoneNumber, `%${options.phoneNumber}%`))
  }

  if (options.emailAddress) {
    whereConditions.push(ilike(squareCustomers.emailAddress, `%${options.emailAddress}%`))
  }

  if (options.creationTimeFrom) {
    whereConditions.push(gte(squareCustomers.creationTime, options.creationTimeFrom))
  }

  if (options.creationTimeTo) {
    whereConditions.push(lte(squareCustomers.creationTime, options.creationTimeTo))
  }

  const whereClause = and(...whereConditions)

  const [customers, countResult] = await Promise.all([
    db
      .select({
        id: squareCustomers.id,
        customerId: squareCustomers.customerId,
        givenName: squareCustomers.givenName,
        familyName: squareCustomers.familyName,
        emailAddress: squareCustomers.emailAddress,
        phoneNumber: squareCustomers.phoneNumber,
        referenceId: squareCustomers.referenceId,
        creationSource: squareCustomers.creationSource,
        creationTime: squareCustomers.creationTime,
        syncedAt: squareCustomers.syncedAt,
      })
      .from(squareCustomers)
      .where(whereClause)
      .orderBy(desc(squareCustomers.creationTime))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(squareCustomers).where(whereClause),
  ])

  return {
    customers,
    totalCount: Number(countResult[0]?.totalCount ?? 0),
  }
}
