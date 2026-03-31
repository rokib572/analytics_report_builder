import { Hono } from "hono"
import { validator } from "hono/validator"
import { getDailySalesSummary, getMonthlySalesChart, listLocations } from "@analytics/database"
import { dashboardSummaryQuerySchema } from "@analytics/validators"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"

const toIsoDate = (date: Date): string => date.toISOString().split("T")[0]

const getMonthRange = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
  return { dateFrom: toIsoDate(start), dateTo: toIsoDate(end) }
}

const getLastTwelveMonthsRange = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 11, 1))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
  return { dateFrom: toIsoDate(start), dateTo: toIsoDate(end) }
}

const serializeSummary = (summary: {
  netSales: bigint
  grossSales: bigint
  orderCount: number
  totalTax: bigint
  totalTips: bigint
  totalCollected: bigint
  totalDiscounts: bigint
}) => ({
  ...summary,
  netSales: String(summary.netSales),
  grossSales: String(summary.grossSales),
  totalTax: String(summary.totalTax),
  totalTips: String(summary.totalTips),
  totalCollected: String(summary.totalCollected),
  totalDiscounts: String(summary.totalDiscounts),
})

const summaryRouter = new Hono<AuthEnv>().use(requirePermission("sales", "view")).get(
  "/",
  validator("query", (input) => dashboardSummaryQuerySchema.parse(input)),
  async (context) => {
    const customerId = context.get("customerId")
    const query = context.req.valid("query")
    const baseDate = query.dateTo ? new Date(`${query.dateTo}T00:00:00.000Z`) : new Date()

    const currentMonthRange = getMonthRange(baseDate)
    const previousMonthBaseDate = new Date(
      Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() - 1, 1),
    )
    const previousMonthRange = getMonthRange(previousMonthBaseDate)
    const chartRange =
      query.dateFrom && query.dateTo
        ? { dateFrom: query.dateFrom, dateTo: query.dateTo }
        : getLastTwelveMonthsRange(baseDate)

    const [currentMonth, previousMonth, chart, locationsResult] = await Promise.all([
      getDailySalesSummary(db, customerId, currentMonthRange),
      getDailySalesSummary(db, customerId, previousMonthRange),
      getMonthlySalesChart(db, customerId, chartRange),
      listLocations(db, customerId, { page: 1, limit: 1, search: "" }),
    ])

    return context.json({
      currentMonth: serializeSummary(currentMonth),
      previousMonth: serializeSummary(previousMonth),
      chart: chart.map((row) => ({ month: row.month, total: String(row.total) })),
      activeLocations: locationsResult.totalCount,
    })
  },
)

export default summaryRouter
