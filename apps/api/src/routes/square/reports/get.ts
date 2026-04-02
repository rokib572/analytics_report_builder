import { Hono } from "hono"
import { getSavedReport } from "@analytics/database"
import { DomainError } from "@analytics/shared-libs"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const router = new Hono<AuthEnv>()
  .use(requirePermission("reports", "view"))
  .get("/:id", async (context) => {
    const customerId = context.get("customerId")
    const id = context.req.param("id")
    const data = await getSavedReport(db, customerId, id)

    if (!data) {
      throw DomainError.makeError({
        code: "NOT_FOUND",
        message: `Saved report ${id} not found for customer ${customerId}`,
        clientSafeMessage: "Saved report not found.",
        additionalContext: { customerId, id },
      })
    }

    return context.json({ success: true, data })
  })

export default router
