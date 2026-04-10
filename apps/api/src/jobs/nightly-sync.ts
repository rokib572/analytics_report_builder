import cron from "node-cron"
import { findStuckBackfills } from "@analytics/database"
import { nightlySync, runBackfill } from "@analytics/data-sync"
import { db } from "../lib/db"

const resumeBackfills = async (staleBefore: Date) => {
  const stuckBackfills = await findStuckBackfills(db, staleBefore)

  for (const backfill of stuckBackfills) {
    void runBackfill(db, backfill.customerId, backfill.id).catch((error) => {
      console.error("[BackfillResumeError]", error)
    })
  }
}

export const startBackgroundJobs = () => {
  void resumeBackfills(new Date()).catch((error) => {
    console.error("[BackfillStartupScanError]", error)
  })

  cron.schedule("0 2 * * *", async () => {
    try {
      await nightlySync(db)
    } catch (error) {
      console.error("[NightlySyncError]", error)
    }
  })

  cron.schedule("*/15 * * * *", async () => {
    try {
      const staleBefore = new Date(Date.now() - 30 * 60 * 1000)
      await resumeBackfills(staleBefore)
    } catch (error) {
      console.error("[BackfillResumeScanError]", error)
    }
  })
}
