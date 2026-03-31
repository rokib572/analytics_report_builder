import cron from "node-cron"
import { nightlySync } from "@analytics/data-sync"
import { db } from "../lib/db"

export const startNightlySyncJob = () => {
  cron.schedule("0 2 * * *", async () => {
    try {
      await nightlySync(db)
    } catch (error) {
      console.error("[NightlySyncError]", error)
    }
  })
}
