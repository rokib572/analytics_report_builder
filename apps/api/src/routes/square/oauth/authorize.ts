import { randomBytes } from "node:crypto"
import { Hono } from "hono"
import { validator } from "hono/validator"
import { createOAuthState } from "@analytics/database"
import { buildAuthorizeUrl, getSquareEnvironment } from "@analytics/square"
import { InitiateOAuthSchema } from "@analytics/validators"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"

const TEN_MINUTES_MS = 10 * 60 * 1000

const authorizeRouter = new Hono<AuthEnv>().get(
  "/",
  validator("query", (input) => InitiateOAuthSchema.parse(input)),
  async (context) => {
    const { backfillScope } = context.req.valid("query")
    const customerId = context.get("customerId")
    const user = context.get("user")
    const environment = getSquareEnvironment()

    const state = randomBytes(32).toString("hex")

    await createOAuthState(db, customerId, {
      state,
      userId: user.id,
      environment,
      backfillScope,
      expiresAt: new Date(Date.now() + TEN_MINUTES_MS),
    })

    const url = buildAuthorizeUrl(state, environment)
    return context.json({ url })
  },
)

export default authorizeRouter
