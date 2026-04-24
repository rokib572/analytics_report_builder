import {
  shiftRangeBack1Year,
  shiftRangeBack7Days,
  yearToDateRange,
  type ReportComparisons,
  type ReportQueryInput,
  type ReportSummaryKind,
  type ReportSummaryRow,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { buildReportQuery } from "./report-query"
import { buildSummaryQueryConfig } from "./build-summary-query-config"
import { computeChangePercentValues } from "./compute-change-percent-values"
import { extractSummaryValues } from "./extract-summary-values"
import { resolveCompingLocationIds } from "./resolve-comping-location-ids"

const SUMMARY_LABELS: Record<ReportSummaryKind, string> = {
  total: "Total",
  comping: "Comping",
  previousPeriod: "Previous Period",
  yearOverYear: "Year Over Year",
  yearToDate: "Year To Date",
  changePercent: "Change %",
  yearOverYearChangePercent: "Year Over Year Change %",
}

export const computeSummaryRows = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  comparisons: ReportComparisons,
): Promise<ReportSummaryRow[]> => {
  const needsTotalSummary =
    Boolean(comparisons.total) ||
    Boolean(comparisons.includeChangePercent) ||
    Boolean(comparisons.includeYearOverYearChangePercent)
  const needsPreviousPeriodSummary =
    Boolean(comparisons.previousPeriod) || Boolean(comparisons.includeChangePercent)
  const needsYearOverYearSummary =
    Boolean(comparisons.yearOverYear) || Boolean(comparisons.includeYearOverYearChangePercent)
  const needsYearToDateSummary = Boolean(comparisons.yearToDate)
  const needsCompingSummary = Boolean(comparisons.compingOnly)

  const anySummaryRequested =
    needsTotalSummary ||
    needsPreviousPeriodSummary ||
    needsYearOverYearSummary ||
    needsYearToDateSummary ||
    needsCompingSummary

  if (!anySummaryRequested) return []

  const compingLocationIds = needsCompingSummary
    ? await resolveCompingLocationIds(db, customerId, config.dateRange.from)
    : []

  const totalPromise = needsTotalSummary
    ? buildReportQuery(db, customerId, buildSummaryQueryConfig(config, {}))
    : Promise.resolve(null)
  const previousPeriodPromise = needsPreviousPeriodSummary
    ? buildReportQuery(
        db,
        customerId,
        buildSummaryQueryConfig(config, {
          dateRange: shiftRangeBack7Days(config.dateRange),
        }),
      )
    : Promise.resolve(null)
  const yearOverYearPromise = needsYearOverYearSummary
    ? buildReportQuery(
        db,
        customerId,
        buildSummaryQueryConfig(config, {
          dateRange: shiftRangeBack1Year(config.dateRange),
        }),
      )
    : Promise.resolve(null)
  const yearToDatePromise = needsYearToDateSummary
    ? buildReportQuery(
        db,
        customerId,
        buildSummaryQueryConfig(config, { dateRange: yearToDateRange(config.dateRange) }),
      )
    : Promise.resolve(null)
  const compingPromise =
    needsCompingSummary && compingLocationIds.length > 0
      ? buildReportQuery(
          db,
          customerId,
          buildSummaryQueryConfig(config, { restrictedLocationIds: compingLocationIds }),
        )
      : Promise.resolve(null)

  const [totalResult, previousPeriodResult, yearOverYearResult, yearToDateResult, compingResult] =
    await Promise.all([
      totalPromise,
      previousPeriodPromise,
      yearOverYearPromise,
      yearToDatePromise,
      compingPromise,
    ])

  const totalValues = totalResult ? extractSummaryValues(totalResult) : {}
  const previousPeriodValues = previousPeriodResult
    ? extractSummaryValues(previousPeriodResult)
    : {}
  const yearOverYearValues = yearOverYearResult ? extractSummaryValues(yearOverYearResult) : {}
  const yearToDateValues = yearToDateResult ? extractSummaryValues(yearToDateResult) : {}
  const compingValues = compingResult ? extractSummaryValues(compingResult) : {}

  const summaryRows: ReportSummaryRow[] = []

  if (comparisons.total && totalResult) {
    summaryRows.push({ kind: "total", label: SUMMARY_LABELS.total, values: totalValues })
  }
  if (comparisons.compingOnly) {
    summaryRows.push({ kind: "comping", label: SUMMARY_LABELS.comping, values: compingValues })
  }
  if (comparisons.previousPeriod && previousPeriodResult) {
    summaryRows.push({
      kind: "previousPeriod",
      label: SUMMARY_LABELS.previousPeriod,
      values: previousPeriodValues,
    })
  }
  if (comparisons.yearOverYear && yearOverYearResult) {
    summaryRows.push({
      kind: "yearOverYear",
      label: SUMMARY_LABELS.yearOverYear,
      values: yearOverYearValues,
    })
  }
  if (comparisons.yearToDate && yearToDateResult) {
    summaryRows.push({
      kind: "yearToDate",
      label: SUMMARY_LABELS.yearToDate,
      values: yearToDateValues,
    })
  }
  if (comparisons.includeChangePercent && totalResult && previousPeriodResult) {
    summaryRows.push({
      kind: "changePercent",
      label: SUMMARY_LABELS.changePercent,
      values: computeChangePercentValues(totalValues, previousPeriodValues),
    })
  }
  if (comparisons.includeYearOverYearChangePercent && totalResult && yearOverYearResult) {
    summaryRows.push({
      kind: "yearOverYearChangePercent",
      label: SUMMARY_LABELS.yearOverYearChangePercent,
      values: computeChangePercentValues(totalValues, yearOverYearValues),
    })
  }

  return summaryRows
}
