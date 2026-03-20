import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import createSquareConnectionRouter from "./create"
import getSquareConnectionRouter from "./get"

const squareConnectRouter = new Hono<AuthEnv>()
  .route("/square/create", createSquareConnectionRouter)
  .route("/square/get", getSquareConnectionRouter)

export default squareConnectRouter
