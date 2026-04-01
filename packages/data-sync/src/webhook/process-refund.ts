import {
  type DbClient,
  findPaymentSquareCustomerIdBySquareId,
  findWebhookLogByEventId,
  upsertRefund,
} from "@analytics/database"
import { getRefund } from "@analytics/square"
import { computeRefundContentHash, mapRefundPayload } from "../square/refunds/shared"
import { validateWebhookLocation } from "./process.validate-location"
import type { ProcessRefundWebhookEvent, ProcessWebhookEventResult } from "./types"

export const processRefundWebhookEvent = async (
  db: DbClient,
  customerId: string,
  event: ProcessRefundWebhookEvent,
): Promise<ProcessWebhookEventResult> => {
  const webhookLog = await findWebhookLogByEventId(db, event.eventId)
  if (webhookLog?.processed) {
    return { processed: false, reason: "duplicate" }
  }

  const refund = await getRefund(customerId, event.refundId)
  if (!refund?.id || !refund.locationId || !refund.createdAt) {
    return { processed: false, reason: "refund_not_found" }
  }

  const locationResult = await validateWebhookLocation(db, customerId, refund.locationId)
  if (!locationResult.valid) {
    return { processed: false, reason: locationResult.reason }
  }

  const contentHash = computeRefundContentHash(refund)
  const squareCustomerId = refund.paymentId
    ? await findPaymentSquareCustomerIdBySquareId(db, customerId, refund.paymentId)
    : null
  await upsertRefund(
    db,
    customerId,
    mapRefundPayload(refund, locationResult.locationId, contentHash, squareCustomerId),
  )

  return { processed: true }
}
