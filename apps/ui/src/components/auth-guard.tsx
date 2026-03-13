import { useEffect, type ReactNode } from "react"
import { authClient } from "../lib/auth-client"
import { Router } from "../router"

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session) {
      Router.replace("Login")
    }
  }, [isPending, session])

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return <>{children}</>
}
