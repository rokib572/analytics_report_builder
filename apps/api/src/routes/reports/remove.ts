import { Hono } from "hono"

const router = new Hono()

router.delete("/:id", (c) => {
  // TODO: delete saved report by id
  return c.json({ ok: true })
})

export default router
