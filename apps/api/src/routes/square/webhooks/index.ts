import { randomUUID } from "node:crypto"
import { Hono } from "hono"
import {
  createWebhookLog,
  findLocationBySquareId,
  findWebhookLogByEventId,
  getAppIntegrationByMerchantId,
  updateWebhookLogProcessed,
} from "@analytics/database"
import {
  processInventoryWebhookEvent,
  processPaymentWebhookEvent,
  processRefundWebhookEvent,
  processWebhookEvent,
} from "@analytics/data-sync"
import { verifySquareWebhook } from "@analytics/square"
import { db } from "../../../lib/db"
import { getSquareWebhookNotificationUrl } from "../../../lib/square-webhook-url"

type ParsedWebhookEvent = {
  eventId: string
  eventType: string
  merchantId: string | null
  orderId: string | null
  paymentId: string | null
  refundId: string | null
  inventoryCatalogObjectIds: string[]
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
  const refund = object?.refund as Record<string, unknown> | undefined
  const inventoryCountsRaw =
    (object?.inventory_counts as Record<string, unknown>[] | undefined) ??
    (object?.inventoryCounts as Record<string, unknown>[] | undefined) ??
    []
  const firstInventoryCount = inventoryCountsRaw[0]
  const locationId =
    (orderUpdated?.location_id as string | undefined) ??
    (order?.location_id as string | undefined) ??
    (payment?.location_id as string | undefined) ??
    (refund?.location_id as string | undefined) ??
    (firstInventoryCount?.location_id as string | undefined) ??
    (order?.locationId as string | undefined) ??
    (payment?.locationId as string | undefined) ??
    (refund?.locationId as string | undefined) ??
    (firstInventoryCount?.locationId as string | undefined) ??
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
    refundId: (refund?.id as string | undefined) ?? null,
    inventoryCatalogObjectIds: inventoryCountsRaw
      .map(
        (count) =>
          (count.catalog_object_id as string | undefined) ??
          (count.catalogObjectId as string | undefined) ??
          null,
      )
      .filter((value): value is string => Boolean(value)),
    locationId,
    payload: parsed,
  }
}

const getWebhookProcessingUpdate = (result: {
  processed: boolean
  reason?: string
}): {
  processed: boolean
  processingResult: string
  processingError: string | null
  processedAt: Date
} => {
  if (result.processed) {
    return {
      processed: true,
      processingResult: "synced",
      processingError: null,
      processedAt: new Date(),
    }
  }

  if (result.reason === "duplicate") {
    return {
      processed: true,
      processingResult: "duplicate",
      processingError: null,
      processedAt: new Date(),
    }
  }

  return {
    processed: true,
    processingResult: "skipped",
    processingError: result.reason ?? null,
    processedAt: new Date(),
  }
}

const router = new Hono().post("/", async (c) => {
  const requestBody = await c.req.text()
  const signatureHeader = c.req.header("x-square-hmacsha256-signature") ?? ""
  const notificationUrl = (() => {
    try {
      return getSquareWebhookNotificationUrl()
    } catch {
      return c.req.url
    }
  })()

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
      refundId: null,
      inventoryCatalogObjectIds: [],
      locationId: null,
      payload: { rawBody: requestBody },
    }
  }

  // Try per-customer signature key first, fall back to global key
  let perCustomerKey: string | undefined
  let integrationCustomerId: string | null = null
  if (parsedEvent.merchantId) {
    const merchantIntegration = await getAppIntegrationByMerchantId(db, parsedEvent.merchantId)
    if (merchantIntegration?.webhookSignatureKey) {
      perCustomerKey = merchantIntegration.webhookSignatureKey
    }
    integrationCustomerId = merchantIntegration?.customerId ?? null
  }

  const isValidSignature =
    signatureHeader.length > 0 &&
    (await verifySquareWebhook({
      requestBody,
      signatureHeader,
      notificationUrl,
      signatureKey: perCustomerKey,
    }))

  if (!isValidSignature) {
    const existing = await findWebhookLogByEventId(db, parsedEvent.eventId)
    if (!existing) {
      await createWebhookLog(db, {
        customerId: integrationCustomerId,
        eventId: parsedEvent.eventId,
        eventType: parsedEvent.eventType,
        merchantId: parsedEvent.merchantId,
        locationId: parsedEvent.locationId,
        orderId: parsedEvent.orderId,
        paymentId: parsedEvent.paymentId,
        refundId: parsedEvent.refundId,
        signatureValid: false,
        processed: false,
        processingResult: null,
        processingError: null,
        processedAt: null,
        payload: parsedEvent.payload,
      })
    }

    return c.json({ ok: true })
  }

  if (
    !parsedEvent.locationId ||
    (!parsedEvent.orderId &&
      !parsedEvent.paymentId &&
      !parsedEvent.refundId &&
      parsedEvent.inventoryCatalogObjectIds.length === 0)
  ) {
    const existing = await findWebhookLogByEventId(db, parsedEvent.eventId)
    if (!existing) {
      await createWebhookLog(db, {
        customerId: integrationCustomerId,
        eventId: parsedEvent.eventId,
        eventType: parsedEvent.eventType,
        merchantId: parsedEvent.merchantId,
        locationId: parsedEvent.locationId,
        orderId: parsedEvent.orderId,
        paymentId: parsedEvent.paymentId,
        refundId: parsedEvent.refundId,
        signatureValid: true,
        processed: true,
        processingResult: "skipped",
        processingError: "missing_required_reference",
        processedAt: new Date(),
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
        customerId: integrationCustomerId,
        eventId: parsedEvent.eventId,
        eventType: parsedEvent.eventType,
        merchantId: parsedEvent.merchantId,
        locationId: parsedEvent.locationId,
        orderId: parsedEvent.orderId,
        paymentId: parsedEvent.paymentId,
        refundId: parsedEvent.refundId,
        signatureValid: true,
        processed: true,
        processingResult: "skipped",
        processingError: "location_not_mapped",
        processedAt: new Date(),
        payload: parsedEvent.payload,
      })
    }

    return c.json({ ok: true })
  }

  const existing = await findWebhookLogByEventId(db, parsedEvent.eventId)
  const webhookLog =
    existing ??
    (await createWebhookLog(db, {
      customerId: location.customerId,
      eventId: parsedEvent.eventId,
      eventType: parsedEvent.eventType,
      merchantId: parsedEvent.merchantId,
      locationId: parsedEvent.locationId,
      orderId: parsedEvent.orderId,
      paymentId: parsedEvent.paymentId,
      refundId: parsedEvent.refundId,
      signatureValid: true,
      processed: false,
      processingResult: null,
      processingError: null,
      processedAt: null,
      payload: parsedEvent.payload,
    }))

  if (parsedEvent.eventType.startsWith("order.") && parsedEvent.orderId) {
    void processWebhookEvent(db, location.customerId, {
      eventId: parsedEvent.eventId,
      orderId: parsedEvent.orderId,
      locationId: parsedEvent.locationId,
    })
      .then(async (result) => {
        await updateWebhookLogProcessed(db, webhookLog.id, getWebhookProcessingUpdate(result))
      })
      .catch((error) => {
        void updateWebhookLogProcessed(db, webhookLog.id, {
          processed: true,
          processingResult: "failed",
          processingError: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          processedAt: new Date(),
        })
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
        await updateWebhookLogProcessed(db, webhookLog.id, getWebhookProcessingUpdate(result))
      })
      .catch((error) => {
        void updateWebhookLogProcessed(db, webhookLog.id, {
          processed: true,
          processingResult: "failed",
          processingError: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          processedAt: new Date(),
        })
        console.error("[SquarePaymentWebhookProcessingError]", {
          eventId: parsedEvent.eventId,
          message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          stack: error instanceof Error ? error.stack : undefined,
        })
      })
  }

  if (parsedEvent.eventType.startsWith("refund.") && parsedEvent.refundId) {
    void processRefundWebhookEvent(db, location.customerId, {
      eventId: parsedEvent.eventId,
      refundId: parsedEvent.refundId,
      locationId: parsedEvent.locationId,
    })
      .then(async (result) => {
        await updateWebhookLogProcessed(db, webhookLog.id, getWebhookProcessingUpdate(result))
      })
      .catch((error) => {
        void updateWebhookLogProcessed(db, webhookLog.id, {
          processed: true,
          processingResult: "failed",
          processingError: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          processedAt: new Date(),
        })
        console.error("[SquareRefundWebhookProcessingError]", {
          eventId: parsedEvent.eventId,
          message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          stack: error instanceof Error ? error.stack : undefined,
        })
      })
  }

  if (parsedEvent.eventType === "inventory.count.updated") {
    void processInventoryWebhookEvent(db, location.customerId, {
      eventId: parsedEvent.eventId,
      locationId: parsedEvent.locationId,
      catalogObjectIds: parsedEvent.inventoryCatalogObjectIds,
    })
      .then(async (result) => {
        await updateWebhookLogProcessed(db, webhookLog.id, getWebhookProcessingUpdate(result))
      })
      .catch((error) => {
        void updateWebhookLogProcessed(db, webhookLog.id, {
          processed: true,
          processingResult: "failed",
          processingError: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
          processedAt: new Date(),
        })
        console.error("[SquareInventoryWebhookProcessingError]", {
          eventId: parsedEvent.eventId,
          message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          stack: error instanceof Error ? error.stack : undefined,
        })
      })
  }

  return c.json({ ok: true })
})

export default router
