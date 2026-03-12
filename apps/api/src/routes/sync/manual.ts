import { Hono } from "hono"

const router = new Hono()

router.post("/", (c) => {
  // TODO: trigger full sync for given date + optional locationIds
  return c.json({ ok: true })
})

export default router
