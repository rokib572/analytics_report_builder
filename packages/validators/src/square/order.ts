import { z } from "zod"

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  locationId: z.string().min(1).optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
  state: z.string().min(1).optional(),
})
