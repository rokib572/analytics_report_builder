import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { createElement } from "react"
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
import { sendEmail } from "@analytics/email"
import { VerificationEmail } from "../emails/verification-email"
import { allowedOrigins } from "./allowed-origins"
import { db } from "./db"

const isProduction = process.env.NODE_ENV === "production"

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
  trustedOrigins: allowedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isProduction,
  },
  emailVerification: {
    sendOnSignUp: isProduction,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      if (!isProduction) {
        console.info("Verification email skipped (non-production env)", {
          email: user.email,
          url,
        })
        return
      }

      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email for Analytics",
          template: createElement(VerificationEmail, {
            userName: user.name,
            verifyUrl: url,
          }),
        })
      } catch (error) {
        console.error("Verification email send failed", {
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
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
