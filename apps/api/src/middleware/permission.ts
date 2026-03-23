import { createMiddleware } from "hono/factory"
import { listPermissions } from "@analytics/database"
import type { Resource, Action } from "@analytics/validators"
import type { AuthEnv } from "./auth"
import { db } from "../lib/db"
import { DomainError } from "@analytics/shared-libs"

export const requirePermission = (resource: Resource, action: Action) =>
  createMiddleware<AuthEnv>(async (context, next) => {
    const user = context.get("user")
    const customerId = context.get("customerId")

    const userPermissions = await listPermissions(db, customerId, user.id)

    const match = userPermissions.find((p) => p.resource === resource && p.action === action)

    if (!match || !match.allowed) {
      throw DomainError.makeError({
        code: "UNAUTHORISED",
        message: `User ${user.id} lacks permission ${resource}:${action}`,
        clientSafeMessage: "You do not have permission to perform this action.",
      })
    }

    await next()
  })
