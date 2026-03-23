import { BarChart3, Home, Link2, Plug, MapPin, RefreshCw, FileBarChart } from "lucide-react"
import type { UserRole } from "@analytics/validators"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@analytics/ui-shared"
import { useAuth } from "../../lib/auth-context"
import { useIntegrations, SUPPORTED_APPS } from "../../lib/use-integrations"
import { Router } from "../../router"
import { NavUser } from "./nav-user"

type RouteName =
  | "Home"
  | "Locations"
  | "Sales"
  | "Sync"
  | "Integrations"
  | "Connect"
  | "ReportBuilder"

type NavItem = {
  label: string
  icon: typeof Home
  route: RouteName
  matchRoutes?: string[]
  roles: UserRole[]
  permission?: string
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    route: "Home",
    roles: ["owner", "admin", "member", "system_admin"],
  },
  {
    label: "Locations",
    icon: MapPin,
    route: "Locations",
    matchRoutes: ["LocationGet"],
    roles: ["owner", "admin", "member", "system_admin"],
    permission: "locations:view",
  },
  {
    label: "Sales",
    icon: BarChart3,
    route: "Sales",
    matchRoutes: ["SalesGet"],
    roles: ["owner", "admin", "member", "system_admin"],
    permission: "sales:view",
  },
  {
    label: "Sync",
    icon: RefreshCw,
    route: "Sync",
    roles: ["system_admin"],
  },
  {
    label: "Report Builder",
    icon: FileBarChart,
    route: "ReportBuilder",
    matchRoutes: ["ReportBuilderGet"],
    roles: ["owner", "admin", "member", "system_admin"],
    permission: "reports:view",
  },
]

export const AppSidebar = () => {
  const route = Router.useRoute([
    "Home",
    "Locations",
    "LocationGet",
    "Sales",
    "SalesGet",
    "Sync",
    "Integrations",
    "Connect",
    "ReportBuilder",
    "ReportBuilderGet",
  ])

  const currentRoute = route?.name
  const { user, permissions, isAccountAdmin, isSystemAdmin } = useAuth()
  const { data: integrationsData } = useIntegrations()

  const connectedApps = new Set((integrationsData?.data ?? []).map((i) => i.appName))
  const hasIntegrations = connectedApps.size > 0
  const allAppsConnected = SUPPORTED_APPS.every((app) => connectedApps.has(app))

  // Build dynamic nav items for Connect/Integrations
  const dynamicItems: NavItem[] = []

  if (hasIntegrations) {
    dynamicItems.push({
      label: "Integrations",
      icon: Plug,
      route: "Integrations",
      roles: ["owner", "admin"],
    })
  }

  if (!allAppsConnected) {
    dynamicItems.push({
      label: "Connect",
      icon: Link2,
      route: "Connect",
      roles: ["owner", "admin"],
    })
  }

  const allItems = [...navItems, ...dynamicItems]

  const visibleItems = allItems.filter((item) => {
    if (!item.roles.includes(user.role as UserRole)) return false

    // Members need explicit permission for gated items
    if (!isAccountAdmin && !isSystemAdmin && item.permission) {
      const [resource, action] = item.permission.split(":")
      return permissions.some((p) => p.resource === resource && p.action === action && p.allowed)
    }

    return true
  })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => Router.push("Home")}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BarChart3 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Analytics</span>
                <span className="truncate text-xs">Report Builder</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive =
                  currentRoute === item.route ||
                  (item.matchRoutes?.some((r) => r === currentRoute) ?? false)

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => Router.push(item.route)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
