import { createMiddleware } from "hono/factory"
import {
  getActiveOwnerByCustomerId,
  getCustomer,
  getUsersByBetterAuthId,
} from "@analytics/database"
import { isSystemAdmin } from "@analytics/validators"
import { auth } from "../lib/auth"
import { db } from "../lib/db"
import { DomainError } from "@analytics/shared-libs"

type ImpersonationState = {
  active: true
  originalUserId: string
  originalUserName: string
  originalRole: string
  assumedCustomerId: string
  assumedCustomerName: string
}

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
    actorUserId: string
    actorBetterAuthUserId: string
    impersonation: ImpersonationState | null
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

  const appUser = activeUsers[0]!
  const baseUser = {
    id: appUser.id,
    customerId: appUser.customerId,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
  }

  context.set("user", baseUser)
  context.set("betterAuthUserId", session.user.id)
  context.set("actorUserId", appUser.id)
  context.set("actorBetterAuthUserId", session.user.id)

  if (isSystemAdmin(appUser.role)) {
    const assumedCustomerId = context.req.header("X-Assume-Customer-Id")

    if (assumedCustomerId) {
      const [assumedOwner, assumedCustomer] = await Promise.all([
        getActiveOwnerByCustomerId(db, { customerId: assumedCustomerId }),
        getCustomer(db, assumedCustomerId),
      ])

      if (!assumedOwner || !assumedCustomer) {
        throw DomainError.makeError({
          code: "BAD_REQUEST",
          message: `Customer ${assumedCustomerId} has no active owner to assume`,
          clientSafeMessage: "Customer has no active owner to assume.",
        })
      }

      context.set("user", {
        id: assumedOwner.id,
        customerId: assumedOwner.customerId,
        email: assumedOwner.email,
        name: assumedOwner.name,
        role: "owner",
      })
      context.set("customerId", assumedCustomerId)
      context.set("impersonation", {
        active: true,
        originalUserId: appUser.id,
        originalUserName: appUser.name,
        originalRole: appUser.role,
        assumedCustomerId,
        assumedCustomerName: assumedCustomer.companyName ?? assumedCustomer.name,
      })

      await next()
      return
    }
  }

  context.set("customerId", appUser.customerId)
  context.set("impersonation", null)

  await next()
})

export type { AuthEnv }
