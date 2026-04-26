# Connecting Square

Square is connected through OAuth from inside AperioBI. You don't need a personal access token, and you don't need to leave the app to authorise.

## Connect a Square account

1. Open **Connect** from the sidebar.
2. Pick how much history to import in the **History to import** dropdown:
   - **30 days**, **3 / 6 / 12 / 24 months**, or **All history**.
   - 12 months is a good default for most analytics; pick smaller if you only want recent activity, or **All history** to backfill everything Square will return.
3. Click **Connect with Square**. You'll be redirected to Square's OAuth screen — review the requested permissions and approve.
4. After approval, Square redirects you back to AperioBI. The Integrations page shows a green success banner and the Square card flips to **Active**.

![Connect Square](/images/help/connect/connect-square.png)

## What happens after you connect

- AperioBI starts a sync pipeline in this order: **Locations → Catalog → Orders & line items → Payments → Refunds → Inventory → Daily aggregation**.
- A backfill runs in chunks for the date range you chose. Larger ranges naturally take longer.
- After the first import finishes, AperioBI keeps data fresh automatically through:
  - A **nightly re-sync** at 2 AM that catches anything missed during the day,
  - **Square webhooks** for near-real-time updates as orders, payments, refunds, and inventory change in Square.

You don't need to trigger anything manually — new sales appear on their own.

## The Integrations page

Open **Integrations** to see every connected app, its environment (sandbox / production), connection date, and current status.

![Integrations page](/images/help/connect/integrations.png)

From here you can:

- **Disconnect** an integration. Tokens are revoked immediately. Your **already-synced data is kept** so historical reports remain valid; new sales just stop flowing.
- **Reconnect** after a disconnect or a token expiry. The OAuth flow runs again and sync resumes.

## If data looks missing

- Confirm the integration is still **Active** in **Integrations**.
- If you just connected a long backfill window, give it more time — locations populate first, full orders and inventory take longer.
- Verify the location or item exists and is **active in Square**.
- Owners and admins can reconnect; members need to ask an owner or admin.
