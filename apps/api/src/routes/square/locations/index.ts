import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import listSquareLocationRouter from "./list"
import getLocationRouter from "./get"
import updateLocationOpenedAtRouter from "./update-opened-at"

const squareLocationRouter = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .route("/list", listSquareLocationRouter)
  .route("/get", getLocationRouter)
  .route("/", updateLocationOpenedAtRouter)

export default squareLocationRouter
