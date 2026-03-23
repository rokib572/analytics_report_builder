import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@analytics/ui-shared"
import { AppSidebar } from "./layout/app-sidebar"
import { Header } from "./layout/header"

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto px-4 py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
