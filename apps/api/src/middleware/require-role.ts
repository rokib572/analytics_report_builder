import { createMiddleware } from "hono/factory"
import type { UserRole } from "@analytics/validators"
import type { AuthEnv } from "./auth"
import { DomainError } from "@analytics/shared-libs"

export const requireRole = (...roles: UserRole[]) =>
  createMiddleware<AuthEnv>(async (context, next) => {
    const user = context.get("user")

    if (!roles.includes(user.role as UserRole)) {
      throw DomainError.makeError({
        code: "UNAUTHORISED",
        message: `User ${user.id} with role "${user.role}" lacks required role: ${roles.join(", ")}`,
        clientSafeMessage: "You do not have permission to access this resource.",
      })
    }

    await next()
  })
