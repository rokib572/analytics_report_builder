export async function processWebhookEvent(_event: unknown) {
  // TODO: implement
  // 1. Check webhook_log for eventId — if exists, skip (idempotency)
  // 2. Insert into webhook_log (processed: false)
  // 3. Parse orderId + locationId from event payload
  // 4. Fetch updated order from Square
  // 5. Upsert order + line items in DB
  // 6. Re-aggregate daily_sales for that location + date
  // 7. Update webhook_log processed: true
}
