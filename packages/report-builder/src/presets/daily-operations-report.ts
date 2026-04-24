import type { Metric, ReportConfig, ReportFilter } from "../types"

export type PresetChannel = {
  id: string
  squareSourceName: string
  displayName: string
}

export type DailyOperationsReportPresetContext = {
  today: string
  channels?: PresetChannel[]
}

const PRESET_METRICS: Metric[] = [
  "netSales",
  "orderCount",
  "estimatedPayrollAfterTax",
  "payrollPctOfSales",
  "templateLaborHours",
  "reportedLaborHours",
  "laborHourVariance",
  "laborHourVariancePercent",
  "costPerLaborHour",
  "reportedTrainingHours",
  "wasteCost",
  "wasteCostPctOfSales",
  "unitsSold",
]

const INLINE_YTD_METRICS: Metric[] = ["netSales", "unitsSold"]

const UBER_SOURCE_NAMES = new Set(["uber", "uber_eats", "ubereats"])

export const buildDailyOperationsReportConfig = ({
  today,
  channels,
}: DailyOperationsReportPresetContext): ReportConfig => {
  const filters: ReportFilter[] = []

  if (channels && channels.length > 0) {
    const allowedChannelIds = channels
      .filter((channel) => !UBER_SOURCE_NAMES.has(channel.squareSourceName.toLowerCase()))
      .map((channel) => channel.id)

    if (allowedChannelIds.length > 0 && allowedChannelIds.length < channels.length) {
      filters.push({
        dimension: "channel",
        operator: "in",
        value: allowedChannelIds,
      })
    }
  }

  return {
    metrics: PRESET_METRICS,
    rows: ["locationId"],
    columns: [],
    filters,
    chartType: "table",
    dateRange: { from: today, to: today },
    comparisons: {
      total: true,
      compingOnly: true,
      previousPeriod: true,
      yearOverYear: true,
      includeChangePercent: true,
      includeYearOverYearChangePercent: true,
    },
    locationAttributes: ["daysOpen", "dateOpened"],
    inlineYtdMetrics: INLINE_YTD_METRICS,
    channelBreakdownMetrics: ["netSales"],
    locationAgePartition: { enabled: true, thresholdDays: 30 },
  }
}

export type PresetId = "daily-operations-report"

export type PresetDescriptor = {
  id: PresetId
  name: string
  description: string
}

export const REPORT_PRESETS: PresetDescriptor[] = [
  {
    id: "daily-operations-report",
    name: "Daily Operations Report",
    description:
      "Location-by-location daily sales, labor, waste, and YTD snapshot with Mature vs New-store sections.",
  },
]
