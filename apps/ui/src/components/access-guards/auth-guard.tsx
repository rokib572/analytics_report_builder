import { useEffect, type ReactNode } from "react"
import { toast } from "sonner"
import { authClient } from "../../lib/auth-client"
import { useCurrentUser } from "../../data/auth/hooks"
import { AuthProvider } from "../../lib/auth-context"
import { getAssumedCustomerId, setAssumedCustomerId } from "../../lib/api-client"
import { Router } from "../../router"

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const { data: meData, isPending: mePending, error: meError } = useCurrentUser()
  const assumedCustomerId = getAssumedCustomerId()

  useEffect(() => {
    if (!sessionPending && !session) {
      const params = new URLSearchParams(window.location.search)
      const error = params.get("error")

      if (error) {
        window.location.href = `${Router.Login()}?error=${encodeURIComponent(error)}`
        return
      }

      Router.replace("Login")
    }
  }, [sessionPending, session])

  useEffect(() => {
    const message = window.sessionStorage.getItem("impersonationError")

    if (message) {
      toast.error(message)
      window.sessionStorage.removeItem("impersonationError")
    }
  }, [])

  useEffect(() => {
    if (!sessionPending && session && meError && assumedCustomerId) {
      const message = meError instanceof Error ? meError.message : "Failed to assume customer"
      window.sessionStorage.setItem("impersonationError", message)
      setAssumedCustomerId(null)
      window.location.reload()
    }
  }, [sessionPending, session, meError, assumedCustomerId])

  if (sessionPending || !session || mePending || (!meData && assumedCustomerId)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (meError || !meData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-center text-muted-foreground">
          {meError instanceof Error ? meError.message : "Failed to load your account."}
        </p>
      </div>
    )
  }

  return (
    <AuthProvider
      user={meData.user}
      permissions={meData.permissions}
      impersonation={meData.impersonation ?? null}
    >
      {children}
    </AuthProvider>
  )
}
