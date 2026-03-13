import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  baUser,
  baSession,
  baAccount,
  baVerification,
  createCustomer,
  createUser,
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
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const slug = user.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")

          const customer = await createCustomer(db, {
            name: user.name,
            slug: `${slug}-${Date.now()}`,
          })

          await createUser(db, {
            customerId: customer.id,
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
