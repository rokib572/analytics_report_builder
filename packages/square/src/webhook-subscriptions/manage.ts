import { SquareClient, SquareEnvironment } from "square"

const WEBHOOK_EVENT_TYPES = [
  "order.created",
  "order.updated",
  "order.fulfillment.updated",
  "payment.created",
  "payment.updated",
  "refund.created",
  "refund.updated",
  "inventory.count.updated",
  "catalog.version.updated",
  "customer.created",
  "customer.updated",
]

const getSquareAppAccessToken = () => {
  const accessToken = process.env.SQUARE_APP_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error("SQUARE_APP_ACCESS_TOKEN environment variable is required")
  }

  return accessToken
}

const createClient = (environment: string) =>
  new SquareClient({
    token: getSquareAppAccessToken(),
    environment:
      environment === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  })

export const createWebhookSubscription = async (environment: string, notificationUrl: string) => {
  const client = createClient(environment)

  const response = await client.webhooks.subscriptions.create({
    idempotencyKey: crypto.randomUUID(),
    subscription: {
      name: "Analytics Report Builder",
      notificationUrl,
      eventTypes: WEBHOOK_EVENT_TYPES,
      apiVersion: "2025-01-23",
    },
  })

  const subscription = response.subscription!
  return {
    subscriptionId: subscription.id!,
    signatureKey: subscription.signatureKey!,
  }
}

export const deleteWebhookSubscription = async (environment: string, subscriptionId: string) => {
  const client = createClient(environment)
  await client.webhooks.subscriptions.delete({ subscriptionId })
}
