import type { Square } from "square"

export type ProcessWebhookEvent = {
  eventId: string
  orderId: string
  locationId: string
}

export type ProcessWebhookEventResult = {
  processed: boolean
  reason?: string
}

export type ValidatedWebhookOrder = Square.Order & {
  id: string
  locationId: string
  createdAt: string
}

export type ValidateWebhookOrderResult =
  | { valid: true; order: ValidatedWebhookOrder }
  | { valid: false; reason: string }

export type ValidateWebhookLocationResult =
  | { valid: true; locationId: string; locationMap: Map<string, string> }
  | { valid: false; reason: string }
