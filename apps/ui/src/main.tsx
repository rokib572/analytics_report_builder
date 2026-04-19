import "./index.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/query-client"
import { Router } from "./router"
import { AuthGuard, GuestGuard, OnboardingGuard, RouteRoleGuard } from "./components/access-guards"
import { DashboardLayout } from "./components/dashboard-layout"
import { LoginRoute } from "./routes/login"
import { ForgotPasswordRoute } from "./routes/forgot-password"
import { ResetPasswordRoute } from "./routes/reset-password"
import { SignupRoute } from "./routes/signup"
import { VerifyEmailSentRoute } from "./routes/verify-email-sent"
import { OnboardingRoute } from "./routes/onboarding"
import { ProfileRoute } from "./routes/profile"
import { AdminCustomersRoute } from "./routes/admin-customers"
import { HomeRoute } from "./routes/home"
import { LocationsRoute } from "./routes/square/locations"
import { LocationGetRoute } from "./routes/square/locations/get"
import { OrdersRoute } from "./routes/square/orders"
import { OrderGetRoute } from "./routes/square/orders/get"
import { InventoryRoute } from "./routes/square/inventory"
import { SyncRoute } from "./routes/square/sync"
import { IntegrationsRoute } from "./routes/integrations"
import { ConnectRoute } from "./routes/connect"
import { ReportBuilderRoute } from "./routes/report-builder"
import { AcceptInviteRoute } from "./routes/accept-invite"
import { TeamRoute } from "./routes/permissions"
import { HelpRoute } from "./routes/help"
import { HelpTopicRoute } from "./routes/help/topic"
import { Toaster } from "./components/toaster"

const App = () => {
  const route = Router.useRoute([
    "Login",
    "Signup",
    "ForgotPassword",
    "ResetPassword",
    "VerifyEmailSent",
    "AcceptInvite",
    "Onboarding",
    "Profile",
    "AdminCustomers",
    "Home",
    "SquareLocations",
    "SquareLocationGet",
    "SquareOrders",
    "SquareOrderGet",
    "SquareInventory",
    "SquareSync",
    "Integrations",
    "Connect",
    "Team",
    "Help",
    "HelpTopic",
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
  if (route?.name === "ForgotPassword")
    return (
      <GuestGuard>
        <ForgotPasswordRoute />
      </GuestGuard>
    )
  if (route?.name === "ResetPassword")
    return (
      <GuestGuard>
        <ResetPasswordRoute />
      </GuestGuard>
    )
  if (route?.name === "VerifyEmailSent")
    return (
      <GuestGuard>
        <VerifyEmailSentRoute />
      </GuestGuard>
    )
  if (route?.name === "AcceptInvite") return <AcceptInviteRoute />
  if (route?.name === "Onboarding")
    return (
      <AuthGuard>
        <DashboardLayout>
          <OnboardingRoute />
        </DashboardLayout>
      </AuthGuard>
    )

  return (
    <AuthGuard>
      <OnboardingGuard>
        <DashboardLayout>
          <RouteRoleGuard routeName={route?.name}>
            {route?.name === "Home" && <HomeRoute />}
            {route?.name === "Profile" && <ProfileRoute />}
            {route?.name === "AdminCustomers" && <AdminCustomersRoute />}
            {route?.name === "SquareLocations" && <LocationsRoute />}
            {route?.name === "SquareLocationGet" && <LocationGetRoute />}
            {route?.name === "SquareOrders" && <OrdersRoute />}
            {route?.name === "SquareOrderGet" && <OrderGetRoute />}
            {route?.name === "SquareInventory" && <InventoryRoute />}
            {route?.name === "SquareSync" && <SyncRoute />}
            {route?.name === "Integrations" && <IntegrationsRoute />}
            {route?.name === "Connect" && <ConnectRoute />}
            {route?.name === "Team" && <TeamRoute />}
            {route?.name === "Help" && <HelpRoute />}
            {route?.name === "HelpTopic" && <HelpTopicRoute />}
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
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
