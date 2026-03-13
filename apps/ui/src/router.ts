import { createRouter } from "@swan-io/chicane"

export const Router = createRouter({
  Login: "/login",
  Signup: "/signup",
  Home: "/",
  LocationGet: "/locations/:id",
  Sales: "/sales",
  SalesGet: "/sales/:locationId/:date",
  Sync: "/sync",
  Connect: "/connect",
  ReportBuilder: "/report-builder",
  ReportBuilderGet: "/report-builder/:reportId",
})
