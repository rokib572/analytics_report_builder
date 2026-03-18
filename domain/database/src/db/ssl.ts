const SSL_MODES = new Set(["require", "allow", "prefer", "verify-full"] as const)
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])

type DrizzleSslMode = boolean | "require" | "allow" | "prefer" | "verify-full"

const normalizeSslOverride = (value?: string): DrizzleSslMode | undefined => {
  if (!value) return undefined

  const normalized = value.trim().toLowerCase()
  if (normalized === "true") return true
  if (normalized === "false" || normalized === "disable") return false
  if (SSL_MODES.has(normalized as "require" | "allow" | "prefer" | "verify-full")) {
    return normalized as Exclude<DrizzleSslMode, boolean>
  }

  return undefined
}

export const resolveDrizzleSslMode = (
  connectionString: string,
  override = process.env.DATABASE_SSL,
): DrizzleSslMode => {
  const explicit = normalizeSslOverride(override)
  if (explicit !== undefined) return explicit

  const url = new URL(connectionString)
  const sslmode = normalizeSslOverride(url.searchParams.get("sslmode") ?? undefined)
  if (sslmode !== undefined) return sslmode

  return LOCAL_HOSTS.has(url.hostname) ? false : "prefer"
}

export const resolvePostgresClientSsl = (
  connectionString: string,
  override = process.env.DATABASE_SSL,
) => {
  return resolveDrizzleSslMode(connectionString, override)
}
