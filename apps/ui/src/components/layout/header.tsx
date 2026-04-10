import type { ReactNode } from "react"
import { Separator, SidebarTrigger } from "@analytics/ui-shared"
import { useBackfillStatus } from "../../data/square/sync/hooks"
import { useAuth } from "../../lib/auth-context"
import { CustomerSwitcher } from "./customer-switcher"
import { AccountSwitcher } from "./account-switcher"

export const Header = ({ children }: { children?: ReactNode }) => {
  const { isSystemAdmin } = useAuth()
  const { data } = useBackfillStatus()
  const backfill = data?.backfill
  const isBackfillActive = backfill?.status === "pending" || backfill?.status === "running"

  return (
    <div className="border-b">
      {isBackfillActive && (
        <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Backfilling your Square history. {backfill.ordersFetched ?? 0} orders imported so far.
          This will continue in the background.
        </div>
      )}
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {isSystemAdmin && <CustomerSwitcher />}
        <AccountSwitcher />
        {children}
      </header>
    </div>
  )
}
