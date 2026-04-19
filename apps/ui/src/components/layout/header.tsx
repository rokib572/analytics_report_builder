import type { ReactNode } from "react"
import { Separator, SidebarTrigger } from "@analytics/ui-shared"
import { useIntegrations } from "../../data/integrations/hooks"
import { useBackfillStatus } from "../../data/square/sync/hooks"
import { ImpersonationBanner } from "./impersonation-banner"

export const Header = ({ children }: { children?: ReactNode }) => {
  const { data: integrations } = useIntegrations()
  const hasActiveSquareIntegration =
    integrations?.data.some(
      (integration) => integration.appName === "square" && integration.isActive,
    ) ?? false
  const { data } = useBackfillStatus(hasActiveSquareIntegration)
  const backfill = data?.backfill
  const isBackfillActive = backfill?.status === "pending" || backfill?.status === "running"

  return (
    <div className="border-b">
      <ImpersonationBanner />
      {isBackfillActive && (
        <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Backfilling your Square history. {backfill.ordersFetched ?? 0} orders imported so far.
          This will continue in the background.
        </div>
      )}
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {children}
      </header>
    </div>
  )
}
