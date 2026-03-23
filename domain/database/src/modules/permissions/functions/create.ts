import type { DbClient } from "../../../db/client"
import { type PermissionDto, type PermissionPayload, permissions } from "../schema"
import { validatePermission } from "./create.validate-permission"

export const createPermission = async (
  db: DbClient,
  customerId: string,
  data: PermissionPayload,
): Promise<PermissionDto> => {
  await validatePermission(db, customerId, data)

  const [permission] = await db
    .insert(permissions)
    .values({ customerId, ...data })
    .returning()

  return permission!
}
