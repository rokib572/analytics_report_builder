import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import summaryRouter from "./summary"
import jitRouter from "./jit"

const dailySalesRouter = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .route("/summary", summaryRouter)
  .route("/", jitRouter)

export default dailySalesRouter
