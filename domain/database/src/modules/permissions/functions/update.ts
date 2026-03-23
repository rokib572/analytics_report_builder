import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type PermissionDto, type UpdatePermissionPayload, permissions } from "../schema"
import { validatePermissionExists } from "./update.validate-permission"

export const updatePermission = async (
  db: DbClient,
  customerId: string,
  permissionId: string,
  data: UpdatePermissionPayload,
): Promise<PermissionDto> => {
  await validatePermissionExists(db, customerId, permissionId)

  const [permission] = await db
    .update(permissions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(permissions.customerId, customerId), eq(permissions.id, permissionId)))
    .returning()

  return permission!
}
