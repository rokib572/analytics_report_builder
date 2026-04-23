import { z } from "zod"

export const LocationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  squareId: z.string(),
  name: z.string(),
  address: z.unknown().nullable(),
  status: z.string(),
  timezone: z.string().nullable(),
  openedAt: z.string().nullable(),
  contentHash: z.string(),
  syncedAt: z.string().nullable(),
})

export const listSquareLocationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().default(""), // search by location name, optional, defaults to empty string (no search)
})

export const updateLocationOpenedAtSchema = z.object({
  openedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "openedAt must be an ISO date (YYYY-MM-DD)")
    .nullable(),
})

export type Location = z.infer<typeof LocationSchema>
export type ListSquareLocationQuery = z.infer<typeof listSquareLocationQuerySchema>
export type UpdateLocationOpenedAtPayload = z.infer<typeof updateLocationOpenedAtSchema>
