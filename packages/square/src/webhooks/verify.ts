import { WebhooksHelper } from "square"

export const verifySquareWebhook = async (params: {
  requestBody: string
  signatureHeader: string
  notificationUrl: string
  signatureKey?: string
}): Promise<boolean> => {
  const key = params.signatureKey ?? process.env.SQUARE_WEBHOOK_SECRET!
  return WebhooksHelper.verifySignature({
    requestBody: params.requestBody,
    signatureHeader: params.signatureHeader,
    signatureKey: key,
    notificationUrl: params.notificationUrl,
  })
}
