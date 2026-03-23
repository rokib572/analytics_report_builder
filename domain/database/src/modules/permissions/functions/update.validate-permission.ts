import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { permissions } from "../schema"
import { DomainError } from "@analytics/shared-libs"

export const validatePermissionExists = async (
  db: DbClient,
  customerId: string,
  permissionId: string,
) => {
  const customerClause = eq(permissions.customerId, customerId)
  const conditions = [eq(permissions.id, permissionId)]

  const whereClause = and(customerClause, ...conditions)

  const [existing] = await db.select({ id: permissions.id }).from(permissions).where(whereClause)

  if (!existing) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `Permission ${permissionId} not found for customer ${customerId}`,
      clientSafeMessage: "Permission not found.",
      additionalContext: { customerId, permissionId },
    })
  }
}
