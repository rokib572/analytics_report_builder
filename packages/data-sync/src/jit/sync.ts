export async function jitSync(_locationId: string, _date: string) {
  // TODO: implement
  // 1. Check daily_sales in DB for locationId + date
  // 2. If found and date is past → return from DB
  // 3. If found and date is today and syncedAt < 1hr ago → return from DB
  // 4. Otherwise: batchSearchOrders → aggregateOrdersToDaily → upsertDailySales → return
}
