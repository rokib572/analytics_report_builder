import { Document, Page, Text, View } from "@react-pdf/renderer"
import type { ReportConfig, ReportQueryResult } from "@analytics/report-builder"
import { ChartSvg } from "./chart-svg"
import { ReportTable } from "./report-table"
import { reportStyles } from "./styles"

type ReportDocumentProps = {
  config: ReportConfig
  reportName: string
  result: ReportQueryResult
  generatedAt: string
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
  const isLandscape = result.columns.length > 6

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
            <ChartSvg config={config} result={result} />
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
