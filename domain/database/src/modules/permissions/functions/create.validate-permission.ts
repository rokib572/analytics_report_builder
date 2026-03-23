import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { permissions } from "../schema"
import { DomainError } from "@analytics/shared-libs"

export const validatePermission = async (
  db: DbClient,
  customerId: string,
  query: {
    userId: string
    resource: string
    action: string
  },
) => {
  const { userId, resource, action } = query
  const customerClause = eq(permissions.customerId, customerId)
  const conditions = [
    eq(permissions.userId, userId),
    eq(permissions.resource, resource),
    eq(permissions.action, action),
  ]

  const whereClause = and(customerClause, ...conditions)

  const existing = await db.select({ id: permissions.id }).from(permissions).where(whereClause)

  if (existing.length > 0) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Permission already exists for user ${userId} on ${resource}:${action}`,
      clientSafeMessage: "This permission already exists. Use update to modify it.",
      additionalContext: {
        customerId,
        userId: userId,
        resource: resource,
        action: action,
      },
    })
  }
}
