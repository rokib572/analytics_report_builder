import { type DbClient, findWebhookLogByEventId, upsertPayment } from "@analytics/database"
import { getPayment } from "@analytics/square"
import { computePaymentContentHash, mapPaymentPayload } from "../square/payments/shared"
import { validateWebhookLocation } from "./process.validate-location"
import type { ProcessPaymentWebhookEvent, ProcessWebhookEventResult } from "./types"

export const processPaymentWebhookEvent = async (
  db: DbClient,
  customerId: string,
  event: ProcessPaymentWebhookEvent,
): Promise<ProcessWebhookEventResult> => {
  const webhookLog = await findWebhookLogByEventId(db, event.eventId)
  if (webhookLog?.processed) {
    return { processed: false, reason: "duplicate" }
  }

  const payment = await getPayment(customerId, event.paymentId)
  if (!payment?.id || !payment.locationId || !payment.createdAt) {
    return { processed: false, reason: "payment_not_found" }
  }

  const locationResult = await validateWebhookLocation(db, customerId, payment.locationId)
  if (!locationResult.valid) {
    return { processed: false, reason: locationResult.reason }
  }

  const contentHash = computePaymentContentHash(payment)
  await upsertPayment(
    db,
    customerId,
    mapPaymentPayload(payment, locationResult.locationId, contentHash),
  )

  return { processed: true }
}
