import { and, eq } from "drizzle-orm"
import { ulid } from "ulidx"
import type { DbClient } from "../../../db/client"
import { permissions } from "../schema"
import { listPermissions } from "./list"

type PermissionEntry = {
  resource: string
  action: string
  allowed: boolean
}

export const bulkSetPermissionsForUser = async (
  db: DbClient,
  customerId: string,
  userId: string,
  entries: PermissionEntry[],
) => {
  await db.transaction(async (tx) => {
    const customerClause = eq(permissions.customerId, customerId)
    const conditions = [eq(permissions.userId, userId)]
    const whereClause = and(customerClause, ...conditions)

    await tx.delete(permissions).where(whereClause)

    if (entries.length === 0) {
      return
    }

    await tx.insert(permissions).values(
      entries.map((entry) => ({
        id: ulid(),
        customerId,
        userId,
        resource: entry.resource,
        action: entry.action,
        allowed: entry.allowed,
      })),
    )
  })

  return listPermissions(db, customerId, userId)
}
