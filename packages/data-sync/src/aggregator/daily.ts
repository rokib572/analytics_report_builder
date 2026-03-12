import type { Square } from "square"

export function aggregateOrdersToDaily(_orders: Square.Order[]) {
  // TODO: implement
  // - filter state === "COMPLETED"
  // - aggregate monetary fields from order.netAmounts
  // - split by channel (STORE vs UBER) using detectChannel on each line item name
  // - calculate uberBogoRecoverable using calculateBogoRecovery
  // - return shape matching daily_sales row (excluding id, syncedAt, syncSource)
}
