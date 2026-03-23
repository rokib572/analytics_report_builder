import { createMiddleware } from "hono/factory"
import { getUserByBetterAuthId } from "@analytics/database"
import { isSystemAdmin } from "@analytics/validators"
import { auth } from "../lib/auth"
import { db } from "../lib/db"
import { DomainError } from "@analytics/shared-libs"

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
    throw DomainError.makeError({
      code: "UNAUTHORISED",
      message: "No valid session found.",
      clientSafeMessage: "Unauthorized. Please log in.",
    })
  }

  const appUser = await getUserByBetterAuthId(db, { betterAuthUserId: session.user.id })

  if (!appUser || !appUser.isActive) {
    throw DomainError.makeError({
      code: "UNAUTHORISED",
      message: "User is not authorised.",
      clientSafeMessage: "Unauthorized. Please log in.",
    })
  }

  context.set("user", {
    id: appUser.id,
    customerId: appUser.customerId,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
  })

  // System admins can switch customer context via header
  if (isSystemAdmin(appUser.role)) {
    const targetCustomerId = context.req.header("X-Customer-Id")
    context.set("customerId", targetCustomerId ?? appUser.customerId)
  } else {
    context.set("customerId", appUser.customerId)
  }

  await next()
})

export type { AuthEnv }
