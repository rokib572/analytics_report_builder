const SQUARE_WEBHOOK_PATH = "/api/square/webhooks"

const assertPublicHttpUrl = (value: string) => {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new Error(
      "SQUARE_WEBHOOK_NOTIFICATION_URL must be an absolute public URL, for example https://your-domain.com/api/square/webhooks",
    )
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(
      "SQUARE_WEBHOOK_NOTIFICATION_URL must use http or https and point to a public webhook endpoint",
    )
  }

  if (
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "0.0.0.0"
  ) {
    throw new Error(
      "SQUARE_WEBHOOK_NOTIFICATION_URL cannot use localhost. Use a public URL such as an ngrok tunnel or deployed API domain.",
    )
  }

  return parsed
}

export const getSquareWebhookNotificationUrl = () => {
  const configured = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL

  if (!configured) {
    throw new Error(
      "SQUARE_WEBHOOK_NOTIFICATION_URL is required and must point to /api/square/webhooks on a public host",
    )
  }

  const parsed = assertPublicHttpUrl(configured)

  if (parsed.pathname !== SQUARE_WEBHOOK_PATH) {
    parsed.pathname = SQUARE_WEBHOOK_PATH
    parsed.search = ""
    parsed.hash = ""
  }

  return parsed.toString()
}

export const getSquareWebhookPath = () => SQUARE_WEBHOOK_PATH
