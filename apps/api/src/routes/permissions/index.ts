import { Hono } from "hono"
import type { AuthEnv } from "../../middleware/auth"
import { requireRole } from "../../middleware/require-role"
import getPermissionsRouter from "./get"
import bulkSetPermissionsRouter from "./bulk-set"

const permissionsRouter = new Hono<AuthEnv>()
  .use(requireRole("owner", "system_admin"))
  .route("/", getPermissionsRouter)
  .route("/", bulkSetPermissionsRouter)

export default permissionsRouter
