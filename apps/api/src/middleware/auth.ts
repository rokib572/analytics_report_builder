import { createMiddleware } from "hono/factory"
import { getUsersByBetterAuthId } from "@analytics/database"
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
    betterAuthUserId: string
    accounts: { id: string; customerId: string; role: string }[]
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

  const appUsers = await getUsersByBetterAuthId(db, { betterAuthUserId: session.user.id })
  const activeUsers = appUsers.filter((u) => u.isActive)

  if (activeUsers.length === 0) {
    throw DomainError.makeError({
      code: "UNAUTHORISED",
      message: "User is not authorised.",
      clientSafeMessage: "Unauthorized. Please log in.",
    })
  }

  // Select active account: use X-Account-Id header if provided, otherwise default to first
  const accountId = context.req.header("X-Account-Id")
  const appUser = accountId
    ? (activeUsers.find((u) => u.customerId === accountId) ?? activeUsers[0]!)
    : activeUsers[0]!

  context.set("user", {
    id: appUser.id,
    customerId: appUser.customerId,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
  })

  context.set("betterAuthUserId", session.user.id)

  context.set(
    "accounts",
    activeUsers.map((u) => ({ id: u.id, customerId: u.customerId, role: u.role })),
  )

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
