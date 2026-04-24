import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { renderToBuffer } from "@react-pdf/renderer"
import { stringify } from "csv-stringify/sync"
import { buildReportQuery } from "@analytics/database"
import {
  FIELD_LABELS,
  formatReportCell,
  formatSummaryCell,
  type ReportColumn,
  type ReportConfig,
  type ReportQueryResult,
} from "@analytics/report-builder"
import { DomainError } from "@analytics/shared-libs"
import { ReportExportSchema } from "@analytics/validators"
import type { AuthEnv } from "../../../middleware/auth"
import { requirePermission } from "../../../middleware/permission"
import { db } from "../../../lib/db"
import { ReportDocument } from "../../../pdf/report-document"

const EXPORT_PAGE_SIZE = 50_000
const EXPORT_ROW_LIMIT = 500_000

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "report"

const buildExportFilename = (
  config: ReportConfig,
  format: "csv" | "pdf",
  savedReportName?: string,
) =>
  `${slugify(savedReportName ?? "report")}_${config.dateRange.from}_${config.dateRange.to}.${format}`

const collectReportRows = async (
  customerId: string,
  config: ReportConfig,
): Promise<ReportQueryResult> => {
  let page = 1
  let columns: ReportQueryResult["columns"] = []
  let generatedAt = new Date().toISOString()
  let summaryRows: ReportQueryResult["summaryRows"]
  const rows: ReportQueryResult["rows"] = []

  while (true) {
    const pageResult = await buildReportQuery(db, customerId, {
      ...config,
      page,
      pageSize: EXPORT_PAGE_SIZE,
    })

    if (columns.length === 0) {
      columns = pageResult.columns
      generatedAt = pageResult.generatedAt
      summaryRows = pageResult.summaryRows
    }

    rows.push(...pageResult.rows)

    if (rows.length > EXPORT_ROW_LIMIT) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: "Report export row ceiling exceeded",
        clientSafeMessage: "Report is too large to export - narrow your filters.",
      })
    }

    if (!pageResult.hasMore) {
      return {
        ...pageResult,
        columns,
        rows,
        generatedAt,
        page: 1,
        pageSize: rows.length,
        hasMore: false,
        totalRows: rows.length,
        ...(summaryRows && summaryRows.length > 0 ? { summaryRows } : {}),
      }
    }

    page += 1
  }
}

const buildCsvHeaderRows = (columns: ReportQueryResult["columns"]): string[][] => {
  const dimensionColumns = columns.filter(
    (column): column is Extract<ReportColumn, { kind: "dimension" }> => column.kind === "dimension",
  )
  const metricColumns = columns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> => column.kind === "metric",
  )
  const pivotMetricColumns = metricColumns.filter((column) => Boolean(column.pivot))

  if (pivotMetricColumns.length === 0) {
    return [columns.map((column) => column.label)]
  }

  const pivotDepth = pivotMetricColumns.reduce(
    (depth, column) => Math.max(depth, column.pivot?.values.length ?? 0),
    0,
  )
  const headerRows = Array.from({ length: pivotDepth + 1 }, () =>
    Array.from({ length: columns.length }, () => ""),
  )

  dimensionColumns.forEach((column, index) => {
    headerRows[0]![index] = column.label
  })

  pivotMetricColumns.forEach((column) => {
    const columnIndex = columns.findIndex((candidate) => candidate.key === column.key)
    if (columnIndex === -1) return

    column.pivot?.values.forEach(({ dimension, value }, depthIndex) => {
      headerRows[depthIndex]![columnIndex] = formatReportCell(dimension, value)
    })

    headerRows[pivotDepth]![columnIndex] = FIELD_LABELS[column.metric] ?? column.label
  })

  metricColumns
    .filter((column) => !column.pivot)
    .forEach((column) => {
      const columnIndex = columns.findIndex((candidate) => candidate.key === column.key)
      if (columnIndex === -1) return
      headerRows[pivotDepth]![columnIndex] = FIELD_LABELS[column.metric] ?? column.label
    })

  return headerRows
}

const buildCsvSummaryRows = (result: ReportQueryResult): string[][] => {
  if (!result.summaryRows || result.summaryRows.length === 0) return []

  const dimensionColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "dimension" }> => column.kind === "dimension",
  )
  const metricColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> => column.kind === "metric",
  )

  return result.summaryRows.map((summaryRow) => {
    const dimensionCells = dimensionColumns.map((_, index) => (index === 0 ? summaryRow.label : ""))
    const metricCells = metricColumns.map((column) =>
      formatSummaryCell(summaryRow.kind, column, summaryRow.values[column.key] ?? null),
    )
    return [...dimensionCells, ...metricCells]
  })
}

const buildCsv = (result: ReportQueryResult) => {
  const headerRows = buildCsvHeaderRows(result.columns)
  const dataRows = result.rows.map((row) =>
    result.columns.map((column) => formatReportCell(column, row[column.key] ?? null)),
  )
  const summaryCsvRows = buildCsvSummaryRows(result)

  return stringify([...headerRows, ...dataRows, ...summaryCsvRows])
}

const router = new Hono<AuthEnv>()
  .use(requirePermission("reports", "view"))
  .post("/", zValidator("json", ReportExportSchema), async (context) => {
    const customerId = context.get("customerId")
    const { config, format, savedReportName } = context.req.valid("json")
    const result = await collectReportRows(customerId, config)
    const filename = buildExportFilename(config, format, savedReportName)

    if (format === "csv") {
      const csv = buildCsv(result)

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    const buffer = await renderToBuffer(
      <ReportDocument
        config={config}
        reportName={savedReportName?.trim() || "Report"}
        result={result}
        generatedAt={result.generatedAt}
      />,
    )

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  })

export default router
