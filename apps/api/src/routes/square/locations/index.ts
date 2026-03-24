import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import listSquareLocationRouter from "./list"
import getLocationRouter from "./get"

const squareLocationRouter = new Hono<AuthEnv>()
  .route("/list", listSquareLocationRouter)
  .route("/get", getLocationRouter)

export default squareLocationRouter
