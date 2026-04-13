import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import listInventoryRouter from "./list"

const inventoryRouter = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .route("/list", listInventoryRouter)

export default inventoryRouter
