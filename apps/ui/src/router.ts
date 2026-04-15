import { createRouter } from "@swan-io/chicane"

export const Router = createRouter({
  Login: "/login",
  Signup: "/signup",
  VerifyEmailSent: "/verify-email-sent?:email",
  AcceptInvite: "/accept-invite",
  Onboarding: "/onboarding",
  Home: "/",
  SquareLocations: "/square/locations",
  SquareLocationGet: "/square/locations/:id",
  SquareOrders: "/square/orders",
  SquareOrderGet: "/square/orders/:id",
  SquareInventory: "/square/inventory",
  SquareSync: "/square/sync",
  Integrations: "/integrations",
  Connect: "/connect",
  Team: "/team",
  ReportBuilder: "/report-builder",
  ReportBuilderGet: "/report-builder/:reportId",
})
