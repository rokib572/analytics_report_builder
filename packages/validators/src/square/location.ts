import { z } from "zod"

export const LocationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  squareId: z.string(),
  name: z.string(),
  address: z.unknown().nullable(),
  status: z.string(),
  timezone: z.string().nullable(),
  contentHash: z.string(),
  syncedAt: z.string().nullable(),
})

export type Location = z.infer<typeof LocationSchema>
