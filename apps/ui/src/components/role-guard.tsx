import { useEffect, type ReactNode } from "react"
import type { UserRole } from "@analytics/validators"
import { useAuth } from "../lib/auth-context"
import { Router } from "../router"

export const RoleGuard = ({
  roles,
  permission,
  children,
}: {
  roles: UserRole[]
  permission?: string
  children: ReactNode
}) => {
  const { user, permissions, isSystemAdmin, isAccountAdmin } = useAuth()

  const hasRole = roles.includes(user.role as UserRole)

  // Members need explicit permission if specified
  const hasPermission =
    isSystemAdmin ||
    isAccountAdmin ||
    !permission ||
    permissions.some((p) => {
      const [resource, action] = permission.split(":")
      return p.resource === resource && p.action === action && p.allowed
    })

  const authorized = hasRole && hasPermission

  useEffect(() => {
    if (!authorized) {
      Router.replace("Home")
    }
  }, [authorized])

  if (!authorized) return null

  return <>{children}</>
}
