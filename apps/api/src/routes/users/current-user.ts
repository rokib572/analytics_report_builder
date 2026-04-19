import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { getCustomersByIds, listPermissions, updateBaUser, updateUser } from "@analytics/database"
import { isAccountAdmin, isSystemAdmin } from "@analytics/validators"
import { DomainError } from "@analytics/shared-libs"
import type { AuthEnv } from "../../middleware/auth"
import { db } from "../../lib/db"

const UpdateCurrentUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
})

const meRouter = new Hono<AuthEnv>()
  .get("/", async (context) => {
    const user = context.get("user")
    const impersonation = context.get("impersonation")

    // Owner/admin/system_admin have full access — no need to fetch permissions
    const permissions =
      isAccountAdmin(user.role) || isSystemAdmin(user.role)
        ? []
        : await listPermissions(db, user.customerId, user.id)

    const customerRecords = await getCustomersByIds(db, [user.customerId])
    const customerMap = new Map(customerRecords.map((c) => [c.id, c]))

    return context.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        companyName: customerMap.get(user.customerId)?.companyName ?? "",
      },
      permissions,
      impersonation,
    })
  })
  .patch("/", zValidator("json", UpdateCurrentUserSchema), async (context) => {
    const user = context.get("user")
    const betterAuthUserId = context.get("betterAuthUserId")
    const { name } = context.req.valid("json")

    const updatedUser = await db.transaction(async (tx) => {
      const nextUser = await updateUser(tx, user.customerId, user.id, { name })

      if (!nextUser) {
        throw DomainError.makeError({
          code: "NOT_FOUND",
          message: `User with ID ${user.id} not found`,
          clientSafeMessage: "User not found.",
        })
      }

      const updatedAuthUser = await updateBaUser(tx, betterAuthUserId, { name })
      if (!updatedAuthUser) {
        throw DomainError.makeError({
          code: "NOT_FOUND",
          message: `Better Auth user with ID ${betterAuthUserId} not found`,
          clientSafeMessage: "User not found.",
        })
      }

      return nextUser
    })

    return context.json({
      success: true,
      user: updatedUser,
    })
  })

export default meRouter
