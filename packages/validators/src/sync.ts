import { z } from "zod"

export const SyncLogSchema = z.object({
  id: z.number(),
  syncType: z.string(),
  locationId: z.string().nullable(),
  dateFrom: z.string(),
  dateTo: z.string(),
  squareCount: z.number().nullable(),
  dbCount: z.number().nullable(),
  discrepancy: z.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
})

export type SyncLog = z.infer<typeof SyncLogSchema>
