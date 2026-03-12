export async function nightlySync() {
  // TODO: implement
  // For each location, for yesterday's date:
  // - call reconcile() to get squareCount vs dbCount
  // - if discrepancy > 0: re-fetch orders → upsert → write sync_log as "repaired"
  // - if match: write sync_log as "verified"
}
