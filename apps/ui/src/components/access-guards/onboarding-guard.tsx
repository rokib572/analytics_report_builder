import { type ReactNode } from "react"
import { useAuth } from "../../lib/auth-context"
import { useIntegrations } from "../../data/integrations/hooks"
import { Router } from "../../router"

export const OnboardingGuard = ({ children }: { children: ReactNode }) => {
  const { isSystemAdmin, user } = useAuth()
  const route = Router.useRoute(["Onboarding", "Connect", "Integrations", "Help", "HelpTopic"])
  const { data, isPending } = useIntegrations()

  // System admins don't need integrations
  if (isSystemAdmin) return <>{children}</>

  if (route?.name === "Onboarding" || route?.name === "Help" || route?.name === "HelpTopic") {
    return <>{children}</>
  }

  if (!user.companyName) {
    Router.replace("Onboarding")
    return null
  }

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
