import type { ReactNode } from "react"
import { Separator, SidebarTrigger } from "@analytics/ui-shared"
import { useAuth } from "../../lib/auth-context"
import { CustomerSwitcher } from "./customer-switcher"

export const Header = ({ children }: { children?: ReactNode }) => {
  const { isSystemAdmin } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {isSystemAdmin && <CustomerSwitcher />}
      {children}
    </header>
  )
}
