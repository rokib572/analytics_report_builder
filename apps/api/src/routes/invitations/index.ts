import { Hono } from "hono"
import type { AuthEnv } from "../../middleware/auth"
import createInvitationRouter from "./create"
import listInvitationsRouter from "./list"
import revokeInvitationRouter from "./revoke"
import acceptInvitationRouter from "./accept"

const invitationRouter = new Hono<AuthEnv>()
  .route("/create", createInvitationRouter)
  .route("/list", listInvitationsRouter)
  .route("/revoke", revokeInvitationRouter)
  .route("/accept", acceptInvitationRouter)

export default invitationRouter
