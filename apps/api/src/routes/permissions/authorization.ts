import type { UserDto } from "@analytics/database"
import { DomainError } from "@analytics/shared-libs"

type ContextUser = {
  id: string
}

export const assertCanManagePermissions = (
  contextUser: ContextUser,
  contextCustomerId: string,
  targetUser: UserDto | null,
) => {
  if (!targetUser || targetUser.customerId !== contextCustomerId) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `User not found for customer ${contextCustomerId}`,
      clientSafeMessage: "User not found",
    })
  }

  if (targetUser.id === contextUser.id) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `User ${contextUser.id} cannot modify their own permissions`,
      clientSafeMessage: "You cannot modify your own permissions",
    })
  }

  if (targetUser.role !== "admin" && targetUser.role !== "member") {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Cannot modify permissions for role ${targetUser.role}`,
      clientSafeMessage: "Cannot modify permissions for this user",
    })
  }
}
