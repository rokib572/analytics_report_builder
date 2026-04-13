import { type ReactNode } from "react"
import { useAuth } from "../../lib/auth-context"
import { useIntegrations } from "../../data/integrations/hooks"
import { Router } from "../../router"

export const OnboardingGuard = ({ children }: { children: ReactNode }) => {
  const { isSystemAdmin } = useAuth()
  const route = Router.useRoute(["Connect", "Integrations"])
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

  const hasActiveIntegrations = (data?.data ?? []).some((integration) => integration.isActive)

  // Allow access to Connect/Integrations even without active integrations so users can reconnect.
  if (!hasActiveIntegrations && route?.name !== "Connect" && route?.name !== "Integrations") {
    Router.replace("Connect")
    return null
  }

  return <>{children}</>
}
