import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  baUser,
  baSession,
  baAccount,
  baVerification,
  createCustomer,
  createUser,
  getPendingInvitationByEmail,
  updateInvitationStatus,
} from "@analytics/database"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: baUser,
      session: baSession,
      account: baAccount,
      verification: baVerification,
    },
  }),
  basePath: "/api/auth",
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Check for a pending invitation for this email
          const pendingInvitation = await getPendingInvitationByEmail(db, { email: user.email })

          if (pendingInvitation) {
            // Invited user: join the inviter's account with the assigned role
            await createUser(db, pendingInvitation.customerId, {
              email: user.email,
              name: user.name,
              role: pendingInvitation.role,
              betterAuthUserId: user.id,
            })

            await updateInvitationStatus(db, {
              id: pendingInvitation.id,
              status: "accepted",
              acceptedAt: new Date(),
            })

            return
          }

          // Default flow: create a new customer + owner user
          const slug = user.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")

          const customer = await createCustomer(db, {
            name: user.name,
            slug: `${slug}-${Date.now()}`,
          })

          await createUser(db, customer.id, {
            email: user.email,
            name: user.name,
            role: "owner",
            betterAuthUserId: user.id,
          })
        },
      },
    },
  },
})
