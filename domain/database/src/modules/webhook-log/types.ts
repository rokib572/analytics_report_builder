import type { WebhookLogDto } from "./schema"

export type ListWebhookLogsOptions = {
  page: number
  limit: number
  eventType?: string
  processed?: boolean
}

export type ListWebhookLogsResult = {
  webhookLogs: WebhookLogDto[]
  totalCount: number
}

export type UpdateWebhookLogProcessedPayload = Partial<
  Pick<WebhookLogDto, "processed" | "processingResult" | "processingError" | "processedAt">
>
