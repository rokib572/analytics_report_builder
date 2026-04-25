import { useEffect, type ReactNode } from "react"
import { useAuth } from "../../lib/auth-context"
import { useIntegrations } from "../../data/integrations/hooks"
import { Router } from "../../router"

export const OnboardingGuard = ({ children }: { children: ReactNode }) => {
  const { isSystemAdmin, user } = useAuth()
  const route = Router.useRoute(["Onboarding", "Connect", "Integrations", "Help", "HelpTopic"])
  const { data, isPending } = useIntegrations()

  const hasActiveIntegrations = (data?.data ?? []).some((integration) => integration.isActive)
  const isAllowedWithoutChecks =
    route?.name === "Onboarding" || route?.name === "Help" || route?.name === "HelpTopic"
  const isConnectOrIntegrationsRoute = route?.name === "Connect" || route?.name === "Integrations"

  const needsOnboarding = !isSystemAdmin && !isAllowedWithoutChecks && !user.companyName
  const needsConnect =
    !isSystemAdmin &&
    !isAllowedWithoutChecks &&
    !!user.companyName &&
    !isPending &&
    !hasActiveIntegrations &&
    !isConnectOrIntegrationsRoute

  useEffect(() => {
    if (needsOnboarding) {
      Router.replace("Onboarding")
      return
    }

    if (needsConnect) {
      Router.replace("Connect")
    }
  }, [needsOnboarding, needsConnect])

  if (isSystemAdmin) return <>{children}</>
  if (isAllowedWithoutChecks) return <>{children}</>

  if (needsOnboarding) return null

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (needsConnect) return null

  return <>{children}</>
}
