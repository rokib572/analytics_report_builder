import "./index.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/query-client"
import { Router } from "./router"
import { AuthGuard, GuestGuard, OnboardingGuard, RouteRoleGuard } from "./components/access-guards"
import { DashboardLayout } from "./components/dashboard-layout"
import { LoginRoute } from "./routes/login"
import { SignupRoute } from "./routes/signup"
import { HomeRoute } from "./routes/home"
import { LocationsRoute } from "./routes/locations"
import { LocationGetRoute } from "./routes/locations/get"
import { SalesRoute } from "./routes/sales"
import { SalesGetRoute } from "./routes/sales/get"
import { SyncRoute } from "./routes/sync"
import { IntegrationsRoute } from "./routes/integrations"
import { ConnectRoute } from "./routes/connect"
import { ReportBuilderRoute } from "./routes/report-builder"
import { AcceptInviteRoute } from "./routes/accept-invite"
import { TeamRoute } from "./routes/team"

const App = () => {
  const route = Router.useRoute([
    "Login",
    "Signup",
    "AcceptInvite",
    "Home",
    "Locations",
    "LocationGet",
    "Sales",
    "SalesGet",
    "Sync",
    "Integrations",
    "Connect",
    "Team",
    "ReportBuilder",
    "ReportBuilderGet",
  ])

  if (route?.name === "Login")
    return (
      <GuestGuard>
        <LoginRoute />
      </GuestGuard>
    )
  if (route?.name === "Signup")
    return (
      <GuestGuard>
        <SignupRoute />
      </GuestGuard>
    )
  if (route?.name === "AcceptInvite") return <AcceptInviteRoute />

  return (
    <AuthGuard>
      <OnboardingGuard>
        <DashboardLayout>
          <RouteRoleGuard routeName={route?.name}>
            {route?.name === "Home" && <HomeRoute />}
            {route?.name === "Locations" && <LocationsRoute />}
            {route?.name === "LocationGet" && <LocationGetRoute />}
            {route?.name === "Sales" && <SalesRoute />}
            {route?.name === "SalesGet" && <SalesGetRoute />}
            {route?.name === "Sync" && <SyncRoute />}
            {route?.name === "Integrations" && <IntegrationsRoute />}
            {route?.name === "Connect" && <ConnectRoute />}
            {route?.name === "Team" && <TeamRoute />}
            {route?.name === "ReportBuilder" && <ReportBuilderRoute />}
            {route?.name === "ReportBuilderGet" && <ReportBuilderRoute />}
            {!route && <p>Not found</p>}
          </RouteRoleGuard>
        </DashboardLayout>
      </OnboardingGuard>
    </AuthGuard>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
