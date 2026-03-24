import { createContext, useContext, useCallback, useState, type ReactNode } from "react"
import { isAccountAdmin, isSystemAdmin } from "@analytics/validators"
import { setApiCustomerId, setApiAccountId } from "./api-client"

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

type Account = {
  id: string
  customerId: string
  role: string
  customerName: string
}

type AuthContextValue = {
  user: AppUser
  permissions: Permission[]
  accounts: Account[]
  isAccountAdmin: boolean
  isSystemAdmin: boolean
  selectedCustomerId: string | null
  setSelectedCustomerId: (id: string | null) => void
  switchAccount: (customerId: string) => void
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
  accounts,
  children,
}: {
  user: AppUser
  permissions: Permission[]
  accounts: Account[]
  children: ReactNode
}) => {
  const [selectedCustomerId, _setSelectedCustomerId] = useState<string | null>(null)

  const setSelectedCustomerId = useCallback((id: string | null) => {
    _setSelectedCustomerId(id)
    setApiCustomerId(id)
  }, [])

  const switchAccount = useCallback((customerId: string) => {
    setApiAccountId(customerId)
    window.location.reload()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        accounts,
        isAccountAdmin: isAccountAdmin(user.role),
        isSystemAdmin: isSystemAdmin(user.role),
        selectedCustomerId,
        setSelectedCustomerId,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
