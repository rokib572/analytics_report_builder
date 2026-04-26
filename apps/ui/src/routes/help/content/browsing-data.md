# Browsing your data

The **Square** group in the sidebar lists pages for browsing the underlying records the Report Builder is built on. Each page reads from synced data and refreshes as new webhook and nightly events come in.

These pages are visible to any user with the corresponding `view` permission. Owners and admins always see them; members need the resource permission granted.

## Locations

A list of every Square location that's been synced for your account. Each row shows name, status, address, timezone, and last-synced timestamp. Click a row to see full location detail.

Locations are synced first whenever you connect Square, so this page populates almost immediately after connect.

## Orders

A paginated browse view of synced Square orders. Filters and search let you narrow by location, date, state, and more. Click an order to open the detail page, which shows:

- Order header — sale date, channel/source, ticket name, totals
- **Line items** — name, variation, quantity, modifiers, applied discounts, applied taxes
- **Tenders** — how the order was paid (card brand, amount, tip, processing fee)
- **Fulfillments** — pickup / delivery state and recipient

![Orders](/images/help/data/orders-list.png)

Orders are kept in sync automatically:

- **Webhooks** for near-real-time updates as orders are created or updated in Square
- A **nightly re-sync** at 2 AM that catches anything missed during the day

## Inventory

The Inventory page lists current stock counts per (catalog object × location). Counts are joined to the catalog cache so you see item names, variations, and SKUs without leaving the page.

![Inventory](/images/help/data/inventory.png)

Behind the scenes, AperioBI tracks three Square inventory data sources:

- `inventory_counts` — current per-(item, location) stock and state.
- `inventory_adjustments` — change events with `fromState` and `toState`. **Waste** in reports comes from rows where `toState = 'WASTE'`.
- `inventory_transfers` — movements between locations.

> Catalog images (the `IMAGE` Square type) are intentionally not synced — they're not needed for analytics.

## Tips

- Recently changed orders may take a few seconds to appear if Square's webhook event hasn't been delivered yet — refresh after a moment.
- The nightly re-sync at 2 AM picks up anything webhooks missed, so missing rows usually self-heal overnight.
- If something is still missing the next day, contact whoever manages your AperioBI workspace.
