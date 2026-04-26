# Dashboard

The Dashboard is the first page everyone lands on after sign-in. It summarises the most recent month's activity in four KPI cards and a monthly sales chart.

![Dashboard](/images/help/dashboard/kpi-cards.png)

## KPI cards

Each card shows a value for the **current month** and the percent change versus the **previous month**.

- **Total Revenue** — Net Sales for the current month.
- **Orders** — count of completed orders for the current month.
- **Gross Sales** — item total before discounts and returns for the current month.
- **Active Locations** — number of locations across all integrations currently marked active.

Percent-change values are colourless when there's no prior data (`+100%` from a zero baseline) and shown as `0%` when both periods are zero.

## Monthly Sales chart

The bar chart below the KPIs shows total **Net Sales by month** over a rolling window. Hover a bar to see the exact value; the X-axis labels use a short month + 2-digit year format (e.g. `Mar 26`).

![Monthly chart](/images/help/dashboard/monthly-chart.png)

## What feeds the dashboard

The Dashboard reads from **`daily_sales`**, the aggregate table that the sync pipeline maintains. New activity from webhooks and the nightly cron updates `daily_sales` automatically — there's nothing to refresh manually.

If a card shows `$0.00` or zero orders right after connecting Square, the backfill is still in progress. Give it time and revisit. New sales flow in via webhooks and the nightly re-sync without any manual action.

## What's not on the Dashboard

The Dashboard intentionally stays light. For deeper analysis use:

- **Report Builder** — full slicing, pivots, comparisons, and exports.
- **Square → Orders** — drill into individual orders, line items, tenders, and fulfillments.
- **Square → Inventory** — current stock joined to catalog metadata.

> Dashboard customisation (rearranging or adding cards) is intentionally not available yet — it's deferred until there are more data sources to surface.
