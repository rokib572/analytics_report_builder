import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type PermissionDto, permissions } from "../schema"
import { validatePermissionExists } from "./update.validate-permission"

export const deletePermission = async (
  db: DbClient,
  customerId: string,
  permissionId: string,
): Promise<PermissionDto> => {
  await validatePermissionExists(db, customerId, permissionId)

  const [deleted] = await db
    .delete(permissions)
    .where(and(eq(permissions.customerId, customerId), eq(permissions.id, permissionId)))
    .returning()

  return deleted!
}
