import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import listRouter from "./list"

const productsRouter = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .route("/", listRouter)

export default productsRouter
