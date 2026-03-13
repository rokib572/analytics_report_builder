import { createMiddleware } from "hono/factory"
import { getUserByBetterAuthId } from "@analytics/database"
import { auth } from "../lib/auth"
import { db } from "../lib/db"

type AuthEnv = {
  Variables: {
    user: {
      id: string
      customerId: string
      email: string
      name: string
      role: string
    }
    customerId: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (context, next) => {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  })

  if (!session) {
    return context.json({ error: "Unauthorized" }, 401)
  }

  const appUser = await getUserByBetterAuthId(db, session.user.id)

  if (!appUser || !appUser.isActive) {
    return context.json({ error: "Unauthorized" }, 401)
  }

  context.set("user", {
    id: appUser.id,
    customerId: appUser.customerId,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
  })
  context.set("customerId", appUser.customerId)

  await next()
})

export type { AuthEnv }
