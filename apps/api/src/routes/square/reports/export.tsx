import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { renderToBuffer } from "@react-pdf/renderer"
import { stringify } from "csv-stringify/sync"
import { buildReportQuery } from "@analytics/database"
import {
  formatReportCell,
  getReportColumnLabel,
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
  let columns: string[] = []
  let generatedAt = new Date().toISOString()
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
      }
    }

    page += 1
  }
}

const buildCsv = (result: ReportQueryResult) =>
  stringify(
    result.rows.map((row) =>
      Object.fromEntries(
        result.columns.map((column) => [column, formatReportCell(column, row[column] ?? null)]),
      ),
    ),
    {
      header: true,
      columns: Object.fromEntries(
        result.columns.map((column) => [column, getReportColumnLabel(column)]),
      ),
    },
  )

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
