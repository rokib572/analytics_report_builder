import { createHash } from "node:crypto"

export const computeContentHash = (data: Record<string, unknown>): string => {
  const sorted = JSON.stringify(data, Object.keys(data).sort())
  return createHash("sha256").update(sorted).digest("hex")
}
