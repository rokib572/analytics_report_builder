import {
  type DbClient,
  findPaymentSquareCustomerIdBySquareId,
  getLocationSquareIdMap,
  upsertRefund,
} from "@analytics/database"
import { listRefunds } from "@analytics/square"
import { computeRefundContentHash, mapRefundPayload } from "./shared"

export const syncRefunds = async (
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
    const squareRefunds = await listRefunds(customerId, squareLocationId, startAt, endAt)

    for (const refund of squareRefunds) {
      if (!refund.id || !refund.locationId || !refund.createdAt) {
        skipped++
        continue
      }

      const internalLocationId = locationMap.get(refund.locationId)
      if (!internalLocationId) {
        skipped++
        continue
      }

      const contentHash = computeRefundContentHash(refund)
      const squareCustomerId = refund.paymentId
        ? await findPaymentSquareCustomerIdBySquareId(db, customerId, refund.paymentId)
        : null
      const result = await upsertRefund(
        db,
        customerId,
        mapRefundPayload(refund, internalLocationId, contentHash, squareCustomerId),
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
