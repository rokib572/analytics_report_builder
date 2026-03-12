import { Hono } from "hono"

const router = new Hono()

router.post("/", (c) => {
  // TODO: verify HMAC via WebhooksHelper.verifySignature
  // TODO: idempotency check via eventId in webhook_log
  // TODO: upsert order → recalculate daily_sales
  // Must respond HTTP 200 quickly — Square requires fast response
  return c.json({ ok: true })
})

export default router
