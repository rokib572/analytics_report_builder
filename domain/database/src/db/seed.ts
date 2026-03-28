import { config } from "dotenv"
import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { ulid } from "ulidx"
import { getDbClient } from "./client"
import { baUser, baAccount } from "../modules/auth-sessions/schema"
import { customers } from "../modules/customers/schema"
import { users } from "../modules/users/schema"

config({ path: "../../.env" })

const SYSTEM_ADMIN = {
  email: "rokib572@gmail.com",
  firstName: "System",
  lastName: "Admin",
  password: "TeraCrypto$oft123",
  customerName: "System",
  customerSlug: "system",
}

const seed = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const { queryClient, db } = getDbClient(connectionString, {
    logQueries: false,
  })

  try {
    // Check if system customer already exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.slug, SYSTEM_ADMIN.customerSlug))
      .limit(1)

    if (existingCustomer.length > 0) {
      console.log("Seed: system_admin user already exists, skipping.")
      return
    }

    const customerId = ulid()
    const baUserId = ulid()
    const baAccountId = ulid()
    const appUserId = ulid()
    const hashedPassword = await hashPassword(SYSTEM_ADMIN.password)
    const fullName = `${SYSTEM_ADMIN.firstName} ${SYSTEM_ADMIN.lastName}`

    await db.transaction(async (tx) => {
      // 1. Create system customer
      await tx.insert(customers).values({
        id: customerId,
        name: SYSTEM_ADMIN.customerName,
        slug: SYSTEM_ADMIN.customerSlug,
      })

      // 2. Create Better Auth user
      await tx.insert(baUser).values({
        id: baUserId,
        name: fullName,
        email: SYSTEM_ADMIN.email,
        emailVerified: true,
      })

      // 3. Create Better Auth account with hashed password
      await tx.insert(baAccount).values({
        id: baAccountId,
        userId: baUserId,
        accountId: baUserId,
        providerId: "credential",
        password: hashedPassword,
      })

      // 4. Create app user with system_admin role
      await tx.insert(users).values({
        id: appUserId,
        customerId,
        email: SYSTEM_ADMIN.email,
        name: fullName,
        role: "system_admin",
        isActive: true,
        betterAuthUserId: baUserId,
      })
    })

    console.log("Seed: system_admin user created successfully.")
  } catch (error) {
    console.error("Seed failed:", error)
    process.exit(1)
  } finally {
    await queryClient.end()
  }
}

void seed()
