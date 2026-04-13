import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import authorizeRouter from "./authorize"
import disconnectRouter from "./disconnect"

const squareOAuthRouter = new Hono<AuthEnv>()
  .route("/authorize", authorizeRouter)
  .route("/disconnect", disconnectRouter)

export default squareOAuthRouter
