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
  "reportedLaborHours",
  "reportedTrainingHours",
  "estimatedPayrollAfterTax",
  "costPerLaborHour",
  "templateLaborHours",
  "laborHourVariance",
  "laborHourVariancePercent",
  "payrollPctOfSales",
  "wasteItems",
  "wasteCost",
  "wasteCostPctOfSales",
  "unitsSold",
  "salesYoyChangePercent",
])

export const DimensionSchema = z.enum([
  "locationId",
  "saleDate",
  "channel",
  "dayOfWeek",
  "year",
  "week",
  "month",
  "customer",
  "product",
  "productCategory",
  "paymentMethod",
  "jobTitle",
])

export const LocationAttributeSchema = z.enum(["daysOpen", "dateOpened"])

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
  locationAttributes: z.array(LocationAttributeSchema).optional(),
  inlineYtdMetrics: z.array(MetricSchema).optional(),
  channelBreakdownMetrics: z.array(MetricSchema).optional(),
  comparisonDateRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  comparisonMetrics: z.array(MetricSchema).optional(),
  comparisonYtdMetrics: z.array(MetricSchema).optional(),
  comparisonYoyMetrics: z.array(MetricSchema).optional(),
  comparisonMetricLabels: z.record(z.string(), z.string()).optional(),
  extraColumnOrder: z
    .array(
      z.object({
        kind: z.enum([
          "metric",
          "inlineYtd",
          "comparison",
          "comparisonYtd",
          "comparisonYoy",
          "inlineYtdProducts",
        ]),
        metric: MetricSchema,
      }),
    )
    .optional(),
  inlineYtdProducts: z.boolean().optional(),
  payrollTaxRatePercent: z.number().min(0).max(100).optional(),
})

export const ReportQuerySchema = ReportConfigSchema.extend({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50_000).optional(),
})

export const PivotCoordinateSchema = z.object({
  values: z.array(
    z.object({
      dimension: DimensionSchema,
      value: z.union([z.string(), z.number()]),
    }),
  ),
})

export const ReportColumnSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("dimension"),
    key: z.string(),
    label: z.string(),
    dimension: DimensionSchema,
  }),
  z.object({
    kind: z.literal("metric"),
    key: z.string(),
    label: z.string(),
    metric: MetricSchema,
    pivot: PivotCoordinateSchema.optional(),
    breakdownGroup: z.string().optional(),
  }),
  z.object({
    kind: z.literal("attribute"),
    key: z.string(),
    label: z.string(),
    attribute: LocationAttributeSchema,
  }),
])

export const ReportQueryResultSchema = z.object({
  columns: z.array(ReportColumnSchema),
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
export type LocationAttribute = z.infer<typeof LocationAttributeSchema>
export type ChartType = z.infer<typeof ChartTypeSchema>
export type ReportConfig = z.infer<typeof ReportConfigSchema>
export type ReportQueryInput = z.infer<typeof ReportQuerySchema>
export type ReportQueryResult = z.infer<typeof ReportQueryResultSchema>
export type SavedReport = z.infer<typeof SavedReportSchema>
export type CreateSavedReport = z.infer<typeof CreateSavedReportSchema>
export type UpdateSavedReport = z.infer<typeof UpdateSavedReportSchema>
export type ReportExport = z.infer<typeof ReportExportSchema>
export type ReportExportFormat = z.infer<typeof ReportExportFormatSchema>
