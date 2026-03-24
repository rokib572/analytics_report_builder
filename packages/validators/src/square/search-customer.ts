import { z } from "zod"
import type { Square } from "square"

export const SearchSquareCustomerSchema = z.custom<Square.SearchCustomersRequest>((data) => {
  // Basic request validation
  if (data && typeof data === "object") {
    const req = data as Record<string, unknown>
    if (req.cursor && typeof req.cursor !== "string") return false
    if (req.limit && typeof req.limit !== "bigint") return false
    if (req.count && typeof req.count !== "boolean") return false
    if (req.query && typeof req.query !== "object") return false
  }
  return true
}, "Invalid SearchCustomersRequest")

export type SearchSquareCustomer = Square.SearchCustomersRequest
