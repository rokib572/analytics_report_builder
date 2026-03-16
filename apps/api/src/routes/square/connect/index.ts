import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import createRouter from "./create"
import getRouter from "./get"
import deleteRouter from "./delete"

const connectRouter = new Hono<AuthEnv>()
  .route("/", createRouter)
  .route("/", getRouter)
  .route("/", deleteRouter)

export default connectRouter
