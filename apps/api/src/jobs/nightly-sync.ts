import cron from "node-cron"

export const startNightlySyncJob = () => {
  cron.schedule("0 2 * * *", async () => {
    // TODO: call nightlySync() from @analytics/data-sync
  })
}
