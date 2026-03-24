import { and, eq, gt } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { invitations } from "../schema"
import { users } from "../../users/schema"
import { DomainError } from "@analytics/shared-libs"

export const validateInvitation = async (
  db: DbClient,
  customerId: string,
  query: { email: string },
) => {
  const { email } = query

  // Check for existing pending, non-expired invitation for same email + customer
  const customerClause = eq(invitations.customerId, customerId)
  const conditions = [
    eq(invitations.email, email),
    eq(invitations.status, "pending"),
    gt(invitations.expiresAt, new Date()),
  ]
  const whereClause = and(customerClause, ...conditions)

  const existingInvitation = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(whereClause)
    .limit(1)

  if (existingInvitation.length > 0) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Pending invitation already exists for ${email}`,
      clientSafeMessage: "An invitation is already pending for this email address.",
    })
  }

  // Check for existing user with same email in this customer
  const userCustomerClause = eq(users.customerId, customerId)
  const userConditions = [eq(users.email, email)]
  const userWhereClause = and(userCustomerClause, ...userConditions)

  const existingUser = await db.select({ id: users.id }).from(users).where(userWhereClause).limit(1)

  if (existingUser.length > 0) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `User with email ${email} already exists in this account`,
      clientSafeMessage: "A user with this email already exists in your account.",
    })
  }
}
