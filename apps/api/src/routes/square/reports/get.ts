import { Hono } from "hono"

const router = new Hono()

router.get("/:id", (c) => {
  // TODO: get a single saved report by id
  return c.json({})
})

export default router
