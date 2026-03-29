import { createRouter } from "@swan-io/chicane"

export const Router = createRouter({
  Login: "/login",
  Signup: "/signup",
  AcceptInvite: "/accept-invite",
  Home: "/",
  SquareLocations: "/square/locations",
  SquareLocationGet: "/square/locations/:id",
  SquareOrders: "/square/orders",
  SquareOrderGet: "/square/orders/:locationId/:date",
  SquareSync: "/square/sync",
  Integrations: "/integrations",
  Connect: "/connect",
  Team: "/team",
  ReportBuilder: "/report-builder",
  ReportBuilderGet: "/report-builder/:reportId",
})
