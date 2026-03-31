import { Hono } from "hono"
import { z } from "zod"
import { jitSync } from "@analytics/data-sync"
import type { DailySalesDto } from "@analytics/database"
import { requirePermission } from "../../../middleware/permission"
import type { AuthEnv } from "../../../middleware/auth"
import { db } from "../../../lib/db"

const dateParamSchema = z.iso.date()

const serializeDailySales = (row: DailySalesDto) => ({
  ...row,
  grossSales: String(row.grossSales),
  totalDiscounts: String(row.totalDiscounts),
  totalReturns: String(row.totalReturns),
  netSales: String(row.netSales),
  totalTax: String(row.totalTax),
  totalTips: String(row.totalTips),
  totalServiceCharges: String(row.totalServiceCharges),
  totalCollected: String(row.totalCollected),
  storeGrossSales: String(row.storeGrossSales),
  uberGrossSales: String(row.uberGrossSales),
  uberBogoDiscountAmount: String(row.uberBogoDiscountAmount),
  uberBogoRecoverable: String(row.uberBogoRecoverable),
})

const jitRouter = new Hono<AuthEnv>()
  .use(requirePermission("sales", "view"))
  .get("/:locationId/:date", async (context) => {
    const customerId = context.get("customerId")
    const locationId = context.req.param("locationId")
    const date = dateParamSchema.parse(context.req.param("date"))

    const data = await jitSync(db, customerId, locationId, date)

    return context.json({
      success: true,
      data: data ? serializeDailySales(data) : null,
    })
  })

export default jitRouter
