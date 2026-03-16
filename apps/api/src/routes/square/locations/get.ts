import { Hono } from "hono"

const router = new Hono()

router.get("/:id", (c) => {
  // TODO: implement
  return c.json({})
})

export default router
