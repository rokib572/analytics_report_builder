import { z } from "zod"

export const LocationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  status: z.string(),
  timezone: z.string().nullable(),
  syncedAt: z.string().nullable(),
})

export type Location = z.infer<typeof LocationSchema>
