import "./index.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/query-client"
import { Router } from "./router"
import { AuthGuard } from "./components/auth-guard"
import { LoginRoute } from "./routes/login"
import { SignupRoute } from "./routes/signup"
import { LocationsRoute } from "./routes/locations"
import { LocationGetRoute } from "./routes/locations/get"
import { SalesRoute } from "./routes/sales"
import { SalesGetRoute } from "./routes/sales/get"
import { SyncRoute } from "./routes/sync"
import { ConnectRoute } from "./routes/connect"
import { ReportBuilderRoute } from "./routes/report-builder"

const App = () => {
  const route = Router.useRoute([
    "Login",
    "Signup",
    "Home",
    "LocationGet",
    "Sales",
    "SalesGet",
    "Sync",
    "Connect",
    "ReportBuilder",
    "ReportBuilderGet",
  ])

  if (route?.name === "Login") return <LoginRoute />
  if (route?.name === "Signup") return <SignupRoute />

  return (
    <AuthGuard>
      {route?.name === "Home" && <LocationsRoute />}
      {route?.name === "LocationGet" && <LocationGetRoute />}
      {route?.name === "Sales" && <SalesRoute />}
      {route?.name === "SalesGet" && <SalesGetRoute />}
      {route?.name === "Sync" && <SyncRoute />}
      {route?.name === "Connect" && <ConnectRoute />}
      {route?.name === "ReportBuilder" && <ReportBuilderRoute />}
      {route?.name === "ReportBuilderGet" && <ReportBuilderRoute />}
      {!route && <p>Not found</p>}
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
