import { config } from "dotenv"
import { and, eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { z } from "zod"
import { ulid } from "ulidx"
import { getDbClient } from "./client"
import { baUser, baAccount } from "../modules/auth-sessions/schema"
import { customers } from "../modules/customers/schema"
import { users } from "../modules/users/schema"

config({ path: "../../.env" })

const HARDCODED_BOOTSTRAP_ADMIN = {
  email: "rokib572@gmail.com",
  name: "System Admin",
  password: "TeraCrypto$oft123",
}

const AdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1),
  password: z.string().min(8),
})

const AdminsJsonSchema = z.array(AdminSchema)

const loadEnvAdmins = () => {
  const raw = process.env.SYSTEM_ADMINS_JSON?.trim()

  if (!raw) return []

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    console.error("Seed: SYSTEM_ADMINS_JSON is not valid JSON.", error)
    process.exit(1)
  }

  const result = AdminsJsonSchema.safeParse(parsed)

  if (!result.success) {
    console.error("Seed: SYSTEM_ADMINS_JSON failed validation.", result.error.flatten())
    process.exit(1)
  }

  return result.data
}

const ensureSystemCustomer = async (db: ReturnType<typeof getDbClient>["db"]) => {
  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(eq(customers.slug, "system"))
    .limit(1)

  if (existingCustomer) return existingCustomer.id

  const customerId = ulid()

  await db.insert(customers).values({
    id: customerId,
    name: "System",
    slug: "system",
  })

  return customerId
}

const ensureSystemAdmin = async (
  db: ReturnType<typeof getDbClient>["db"],
  systemCustomerId: string,
  admin: z.infer<typeof AdminSchema>,
) => {
  const [existingUser] = await db.select().from(users).where(eq(users.email, admin.email)).limit(1)

  if (existingUser) {
    if (existingUser.role === "system_admin" && existingUser.customerId === systemCustomerId) {
      console.log(`Seed: system_admin '${admin.email}' already exists, skipping.`)
      return
    }

    console.warn(
      `Seed: WARN - '${admin.email}' already exists with role='${existingUser.role}' on a different tenant. Skipping promotion.`,
    )
    return
  }

  await db.transaction(async (tx) => {
    const [existingBaUser] = await tx
      .select()
      .from(baUser)
      .where(eq(baUser.email, admin.email))
      .limit(1)

    let baUserId = existingBaUser?.id ?? null

    if (!existingBaUser) {
      baUserId = ulid()

      await tx.insert(baUser).values({
        id: baUserId,
        name: admin.name,
        email: admin.email,
        emailVerified: true,
      })
    }

    const [existingCredentialAccount] = await tx
      .select({ id: baAccount.id })
      .from(baAccount)
      .where(and(eq(baAccount.userId, baUserId!), eq(baAccount.providerId, "credential")))
      .limit(1)

    if (!existingCredentialAccount) {
      await tx.insert(baAccount).values({
        id: ulid(),
        userId: baUserId!,
        accountId: baUserId!,
        providerId: "credential",
        password: await hashPassword(admin.password),
      })
    }

    await tx.insert(users).values({
      id: ulid(),
      customerId: systemCustomerId,
      email: admin.email,
      name: admin.name,
      role: "system_admin",
      isActive: true,
      betterAuthUserId: baUserId!,
    })
  })

  console.log(`Seed: created system_admin '${admin.email}'.`)
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
    const systemCustomerId = await ensureSystemCustomer(db)
    const configuredAdmins = loadEnvAdmins()
    const allAdmins = [AdminSchema.parse(HARDCODED_BOOTSTRAP_ADMIN), ...configuredAdmins]

    const seenEmails = new Set<string>()
    const uniqueAdmins = allAdmins.filter((admin) => {
      if (seenEmails.has(admin.email)) return false
      seenEmails.add(admin.email)
      return true
    })

    const failures: string[] = []

    for (const admin of uniqueAdmins) {
      try {
        await ensureSystemAdmin(db, systemCustomerId, admin)
      } catch (error) {
        failures.push(admin.email)
        console.error(`Seed: failed to ensure system_admin '${admin.email}'.`, error)
      }
    }

    if (failures.length > 0) {
      console.error(`Seed failed for ${failures.length} admin(s): ${failures.join(", ")}`)
      process.exit(1)
    }
  } catch (error) {
    console.error("Seed failed:", error)
    process.exit(1)
  } finally {
    await queryClient.end()
  }
}

void seed()
