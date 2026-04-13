import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import listSquareCustomers from "./list"

const squareCustomerRouter = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .route("/list", listSquareCustomers)

export default squareCustomerRouter
