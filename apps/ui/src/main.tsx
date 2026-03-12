import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { Router, Route, Switch } from "wouter"
import { queryClient } from "./lib/query-client"
import { LocationsRoute } from "./routes/locations"
import { LocationGetRoute } from "./routes/locations/get"
import { SalesRoute } from "./routes/sales"
import { SalesGetRoute } from "./routes/sales/get"
import { SyncRoute } from "./routes/sync"
import { ConnectRoute } from "./routes/connect"
import { ReportBuilderRoute } from "./routes/report-builder"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route path="/" component={LocationsRoute} />
          <Route path="/locations/:id" component={LocationGetRoute} />
          <Route path="/sales" component={SalesRoute} />
          <Route path="/sales/:locationId/:date" component={SalesGetRoute} />
          <Route path="/sync" component={SyncRoute} />
          <Route path="/connect" component={ConnectRoute} />
          <Route path="/report-builder" component={ReportBuilderRoute} />
          <Route path="/report-builder/:reportId" component={ReportBuilderRoute} />
        </Switch>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
)
