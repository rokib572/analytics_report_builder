import { createContext, useContext, type ReactNode } from "react"
import { isAccountAdmin, isSystemAdmin } from "@analytics/validators"

type AppUser = {
  id: string
  name: string
  email: string
  role: string
  customerId: string
  companyName: string
}

type Permission = {
  id: string
  customerId: string
  userId: string
  resource: string
  action: string
  allowed: boolean
}

type ImpersonationState = {
  active: true
  originalUserId: string
  originalUserName: string
  originalRole: string
  assumedCustomerId: string
  assumedCustomerName: string
}

type AuthContextValue = {
  user: AppUser
  permissions: Permission[]
  impersonation: ImpersonationState | null
  isAccountAdmin: boolean
  isSystemAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const useApiScopeKey = () => {
  const { user, impersonation } = useAuth()
  return `${user.customerId}:${impersonation?.assumedCustomerId ?? "self"}`
}

export const AuthProvider = ({
  user,
  permissions,
  impersonation,
  children,
}: {
  user: AppUser
  permissions: Permission[]
  impersonation: ImpersonationState | null
  children: ReactNode
}) => {
  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        impersonation,
        isAccountAdmin: isAccountAdmin(user.role),
        isSystemAdmin: isSystemAdmin(user.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
