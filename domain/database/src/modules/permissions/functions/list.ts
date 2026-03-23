import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type PermissionDto, permissions } from "../schema"

export const listPermissions = async (
  db: DbClient,
  customerId: string,
  userId: string,
): Promise<PermissionDto[]> => {
  return db
    .select()
    .from(permissions)
    .where(and(eq(permissions.customerId, customerId), eq(permissions.userId, userId)))
}
