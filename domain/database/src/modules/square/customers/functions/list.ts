import { eq, desc } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type SquareCustomerListDto, squareCustomers } from "../schema"

type ListSquareCustomersOptions = {
  page: number
  limit: number
}

export const listSquareCustomers = async (
  db: DbClient,
  customerId: string,
  options: ListSquareCustomersOptions,
): Promise<SquareCustomerListDto[]> => {
  const offset = (options.page - 1) * options.limit

  return db
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
    .where(eq(squareCustomers.customerId, customerId))
    .orderBy(desc(squareCustomers.creationTime))
    .limit(options.limit)
    .offset(offset)
}
