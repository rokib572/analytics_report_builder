import { type DbClient, upsertCustomers } from "@analytics/database"
import { fetchAllSquareCustomers } from "@analytics/square"
import { computeContentHash } from "../../utils/content-hash"

export const syncCustomers = async (
  db: DbClient,
  customerId: string,
): Promise<{ synced: number; skipped: number }> => {
  const allCustomers = await fetchAllSquareCustomers(customerId)

  let synced = 0
  let skipped = 0

  for (const customer of allCustomers) {
    if (!customer.id || !customer.createdAt) {
      skipped++
      continue
    }

    const hashInput = {
      id: customer.id,
      givenName: customer.givenName,
      familyName: customer.familyName,
      email: customer.emailAddress,
      phone: customer.phoneNumber,
      createdAt: customer.createdAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    await upsertCustomers(db, customerId, {
      squareId: customer.id,
      givenName: customer.givenName ?? "",
      familyName: customer.familyName ?? "",
      emailAddress: customer.emailAddress ?? null,
      phoneNumber: customer.phoneNumber ?? null,
      referenceId: customer.referenceId ?? null,
      creationSource: customer.creationSource ?? null,
      creationTime: new Date(customer.createdAt),
      contentHash,
    })

    synced++
  }

  return { synced, skipped }
}
