import { Hono } from "hono"
import { validator } from "hono/validator"
import { updateLocationOpenedAt } from "@analytics/database"
import { updateLocationOpenedAtSchema } from "@analytics/validators"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const updateLocationOpenedAtRouter = new Hono<AuthEnv>()
  .use(requirePermission("locations", "update"))
  .patch(
    "/:id/opened-at",
    validator("json", (input) => updateLocationOpenedAtSchema.parse(input)),
    async (context) => {
      const customerId = context.get("customerId")
      const id = context.req.param("id")
      const { openedAt } = context.req.valid("json")

      const location = await updateLocationOpenedAt(db, customerId, id, openedAt)

      return context.json({ success: true, location })
    },
  )

export default updateLocationOpenedAtRouter
