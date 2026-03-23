import { createRouter } from "@swan-io/chicane"

export const Router = createRouter({
  Login: "/login",
  Signup: "/signup",
  Home: "/",
  Locations: "/locations",
  LocationGet: "/locations/:id",
  Sales: "/sales",
  SalesGet: "/sales/:locationId/:date",
  Sync: "/sync",
  Integrations: "/integrations",
  Connect: "/connect",
  ReportBuilder: "/report-builder",
  ReportBuilderGet: "/report-builder/:reportId",
})
