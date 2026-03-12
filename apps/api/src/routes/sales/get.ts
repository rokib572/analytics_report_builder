import { Hono } from "hono"

const router = new Hono()

router.get("/:locationId/:date", (c) => {
  // TODO: JIT — check DB, staleness check for today, fetch from Square, upsert, return
  // Response includes current date + same-day-last-year for YoY comparison
  return c.json({})
})

export default router
