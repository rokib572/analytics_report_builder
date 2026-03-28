import { useEffect, type ReactNode } from "react"
import type { UserRole } from "@analytics/validators"
import { useAuth } from "../../lib/auth-context"
import { Router } from "../../router"

const ALL_ROLES: UserRole[] = ["owner", "admin", "member", "system_admin"]

const routeRoles: Record<string, UserRole[]> = {
  Home: ALL_ROLES,
  Locations: ALL_ROLES,
  LocationGet: ALL_ROLES,
  Sales: ALL_ROLES,
  SalesGet: ALL_ROLES,
  ReportBuilder: ALL_ROLES,
  ReportBuilderGet: ALL_ROLES,
  Integrations: ["owner", "admin"],
  Connect: ["owner", "admin"],
  Team: ["owner", "admin", "system_admin"],
  Sync: ["system_admin"],
}

export const RouteRoleGuard = ({
  routeName,
  children,
}: {
  routeName: string | undefined
  children: ReactNode
}) => {
  const { user } = useAuth()
  const roles = routeName ? routeRoles[routeName] : undefined
  const authorized = !roles || roles.includes(user.role as UserRole)

  useEffect(() => {
    if (!authorized) {
      Router.replace("Home")
    }
  }, [authorized])

  if (!authorized) return null

  return <>{children}</>
}

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
