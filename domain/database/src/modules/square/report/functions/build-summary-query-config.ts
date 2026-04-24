import type { Dimension, ReportQueryInput } from "@analytics/report-builder"
import { MAX_REPORT_PAGE_SIZE } from "./util"

export const buildSummaryQueryConfig = (
  baseConfig: ReportQueryInput,
  overrides: {
    dateRange?: { from: string; to: string }
    restrictedLocationIds?: string[]
  },
): ReportQueryInput => {
  const additionalFilters = overrides.restrictedLocationIds
    ? [
        {
          dimension: "locationId" as Dimension,
          operator: "in" as const,
          value: overrides.restrictedLocationIds,
        },
      ]
    : []

  return {
    ...baseConfig,
    rows: [],
    page: 1,
    pageSize: MAX_REPORT_PAGE_SIZE,
    dateRange: overrides.dateRange ?? baseConfig.dateRange,
    filters: [...baseConfig.filters, ...additionalFilters],
    comparisons: undefined,
  }
}
