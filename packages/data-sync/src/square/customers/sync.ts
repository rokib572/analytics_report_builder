import { type DbClient, upsertCustomers } from "@analytics/database"
import { fetchAllSquareCustomers } from "@analytics/square"
import { computeContentHash } from "../../utils/content-hash"

export const syncCustomers = async (
  db: DbClient,
  customerId: string,
): Promise<{ synced: number; unchanged: number }> => {
  const allCustomers = await fetchAllSquareCustomers(customerId)

  let synced = 0
  let unchanged = 0

  for (const customer of allCustomers) {
    const hashInput = {
      id: customer.id,
      givenName: customer.givenName,
      familyName: customer.familyName,
      email: customer.emailAddress,
      phone: customer.phoneNumber,
      createdAt: customer.createdAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertCustomers(db, customerId, {
      squareId: customer.id!,
      givenName: customer.givenName ?? "",
      familyName: customer.familyName ?? "",
      emailAddress: customer.emailAddress ?? null,
      phoneNumber: customer.phoneNumber ?? null,
      referenceId: customer.referenceId ?? null,
      creationSource: customer.creationSource ?? null,
      creationTime: new Date(customer.createdAt!),
      contentHash,
    })

    if (result) {
      synced++
    } else {
      unchanged++
    }
  }

  return { synced, unchanged }
}
