import { BarChart3, Home, Link2, Plug, MapPin, RefreshCw, FileBarChart, Users } from "lucide-react"
import type { UserRole } from "@analytics/validators"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@analytics/ui-shared"
import { useAuth } from "../../lib/auth-context"
import { useIntegrations, SUPPORTED_APPS } from "../../data/integrations/hooks"
import { Router } from "../../router"
import { NavUser } from "./nav-user"

type RouteName =
  | "Home"
  | "SquareLocations"
  | "SquareOrders"
  | "SquareSync"
  | "Integrations"
  | "Connect"
  | "Team"
  | "ReportBuilder"

type NavItem = {
  label: string
  icon: typeof Home
  route: RouteName
  matchRoutes?: string[]
  roles: UserRole[]
  permission?: string
}

const coreNavItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    route: "Home",
    roles: ["owner", "admin", "member", "system_admin"],
  },
  {
    label: "Report Builder",
    icon: FileBarChart,
    route: "ReportBuilder",
    matchRoutes: ["ReportBuilderGet"],
    roles: ["owner", "admin", "member", "system_admin"],
    permission: "reports:view",
  },
  {
    label: "Team",
    icon: Users,
    route: "Team",
    roles: ["owner", "admin", "system_admin"],
  },
]

const squareNavItems: NavItem[] = [
  {
    label: "Locations",
    icon: MapPin,
    route: "SquareLocations",
    matchRoutes: ["SquareLocationGet"],
    roles: ["owner", "admin", "member", "system_admin"],
    permission: "locations:view",
  },
  {
    label: "Orders",
    icon: BarChart3,
    route: "SquareOrders",
    matchRoutes: ["SquareOrderGet"],
    roles: ["owner", "admin", "member", "system_admin"],
    permission: "orders:view",
  },
  {
    label: "Sync",
    icon: RefreshCw,
    route: "SquareSync",
    roles: ["system_admin"],
  },
]

export const AppSidebar = () => {
  const route = Router.useRoute([
    "Home",
    "SquareLocations",
    "SquareLocationGet",
    "SquareOrders",
    "SquareOrderGet",
    "SquareSync",
    "Integrations",
    "Connect",
    "Team",
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

  if (isSystemAdmin || hasIntegrations) {
    dynamicItems.push({
      label: "Integrations",
      icon: Plug,
      route: "Integrations",
      roles: ["owner", "admin"],
    })
  }

  if (isSystemAdmin || !allAppsConnected) {
    dynamicItems.push({
      label: "Connect",
      icon: Link2,
      route: "Connect",
      roles: ["owner", "admin"],
    })
  }

  const filterVisible = (items: NavItem[]) =>
    items.filter((item) => {
      if (isSystemAdmin) return true

      if (!item.roles.includes(user.role as UserRole)) return false

      // Members need explicit permission for gated items
      if (!isAccountAdmin && item.permission) {
        const [resource, action] = item.permission.split(":")
        return permissions.some((p) => p.resource === resource && p.action === action && p.allowed)
      }

      return true
    })

  const visibleCoreItems = filterVisible([...coreNavItems, ...dynamicItems])
  const visibleSquareItems =
    isSystemAdmin || connectedApps.has("square") ? filterVisible(squareNavItems) : []

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
              {visibleCoreItems.map((item) => {
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

        {visibleSquareItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Square</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSquareItems.map((item) => {
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
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
