import { z } from "zod"

export const MAX_SYNC_DAYS = 3650

export const orderSyncSchema = z
  .object({
    startAt: z.string().min(1, "Start date is required"),
    endAt: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startAt)
      const end = new Date(data.endAt)
      return end >= start
    },
    { message: "End date must be on or after start date.", path: ["endAt"] },
  )
  .refine(
    (data) => {
      const start = new Date(data.startAt)
      const end = new Date(data.endAt)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= MAX_SYNC_DAYS
    },
    {
      message: `Date range must not exceed ${MAX_SYNC_DAYS} days.`,
      path: ["endAt"],
    },
  )
