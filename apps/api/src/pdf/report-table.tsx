import { Text, View } from "@react-pdf/renderer"
import {
  FIELD_LABELS,
  formatReportCell,
  isMonetaryReportColumn,
  type ReportColumn,
  type ReportQueryResult,
} from "@analytics/report-builder"
import { reportStyles } from "./styles"

type ReportTableProps = {
  result: ReportQueryResult
}

type PivotHeaderNode = {
  id: string
  header: string
  children: PivotHeaderNode[]
  metricColumns: Extract<ReportColumn, { kind: "metric" }>[]
}

const isNumericMetricColumn = (column: Extract<ReportColumn, { kind: "metric" }>) =>
  isMonetaryReportColumn(column) || column.metric === "orderCount"

const countLeafMetrics = (node: PivotHeaderNode): number => {
  const childCount = node.children.reduce((sum, child) => sum + countLeafMetrics(child), 0)
  return childCount + node.metricColumns.length
}

const getPivotHeaderRows = (metricColumns: Extract<ReportColumn, { kind: "metric" }>[]) => {
  const rootNodes: PivotHeaderNode[] = []

  for (const column of metricColumns) {
    if (!column.pivot?.values.length) continue

    let siblings = rootNodes

    for (const [index, { dimension, value }] of column.pivot.values.entries()) {
      const nodeId = `${dimension}:${String(value)}:${index}`
      let node = siblings.find((item) => item.id === nodeId)

      if (!node) {
        node = {
          id: nodeId,
          header: formatReportCell(dimension, value),
          children: [],
          metricColumns: [],
        }
        siblings.push(node)
      }

      siblings = node.children

      if (index === column.pivot.values.length - 1) {
        node.metricColumns.push(column)
      }
    }
  }

  const maxPivotDepth = metricColumns.reduce(
    (depth, column) => Math.max(depth, column.pivot?.values.length ?? 0),
    0,
  )
  const rows = Array.from({ length: maxPivotDepth }, () => [] as PivotHeaderNode[])

  const visit = (nodes: PivotHeaderNode[], depth: number) => {
    if (depth >= rows.length) return
    rows[depth]?.push(...nodes)
    nodes.forEach((node) => visit(node.children, depth + 1))
  }

  visit(rootNodes, 0)

  const leafMetrics = (nodes: PivotHeaderNode[]): Extract<ReportColumn, { kind: "metric" }>[] =>
    nodes.flatMap((node) => [...leafMetrics(node.children), ...node.metricColumns])

  return {
    rows,
    leafMetrics: leafMetrics(rootNodes),
    maxPivotDepth,
  }
}

export const ReportTable = ({ result }: ReportTableProps) => {
  const columnWidth = `${100 / Math.max(result.columns.length, 1)}%`
  const rowDimensionColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "dimension" }> => column.kind === "dimension",
  )
  const metricColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> => column.kind === "metric",
  )
  const pivotMetricColumns = metricColumns.filter((column) => Boolean(column.pivot))
  const plainMetricColumns = metricColumns.filter((column) => !column.pivot)
  const {
    rows: pivotHeaderRows,
    leafMetrics,
    maxPivotDepth,
  } = getPivotHeaderRows(pivotMetricColumns)
  const hasNestedHeaders = pivotMetricColumns.length > 0 && maxPivotDepth > 0
  const metricHeaderRow = leafMetrics.length > 0 ? leafMetrics : plainMetricColumns

  if (result.rows.length === 0) {
    return <Text style={reportStyles.emptyState}>No data found for the selected criteria.</Text>
  }

  return (
    <View style={reportStyles.table}>
      {hasNestedHeaders ? (
        [
          ...pivotHeaderRows.map((headerRow, rowIndex) => (
            <View key={`header-group-${rowIndex}`} style={reportStyles.tableHeader} fixed>
              {rowDimensionColumns.map((column, columnIndex) => (
                <View
                  key={`${rowIndex}-${column.key}`}
                  style={[
                    reportStyles.tableCell,
                    { width: columnWidth },
                    ...(columnIndex === result.columns.length - 1 && headerRow.length === 0
                      ? [reportStyles.tableCellLast]
                      : []),
                  ]}
                >
                  <Text style={reportStyles.tableHeaderText}>
                    {rowIndex === 0 ? column.label : ""}
                  </Text>
                </View>
              ))}
              {headerRow.map((node, index) => {
                const isLastCell = index === headerRow.length - 1
                return (
                  <View
                    key={`${rowIndex}-${node.id}`}
                    style={[
                      reportStyles.tableCell,
                      { width: `${(countLeafMetrics(node) * 100) / result.columns.length}%` },
                      ...(isLastCell ? [reportStyles.tableCellLast] : []),
                    ]}
                  >
                    <Text style={reportStyles.tableHeaderText}>{node.header}</Text>
                  </View>
                )
              })}
            </View>
          )),
          <View key="header-metrics" style={reportStyles.tableHeader} fixed>
            {rowDimensionColumns.map((column, columnIndex) => (
              <View
                key={`metric-row-${column.key}`}
                style={[
                  reportStyles.tableCell,
                  { width: columnWidth },
                  ...(columnIndex === result.columns.length - 1 && metricHeaderRow.length === 0
                    ? [reportStyles.tableCellLast]
                    : []),
                ]}
              >
                <Text style={reportStyles.tableHeaderText} />
              </View>
            ))}
            {metricHeaderRow.map((column, index) => (
              <View
                key={column.key}
                style={[
                  reportStyles.tableCell,
                  { width: columnWidth },
                  ...(index === metricHeaderRow.length - 1 ? [reportStyles.tableCellLast] : []),
                ]}
              >
                <Text
                  style={[
                    reportStyles.tableHeaderText,
                    ...(isNumericMetricColumn(column) ? [reportStyles.alignRight] : []),
                  ]}
                >
                  {FIELD_LABELS[column.metric] ?? column.label}
                </Text>
              </View>
            ))}
          </View>,
        ]
      ) : (
        <View style={reportStyles.tableHeader} fixed>
          {result.columns.map((column, index) => (
            <View
              key={column.key}
              style={[
                reportStyles.tableCell,
                { width: columnWidth },
                ...(index === result.columns.length - 1 ? [reportStyles.tableCellLast] : []),
              ]}
            >
              <Text
                style={[
                  reportStyles.tableHeaderText,
                  ...(column.kind === "metric" &&
                  (isMonetaryReportColumn(column) || column.metric === "orderCount")
                    ? [reportStyles.alignRight]
                    : []),
                ]}
              >
                {column.label}
              </Text>
            </View>
          ))}
        </View>
      )}
      {result.rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            reportStyles.tableRow,
            ...(rowIndex === result.rows.length - 1 ? [reportStyles.tableRowLast] : []),
          ]}
          wrap={false}
        >
          {result.columns.map((column, columnIndex) => (
            <View
              key={`${rowIndex}-${column.key}`}
              style={[
                reportStyles.tableCell,
                { width: columnWidth },
                ...(columnIndex === result.columns.length - 1 ? [reportStyles.tableCellLast] : []),
              ]}
            >
              <Text
                style={[
                  reportStyles.tableCellText,
                  ...(column.kind === "metric" &&
                  (isMonetaryReportColumn(column) || column.metric === "orderCount")
                    ? [reportStyles.alignRight]
                    : []),
                ]}
              >
                {formatReportCell(column, row[column.key] ?? null)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
