import type { MiddlewareHandler } from "hono"
import { getAppIntegrationByAppName } from "@analytics/database"
import { DomainError } from "@analytics/shared-libs"
import { isSystemAdmin } from "@analytics/validators"
import { db } from "../lib/db"
import type { AuthEnv } from "./auth"

const SQUARE_APP_NAME = "square"

export const requireActiveSquareIntegration = (): MiddlewareHandler<AuthEnv> => {
  return async (context, next) => {
    const user = context.get("user")
    const impersonation = context.get("impersonation")

    if (isSystemAdmin(user.role) && !impersonation) {
      await next()
      return
    }

    const customerId = context.get("customerId")

    const integration = await getAppIntegrationByAppName(db, {
      customerId,
      appName: SQUARE_APP_NAME,
    })

    if (!integration) {
      throw DomainError.makeError({
        code: "NOT_FOUND",
        message: `No active Square integration found for customer ${customerId}`,
        clientSafeMessage:
          "Square is disconnected. Reconnect your Square account to view synced data.",
      })
    }

    await next()
  }
}
