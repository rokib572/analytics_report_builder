import { createHash } from "node:crypto"

export const normalizeJsonValue = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeJsonValue(nestedValue)]),
    )
  }

  return value
}

export const computeContentHash = (data: Record<string, unknown>): string => {
  const normalized = normalizeJsonValue(data)
  const sorted = JSON.stringify(normalized)
  return createHash("sha256").update(sorted).digest("hex")
}
