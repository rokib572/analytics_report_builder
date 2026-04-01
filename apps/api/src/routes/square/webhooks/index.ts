import { randomUUID } from "node:crypto"
import { Hono } from "hono"
import {
  createWebhookLog,
  findLocationBySquareId,
  findWebhookLogByEventId,
  updateWebhookLogProcessed,
} from "@analytics/database"
import { processPaymentWebhookEvent, processWebhookEvent } from "@analytics/data-sync"
import { verifySquareWebhook } from "@analytics/square"
import { db } from "../../../lib/db"

type ParsedWebhookEvent = {
  eventId: string
  eventType: string
  merchantId: string | null
  orderId: string | null
  paymentId: string | null
  locationId: string | null
  payload: Record<string, unknown>
}

const parseWebhookPayload = (body: string): ParsedWebhookEvent => {
  const parsed = JSON.parse(body) as Record<string, unknown>
  const data = parsed.data as Record<string, unknown> | undefined
  const object = data?.object as Record<string, unknown> | undefined
  const orderUpdated = object?.order_updated as Record<string, unknown> | undefined
  const order = object?.order as Record<string, unknown> | undefined
  const payment = object?.payment as Record<string, unknown> | undefined
  const locationId =
    (orderUpdated?.location_id as string | undefined) ??
    (order?.location_id as string | undefined) ??
    (payment?.location_id as string | undefined) ??
    (order?.locationId as string | undefined) ??
    (payment?.locationId as string | undefined) ??
    null

  const orderId =
    (orderUpdated?.order_id as string | undefined) ??
    (order?.id as string | undefined) ??
    (order || orderUpdated ? (data?.id as string | undefined) : undefined) ??
    null

  return {
    eventId: (parsed.event_id as string | undefined) ?? randomUUID(),
    eventType: (parsed.type as string | undefined) ?? "unknown",
    merchantId: (parsed.merchant_id as string | undefined) ?? null,
    orderId,
    paymentId: (payment?.id as string | undefined) ?? null,
    locationId,
    payload: parsed,
  }
}

const router = new Hono().post("/", async (c) => {
  const requestBody = await c.req.text()
  const signatureHeader = c.req.header("x-square-hmacsha256-signature") ?? ""
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ?? c.req.url

  let parsedEvent: ParsedWebhookEvent
  try {
    parsedEvent = parseWebhookPayload(requestBody)
  } catch {
    parsedEvent = {
      eventId: randomUUID(),
      eventType: "unknown",
      merchantId: null,
      orderId: null,
      paymentId: null,
      locationId: null,
      payload: { rawBody: requestBody },
    }
  }

  const isValidSignature =
    signatureHeader.length > 0 &&
    (await verifySquareWebhook({ requestBody, signatureHeader, notificationUrl }))

  if (!isValidSignature) {
    const existing = await findWebhookLogByEventId(db, parsedEvent.eventId)
    if (!existing) {
      await createWebhookLog(db, {
        eventId: parsedEvent.eventId,
        eventType: parsedEvent.eventType,
        merchantId: parsedEvent.merchantId,
        locationId: parsedEvent.locationId,
        orderId: parsedEvent.orderId,
        signatureValid: false,
        processed: false,
        payload: parsedEvent.payload,
      })
    }

    return c.json({ ok: true })
  }

  if (!parsedEvent.locationId || (!parsedEvent.orderId && !parsedEvent.paymentId)) {
    const existing = await findWebhookLogByEventId(db, parsedEvent.eventId)
    if (!existing) {
      await createWebhookLog(db, {
        eventId: parsedEvent.eventId,
        eventType: parsedEvent.eventType,
        merchantId: parsedEvent.merchantId,
        locationId: parsedEvent.locationId,
        orderId: parsedEvent.orderId,
        signatureValid: true,
        processed: false,
        payload: parsedEvent.payload,
      })
    }

    return c.json({ ok: true })
  }

  const location = await findLocationBySquareId(db, parsedEvent.locationId)
  if (!location) {
    const existing = await findWebhookLogByEventId(db, parsedEvent.eventId)
    if (!existing) {
      await createWebhookLog(db, {
        eventId: parsedEvent.eventId,
        eventType: parsedEvent.eventType,
        merchantId: parsedEvent.merchantId,
        locationId: parsedEvent.locationId,
        orderId: parsedEvent.orderId,
        signatureValid: true,
        processed: false,
        payload: parsedEvent.payload,
      })
    }

    return c.json({ ok: true })
  }

  const existing = await findWebhookLogByEventId(db, parsedEvent.eventId)
  const webhookLog =
    existing ??
    (await createWebhookLog(db, {
      eventId: parsedEvent.eventId,
      eventType: parsedEvent.eventType,
      merchantId: parsedEvent.merchantId,
      locationId: parsedEvent.locationId,
      orderId: parsedEvent.orderId,
      signatureValid: true,
      processed: false,
      payload: parsedEvent.payload,
    }))

  if (parsedEvent.eventType.startsWith("order.") && parsedEvent.orderId) {
    void processWebhookEvent(db, location.customerId, {
      eventId: parsedEvent.eventId,
      orderId: parsedEvent.orderId,
      locationId: parsedEvent.locationId,
    })
      .then(async (result) => {
        if (result.processed) {
          await updateWebhookLogProcessed(db, webhookLog.id)
        }
      })
      .catch((error) => {
        console.error("[SquareWebhookProcessingError]", {
          eventId: parsedEvent.eventId,
          message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          stack: error instanceof Error ? error.stack : undefined,
        })
      })
  }

  if (parsedEvent.eventType.startsWith("payment.") && parsedEvent.paymentId) {
    void processPaymentWebhookEvent(db, location.customerId, {
      eventId: parsedEvent.eventId,
      paymentId: parsedEvent.paymentId,
      locationId: parsedEvent.locationId,
    })
      .then(async (result) => {
        if (result.processed) {
          await updateWebhookLogProcessed(db, webhookLog.id)
        }
      })
      .catch((error) => {
        console.error("[SquarePaymentWebhookProcessingError]", {
          eventId: parsedEvent.eventId,
          message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          stack: error instanceof Error ? error.stack : undefined,
        })
      })
  }

  return c.json({ ok: true })
})

export default router
