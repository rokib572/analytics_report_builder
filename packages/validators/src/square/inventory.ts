import { z } from "zod"

export const listInventoryCountsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  locationId: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
})
