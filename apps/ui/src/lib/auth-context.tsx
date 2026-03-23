import { createContext, useContext, useCallback, useState, type ReactNode } from "react"
import { isAccountAdmin, isSystemAdmin } from "@analytics/validators"
import { setApiCustomerId } from "./api-client"

type AppUser = {
  id: string
  name: string
  email: string
  role: string
  customerId: string
}

type Permission = {
  id: string
  customerId: string
  userId: string
  resource: string
  action: string
  allowed: boolean
}

type AuthContextValue = {
  user: AppUser
  permissions: Permission[]
  isAccountAdmin: boolean
  isSystemAdmin: boolean
  selectedCustomerId: string | null
  setSelectedCustomerId: (id: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({
  user,
  permissions,
  children,
}: {
  user: AppUser
  permissions: Permission[]
  children: ReactNode
}) => {
  const [selectedCustomerId, _setSelectedCustomerId] = useState<string | null>(null)

  const setSelectedCustomerId = useCallback((id: string | null) => {
    _setSelectedCustomerId(id)
    setApiCustomerId(id)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAccountAdmin: isAccountAdmin(user.role),
        isSystemAdmin: isSystemAdmin(user.role),
        selectedCustomerId,
        setSelectedCustomerId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
