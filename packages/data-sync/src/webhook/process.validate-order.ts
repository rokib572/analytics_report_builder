import { getOrder } from "@analytics/square"
import type { ValidateWebhookOrderResult, ValidatedWebhookOrder } from "./types"

export const validateWebhookOrder = async (
  customerId: string,
  orderId: string,
): Promise<ValidateWebhookOrderResult> => {
  const order = await getOrder(customerId, orderId)

  if (!order) {
    return { valid: false, reason: "order_not_found" }
  }

  if (!order.id || !order.locationId || !order.createdAt) {
    return { valid: false, reason: "invalid_order" }
  }

  return {
    valid: true,
    order: order as ValidatedWebhookOrder,
  }
}
