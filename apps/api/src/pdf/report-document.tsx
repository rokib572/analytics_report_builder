import { Document, Page, Text, View } from "@react-pdf/renderer"
import type { ReportColumn, ReportConfig, ReportQueryResult } from "@analytics/report-builder"
import { ChartSvg } from "./chart-svg"
import { ReportTable } from "./report-table"
import { reportStyles } from "./styles"

type ReportDocumentProps = {
  config: ReportConfig
  reportName: string
  result: ReportQueryResult
  generatedAt: string
}

const PORTRAIT_CONTENT_WIDTH = 539
const LANDSCAPE_CONTENT_WIDTH = 786

const getChartOrientation = (config: ReportConfig, result: ReportQueryResult) => {
  if (config.chartType === "table" || result.rows.length === 0) return "portrait" as const

  const dimensionColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "dimension" }> => column.kind === "dimension",
  )
  const metricColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> => column.kind === "metric",
  )
  const xPointCount = result.rows.length
  const pivotDepth = metricColumns.reduce(
    (depth, column) => Math.max(depth, column.pivot?.values.length ?? 0),
    0,
  )
  const longestMetricLabel = metricColumns.reduce(
    (max, column) => Math.max(max, column.label.length),
    0,
  )
  const longestDimensionValue = result.rows.reduce((max, row) => {
    const firstValue = row[dimensionColumns[0]?.key ?? ""] ?? ""
    return Math.max(max, String(firstValue).length)
  }, 0)

  const estimatedRequiredWidth = Math.max(
    520,
    140 +
      xPointCount * 42 +
      metricColumns.length * 26 +
      pivotDepth * 40 +
      longestMetricLabel * 6 +
      longestDimensionValue * 4,
  )

  return estimatedRequiredWidth > PORTRAIT_CONTENT_WIDTH ? "landscape" : "portrait"
}

const getLocationFilterSummary = (config: ReportConfig) => {
  const locationFilter = config.filters.find((filter) => filter.dimension === "locationId")

  if (!locationFilter) return "All locations"

  if (locationFilter.operator === "between") {
    const values = Array.isArray(locationFilter.value)
      ? locationFilter.value
      : [locationFilter.value]
    return `Location filter: ${values.join(" to ")}`
  }

  const values = Array.isArray(locationFilter.value) ? locationFilter.value : [locationFilter.value]
  return `Location filter: ${values.join(", ")}`
}

export const ReportDocument = ({
  config,
  reportName,
  result,
  generatedAt,
}: ReportDocumentProps) => {
  const chartOrientation = getChartOrientation(config, result)
  const isLandscape = result.columns.length > 6 || chartOrientation === "landscape"
  const chartWidth = isLandscape ? LANDSCAPE_CONTENT_WIDTH - 24 : PORTRAIT_CONTENT_WIDTH - 24

  return (
    <Document title={reportName}>
      <Page
        size="A4"
        orientation={isLandscape ? "landscape" : "portrait"}
        style={reportStyles.page}
      >
        <View style={reportStyles.section}>
          <Text style={reportStyles.headerTitle}>{reportName}</Text>
          <Text style={reportStyles.headerMeta}>
            Date range: {config.dateRange.from} to {config.dateRange.to}
          </Text>
          <Text style={reportStyles.headerMeta}>Generated at: {generatedAt}</Text>
          <Text style={reportStyles.headerMeta}>{getLocationFilterSummary(config)}</Text>
        </View>

        {config.chartType !== "table" && result.rows.length > 0 ? (
          <View style={reportStyles.section}>
            <Text style={reportStyles.sectionTitle}>Chart</Text>
            <ChartSvg config={config} result={result} width={chartWidth} />
          </View>
        ) : null}

        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>Table</Text>
          <ReportTable result={result} />
        </View>
      </Page>
    </Document>
  )
}
