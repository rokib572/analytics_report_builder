import { Hono } from "hono"

const router = new Hono()

router.get("/", (c) => {
  // TODO: JIT — check DB first, fetch from Square if empty, upsert, return
  return c.json([])
})

export default router
