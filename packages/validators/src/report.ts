import { z } from "zod"

export const MetricSchema = z.enum([
  "netSales",
  "grossSales",
  "orderCount",
  "storeGrossSales",
  "uberGrossSales",
  "uberBogoRecoverable",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
])

export const DimensionSchema = z.enum([
  "locationId",
  "saleDate",
  "channel",
  "dayOfWeek",
  "week",
  "month",
])

export const ChartTypeSchema = z.enum(["bar", "line", "table"])

export const ReportConfigSchema = z.object({
  metrics: z.array(MetricSchema).min(1),
  rows: z.array(DimensionSchema),
  columns: z.array(DimensionSchema),
  filters: z.array(
    z.object({
      dimension: DimensionSchema,
      operator: z.enum(["eq", "in", "between"]),
      value: z.union([z.string(), z.array(z.string())]),
    }),
  ),
  chartType: ChartTypeSchema,
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
})

export const ReportQueryResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
  generatedAt: z.string(),
})

export const SavedReportSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  config: ReportConfigSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CreateSavedReportSchema = z.object({
  name: z.string().min(1),
  config: ReportConfigSchema,
})

export type Metric = z.infer<typeof MetricSchema>
export type Dimension = z.infer<typeof DimensionSchema>
export type ChartType = z.infer<typeof ChartTypeSchema>
export type ReportConfig = z.infer<typeof ReportConfigSchema>
export type ReportQueryResult = z.infer<typeof ReportQueryResultSchema>
export type SavedReport = z.infer<typeof SavedReportSchema>
export type CreateSavedReport = z.infer<typeof CreateSavedReportSchema>
