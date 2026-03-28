import { type ReactNode } from "react"
import { useAuth } from "../../lib/auth-context"
import { useIntegrations } from "../../data/integrations/hooks"
import { Router } from "../../router"

export const OnboardingGuard = ({ children }: { children: ReactNode }) => {
  const { isSystemAdmin } = useAuth()
  const route = Router.useRoute(["Connect"])
  const { data, isPending } = useIntegrations()

  // System admins don't need integrations
  if (isSystemAdmin) return <>{children}</>

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const hasIntegrations = data?.data && data.data.length > 0

  // Allow access to the Connect page even without integrations
  if (!hasIntegrations && route?.name !== "Connect") {
    Router.replace("Connect")
    return null
  }

  return <>{children}</>
}
