import { createMiddleware } from "hono/factory"

export const authMiddleware = createMiddleware(async (_c, next) => {
  // TODO: implement Better Auth middleware
  await next()
})
