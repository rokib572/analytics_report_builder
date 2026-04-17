import { and, count, desc, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { webhookLog } from "../schema"
import type { ListWebhookLogsOptions, ListWebhookLogsResult } from "../types"

export const listWebhookLogs = async (
  db: DbClient,
  customerId: string,
  options: ListWebhookLogsOptions,
): Promise<ListWebhookLogsResult> => {
  const customerClause = eq(webhookLog.customerId, customerId)
  const conditions = [
    options.eventType ? eq(webhookLog.eventType, options.eventType) : undefined,
    typeof options.processed === "boolean"
      ? eq(webhookLog.processed, options.processed)
      : undefined,
  ].filter(Boolean)
  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(webhookLog)
      .where(whereClause)
      .orderBy(desc(webhookLog.receivedAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(webhookLog).where(whereClause),
  ])

  return {
    webhookLogs: rows,
    totalCount: countRows[0]?.totalCount ?? 0,
  }
}
