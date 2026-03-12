import { Hono } from "hono"

const router = new Hono()

router.get("/", (c) => {
  // TODO: return sync_log entries with squareCount vs dbCount per location
  return c.json([])
})

export default router
