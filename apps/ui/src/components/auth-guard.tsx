import { useEffect, type ReactNode } from "react"
import { authClient } from "../lib/auth-client"
import { useCurrentUser } from "../lib/use-current-user"
import { AuthProvider } from "../lib/auth-context"
import { Router } from "../router"

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const { data: meData, isPending: mePending } = useCurrentUser()

  useEffect(() => {
    if (!sessionPending && !session) {
      Router.replace("Login")
    }
  }, [sessionPending, session])

  if (sessionPending || !session || mePending || !meData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <AuthProvider user={meData.user} permissions={meData.permissions}>
      {children}
    </AuthProvider>
  )
}
