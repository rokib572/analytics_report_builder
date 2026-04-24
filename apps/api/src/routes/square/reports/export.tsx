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
  let sections: ReportQueryResult["sections"]
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
      sections = pageResult.sections
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
        ...(sections && sections.length > 0 ? { sections } : {}),
      }
    }

    page += 1
  }
}

const buildCsvHeaderRows = (columns: ReportQueryResult["columns"]): string[][] => {
  const dimensionColumns = columns.filter(
    (column): column is Extract<ReportColumn, { kind: "dimension" }> => column.kind === "dimension",
  )
  const attributeColumns = columns.filter(
    (column): column is Extract<ReportColumn, { kind: "attribute" }> => column.kind === "attribute",
  )
  const metricColumns = columns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> => column.kind === "metric",
  )
  const pivotMetricColumns = metricColumns.filter((column) => Boolean(column.pivot))
  const hasBreakdownGroups = metricColumns.some((column) => Boolean(column.breakdownGroup))

  if (pivotMetricColumns.length === 0 && !hasBreakdownGroups) {
    return [columns.map((column) => column.label)]
  }

  const pivotDepth = pivotMetricColumns.reduce(
    (depth, column) => Math.max(depth, column.pivot?.values.length ?? 0),
    0,
  )
  const headerRowCount = Math.max(1, pivotDepth) + 1
  const headerRows = Array.from({ length: headerRowCount }, () =>
    Array.from({ length: columns.length }, () => ""),
  )
  const leafRowIndex = headerRowCount - 1

  dimensionColumns.forEach((column) => {
    const columnIndex = columns.findIndex((candidate) => candidate.key === column.key)
    if (columnIndex === -1) return
    headerRows[0]![columnIndex] = column.label
  })

  attributeColumns.forEach((column) => {
    const columnIndex = columns.findIndex((candidate) => candidate.key === column.key)
    if (columnIndex === -1) return
    headerRows[leafRowIndex]![columnIndex] = column.label
  })

  pivotMetricColumns.forEach((column) => {
    const columnIndex = columns.findIndex((candidate) => candidate.key === column.key)
    if (columnIndex === -1) return

    column.pivot?.values.forEach(({ dimension, value }, depthIndex) => {
      headerRows[depthIndex]![columnIndex] = formatReportCell(dimension, value)
    })

    headerRows[leafRowIndex]![columnIndex] = FIELD_LABELS[column.metric] ?? column.label
  })

  metricColumns
    .filter((column) => !column.pivot)
    .forEach((column) => {
      const columnIndex = columns.findIndex((candidate) => candidate.key === column.key)
      if (columnIndex === -1) return
      headerRows[leafRowIndex]![columnIndex] =
        column.label || (FIELD_LABELS[column.metric] ?? column.metric)
    })

  // Emit breakdown-group parent headers on the top row across the span of each group.
  if (hasBreakdownGroups) {
    let groupStart: number | null = null
    let currentGroup: string | null = null
    const flushGroup = (endExclusive: number) => {
      if (currentGroup === null || groupStart === null) return
      headerRows[0]![groupStart] = currentGroup
      for (let i = groupStart + 1; i < endExclusive; i += 1) {
        headerRows[0]![i] = ""
      }
    }

    columns.forEach((column, columnIndex) => {
      const group = column.kind === "metric" ? (column.breakdownGroup ?? null) : null
      if (group !== currentGroup) {
        flushGroup(columnIndex)
        currentGroup = group
        groupStart = group !== null ? columnIndex : null
      }
    })
    flushGroup(columns.length)
  }

  return headerRows
}

const buildCsvSummaryRowsFrom = (
  columns: ReportQueryResult["columns"],
  summaryRows: ReportQueryResult["summaryRows"],
): string[][] => {
  if (!summaryRows || summaryRows.length === 0) return []

  const labelColumnIndex = columns.findIndex((column) => column.kind === "dimension")

  return summaryRows.map((summaryRow) =>
    columns.map((column, columnIndex) => {
      if (column.kind === "metric") {
        return formatSummaryCell(summaryRow.kind, column, summaryRow.values[column.key] ?? null)
      }
      if (column.kind === "dimension" && columnIndex === labelColumnIndex) {
        return summaryRow.label
      }
      return ""
    }),
  )
}

const buildCsvDataRows = (
  columns: ReportQueryResult["columns"],
  rows: ReportQueryResult["rows"],
): string[][] =>
  rows.map((row) => columns.map((column) => formatReportCell(column, row[column.key] ?? null)))

const buildCsvSectionLabelRow = (
  columns: ReportQueryResult["columns"],
  label: string,
): string[] => {
  const cells = columns.map(() => "")
  cells[0] = label
  return cells
}

const buildCsv = (result: ReportQueryResult) => {
  const headerRows = buildCsvHeaderRows(result.columns)

  if (result.sections && result.sections.length > 0) {
    const allRows: string[][] = [...headerRows]
    result.sections.forEach((section, sectionIndex) => {
      if (sectionIndex > 0) allRows.push(result.columns.map(() => ""))
      allRows.push(buildCsvSectionLabelRow(result.columns, section.label))
      allRows.push(...buildCsvDataRows(result.columns, section.rows))
      allRows.push(...buildCsvSummaryRowsFrom(result.columns, section.summaryRows))
    })
    return stringify(allRows)
  }

  const dataRows = buildCsvDataRows(result.columns, result.rows)
  const summaryCsvRows = buildCsvSummaryRowsFrom(result.columns, result.summaryRows)

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
