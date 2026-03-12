import { Hono } from "hono"

const router = new Hono()

router.get("/", (c) => {
  // TODO: list all saved reports for the authenticated customer
  return c.json([])
})

export default router
