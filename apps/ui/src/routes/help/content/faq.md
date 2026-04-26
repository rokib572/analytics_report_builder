# FAQ

## Why can't I see every page in the sidebar?

Your role controls baseline access. **Owners** and **admins** see every page in their workspace. **Members** only see pages they have explicit `view` permission for. Ask whoever invited you to open **Team → Manage permissions** and grant the resource you need.

## Why am I being sent to onboarding or the connect page?

New workspaces must complete onboarding before normal app usage. Workspaces without an active integration are routed to **Connect** until at least one integration is active.

## Why doesn't a location, order, or product appear yet?

Initial backfills take time, especially if you picked **All history** or 24 months at connect. After the initial import, AperioBI re-syncs nightly at 2 AM and on Square webhook events — new sales should appear automatically. If something is still missing after the backfill window:

1. Confirm it exists in Square and is active.
2. Confirm the integration is **Active** in **Integrations**.
3. Wait for the next nightly re-sync (2 AM) — it usually picks up anything webhooks missed.
4. If it still hasn't appeared, contact whoever manages your AperioBI workspace.

## How do I reconnect or disconnect Square?

Owners and admins manage integrations from **Integrations**. Click **Disconnect** on the Square card to revoke tokens (synced data is kept). Click **Reconnect** to rerun OAuth and resume sync. Members need to ask an owner or admin.

## How is "Net Sales" different from "Total Collected"?

- **Gross Sales** = item totals before discounts/returns.
- **Net Sales** = Gross − Discounts − Returns.
- **Total Collected** = Net + Tax + Tips + Service Charges.

If your finance team needs the actual cash inflow, use **Total Collected**. For comparing operational performance, use **Net Sales**.

## Why is the report builder showing a "Pivot would produce too many columns" error?

The pivot has a 50-coordinate cap. The column dimension you chose has more than 50 distinct values for the date range. Either narrow the date range, use a coarser column dimension (e.g. Month instead of Sale Date), or move the dimension to Rows.

## Why are Product and Payment Method incompatible?

They live in different query modes — line items vs tenders. The builder can't combine both in one report and shows a red banner if you try. Pick one or the other.

## Why isn't "Channel" in the dimension list?

Channel is surfaced as a per-metric **Break down by channel** toggle inside the canvas, not as a draggable dimension. This avoids the channel column ballooning when combined with other dimensions. Channel filters are still available under **+ Add Filter**.

## What's the Payroll Tax Rate input?

When you select **Estimated Payroll (After Tax)**, AperioBI multiplies reported labor cost by `(1 − payroll-tax-rate)` to estimate take-home payroll. The default is 14%; tweak it to your jurisdiction.

## Where do CSV / PDF exports come from?

Click **Export** in the Report Builder action bar (or on a saved report row). CSV uses `csv-stringify` and PDF uses `@react-pdf/renderer`, both running server-side from the same query as the canvas — what you see is what you export.

## How do I change my password?

Open **Profile** from the user menu in the sidebar footer and update your password there. If you can't sign in, use **Forgot password?** on the login page to receive a reset link.

## Where should I go if something still looks wrong?

Start with the relevant help topic — **Connecting Square** for setup, **Report Builder** for analytics questions, **Browsing your data** for missing records. If the issue continues, contact whoever manages your AperioBI workspace.
