import { Hono } from "hono"
import { listPermissions, getCustomersByIds } from "@analytics/database"
import { isAccountAdmin, isSystemAdmin } from "@analytics/validators"
import type { AuthEnv } from "../../middleware/auth"
import { db } from "../../lib/db"

const meRouter = new Hono<AuthEnv>().get("/", async (context) => {
  const user = context.get("user")
  const accounts = context.get("accounts")

  // Owner/admin/system_admin have full access — no need to fetch permissions
  const permissions =
    isAccountAdmin(user.role) || isSystemAdmin(user.role)
      ? []
      : await listPermissions(db, user.customerId, user.id)

  // Fetch customer names for all accounts
  const customerIds = accounts.map((a) => a.customerId)
  const customerRecords = await getCustomersByIds(db, customerIds)
  const customerMap = new Map(customerRecords.map((c) => [c.id, c]))

  const accountsWithNames = accounts.map((a) => ({
    ...a,
    customerName:
      customerMap.get(a.customerId)?.companyName ?? customerMap.get(a.customerId)?.name ?? "",
  }))

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
    accounts: accountsWithNames,
  })
})

export default meRouter
