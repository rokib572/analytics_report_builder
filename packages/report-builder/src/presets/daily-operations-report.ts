import type { Metric, ReportConfig, ReportFilter } from "../types"
import { shiftRangeBack1Year } from "../utils"

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

  const dateRange = { from: today, to: today }
  const comparisonDateRange = shiftRangeBack1Year(dateRange)

  return {
    metrics: PRESET_METRICS,
    rows: ["locationId"],
    columns: [],
    filters,
    chartType: "table",
    dateRange,
    locationAttributes: ["daysOpen", "dateOpened"],
    inlineYtdMetrics: INLINE_YTD_METRICS,
    channelBreakdownMetrics: ["netSales"],
    comparisonDateRange,
    comparisonMetrics: ["netSales"],
    comparisonMetricLabels: { netSales: "PY Comping Sales" },
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
    description: "Location-by-location daily sales, labor, waste, and YTD snapshot.",
  },
]
