import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import createSquareConnectionRouter from "./create"
import listSquareConnectionRouter from "./list"

const squareConnectRouter = new Hono<AuthEnv>()
  .route("/create", createSquareConnectionRouter)
  .route("/list", listSquareConnectionRouter)

export default squareConnectRouter
