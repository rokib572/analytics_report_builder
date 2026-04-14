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
  "customer",
  "product",
  "paymentMethod",
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

export const ReportQuerySchema = ReportConfigSchema.extend({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50_000).optional(),
})

export const ReportQueryResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
  generatedAt: z.string(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(50_000),
  hasMore: z.boolean(),
  totalRows: z.number().int().min(0).optional(),
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
export const UpdateSavedReportSchema = CreateSavedReportSchema.partial()
export const ReportExportFormatSchema = z.enum(["csv", "pdf"])
export const ReportExportSchema = z.object({
  config: ReportConfigSchema,
  format: ReportExportFormatSchema,
  savedReportName: z.string().trim().max(255).optional(),
})

export type Metric = z.infer<typeof MetricSchema>
export type Dimension = z.infer<typeof DimensionSchema>
export type ChartType = z.infer<typeof ChartTypeSchema>
export type ReportConfig = z.infer<typeof ReportConfigSchema>
export type ReportQueryInput = z.infer<typeof ReportQuerySchema>
export type ReportQueryResult = z.infer<typeof ReportQueryResultSchema>
export type SavedReport = z.infer<typeof SavedReportSchema>
export type CreateSavedReport = z.infer<typeof CreateSavedReportSchema>
export type UpdateSavedReport = z.infer<typeof UpdateSavedReportSchema>
export type ReportExport = z.infer<typeof ReportExportSchema>
export type ReportExportFormat = z.infer<typeof ReportExportFormatSchema>
