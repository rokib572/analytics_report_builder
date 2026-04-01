import { type DbClient, getLocationSquareIdMap, upsertPayment } from "@analytics/database"
import { listPayments } from "@analytics/square"
import { computePaymentContentHash, mapPaymentPayload } from "./shared"

export const syncPayments = async (
  db: DbClient,
  customerId: string,
  startAt: string,
  endAt: string,
): Promise<{ synced: number; unchanged: number; skipped: number }> => {
  const locationMap = await getLocationSquareIdMap(db, customerId)
  const squareLocationIds = [...locationMap.keys()]

  if (squareLocationIds.length === 0) {
    return { synced: 0, unchanged: 0, skipped: 0 }
  }

  let synced = 0
  let unchanged = 0
  let skipped = 0

  for (const squareLocationId of squareLocationIds) {
    const squarePayments = await listPayments(customerId, squareLocationId, startAt, endAt)

    for (const payment of squarePayments) {
      if (!payment.id || !payment.locationId || !payment.createdAt) {
        skipped++
        continue
      }

      const internalLocationId = locationMap.get(payment.locationId)
      if (!internalLocationId) {
        skipped++
        continue
      }

      const contentHash = computePaymentContentHash(payment)
      const result = await upsertPayment(
        db,
        customerId,
        mapPaymentPayload(payment, internalLocationId, contentHash),
      )

      if (result) {
        synced++
      } else {
        unchanged++
      }
    }
  }

  return { synced, unchanged, skipped }
}
