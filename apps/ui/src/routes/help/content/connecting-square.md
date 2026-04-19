# Connecting Square

Square connections are managed inside the app, so you do not need to leave AperioBI to authorize access.

## Connect a Square account

1. Open **Connect** from the sidebar.
2. Click the **Square** card and approve access in the Square OAuth prompt.
3. Return to AperioBI and confirm the integration appears as active under **Integrations**.

## After you connect

- AperioBI starts importing locations and sales history.
- A backfill banner may appear while historical data is loading.
- Newly synced locations become available throughout the app after processing finishes.
- After the initial backfill, AperioBI re-syncs nightly and on Square webhook events, so new sales appear without manual action.

## If data is missing

- Confirm the integration is still marked active in **Integrations**.
- Give the initial import more time if you recently connected a large Square account.
- Check whether the expected location exists in Square and is active there.
- Ask an owner or admin to reconnect the integration if the token has expired.
