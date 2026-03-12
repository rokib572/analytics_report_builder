import { z } from "zod"

export const DailySalesSchema = z.object({
  locationId: z.string(),
  saleDate: z.string(),
  grossSales: z.string(),
  totalDiscounts: z.string(),
  totalReturns: z.string(),
  netSales: z.string(),
  totalTax: z.string(),
  totalTips: z.string(),
  totalServiceCharges: z.string(),
  totalCollected: z.string(),
  storeGrossSales: z.string(),
  uberGrossSales: z.string(),
  uberBogoDiscountAmount: z.string(),
  uberBogoRecoverable: z.string(),
  orderCount: z.number(),
  syncedAt: z.string(),
  syncSource: z.string(),
})

export type DailySales = z.infer<typeof DailySalesSchema>
