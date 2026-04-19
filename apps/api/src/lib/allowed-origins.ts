const FALLBACK_DEV_ORIGIN = "http://localhost:5173"

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "")

const getConfiguredOrigins = () => {
  const values = [process.env.BETTER_AUTH_URL, process.env.UI_BASE_URL]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizeOrigin)

  return [...new Set(values)]
}

export const allowedOrigins = (() => {
  const configuredOrigins = getConfiguredOrigins()

  if (process.env.NODE_ENV !== "production") {
    return [...new Set([...configuredOrigins, FALLBACK_DEV_ORIGIN])]
  }

  return configuredOrigins.length > 0 ? configuredOrigins : [FALLBACK_DEV_ORIGIN]
})()

export const resolveCorsOrigin = (origin?: string) => {
  if (!origin) return allowedOrigins[0] ?? FALLBACK_DEV_ORIGIN
  return allowedOrigins.includes(origin) ? origin : ""
}
