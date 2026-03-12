import { WebhooksHelper } from "square"

export async function verifySquareWebhook(params: {
  requestBody: string
  signatureHeader: string
  notificationUrl: string
}): Promise<boolean> {
  return WebhooksHelper.verifySignature({
    requestBody: params.requestBody,
    signatureHeader: params.signatureHeader,
    signatureKey: process.env.SQUARE_WEBHOOK_SECRET!,
    notificationUrl: params.notificationUrl,
  })
}
