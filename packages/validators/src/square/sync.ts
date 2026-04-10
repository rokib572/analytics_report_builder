import { z } from "zod"

export const SyncLogSchema = z.object({
  id: z.string(),
  syncType: z.string(),
  locationId: z.string().nullable(),
  dateFrom: z.string(),
  dateTo: z.string(),
  squareCount: z.number().nullable(),
  dbCount: z.number().nullable(),
  discrepancy: z.number().nullable(),
  ordersFetched: z.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type SyncLog = z.infer<typeof SyncLogSchema>

const MAX_SYNC_DAYS = 3650

export const SyncRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("locations") }),
  z.object({ type: z.literal("customers") }),
  z.object({ type: z.literal("catalog") }),
  z
    .object({
      type: z.literal("orders"),
      startAt: z.string().date(),
      endAt: z.string().date(),
    })
    .refine(
      (data) => {
        const start = new Date(data.startAt)
        const end = new Date(data.endAt)
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= MAX_SYNC_DAYS && diffDays > 0
      },
      { message: "Date range must be between 1 and 3650 days." },
    ),
])

export type SyncRequest = z.infer<typeof SyncRequestSchema>
