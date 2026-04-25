import type { ReactElement } from "react"
import { Text, View } from "@react-pdf/renderer"
import {
  FIELD_LABELS,
  formatReportCell,
  formatSummaryCell,
  isMonetaryReportColumn,
  type ReportColumn,
  type ReportQueryResult,
  type ReportSummaryRow,
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

type RowRendererContext = {
  columns: ReportColumn[]
  columnWidth: string
}

const renderDataRow = (
  { columns, columnWidth }: RowRendererContext,
  row: Record<string, string | number | null>,
  key: string,
  isLastDataRow: boolean,
) => (
  <View
    key={key}
    style={[reportStyles.tableRow, ...(isLastDataRow ? [reportStyles.tableRowLast] : [])]}
    wrap={false}
  >
    {columns.map((column, columnIndex) => (
      <View
        key={`${key}-${column.key}`}
        style={[
          reportStyles.tableCell,
          { width: columnWidth },
          ...(columnIndex === columns.length - 1 ? [reportStyles.tableCellLast] : []),
        ]}
      >
        <Text
          style={[
            reportStyles.tableCellText,
            ...(column.kind === "metric" && isNumericMetricColumn(column)
              ? [reportStyles.alignRight]
              : []),
          ]}
        >
          {formatReportCell(column, row[column.key] ?? null)}
        </Text>
      </View>
    ))}
  </View>
)

const renderSummaryRow = (
  { columns, columnWidth }: RowRendererContext,
  summaryRow: ReportSummaryRow,
  key: string,
  isLastSummaryRow: boolean,
) => {
  const firstDimensionColumnIndex = columns.findIndex((candidate) => candidate.kind === "dimension")
  const labelColumnIndex = firstDimensionColumnIndex >= 0 ? firstDimensionColumnIndex : 0

  return (
    <View
      key={key}
      style={[
        reportStyles.tableSummaryRow,
        ...(isLastSummaryRow ? [reportStyles.tableRowLast] : []),
      ]}
      wrap={false}
    >
      {columns.map((column, columnIndex) => {
        const isLastColumn = columnIndex === columns.length - 1
        const isLabelCell = columnIndex === labelColumnIndex && column.kind !== "metric"
        const summaryValue =
          column.kind === "metric"
            ? formatSummaryCell(summaryRow.kind, column, summaryRow.values[column.key] ?? null)
            : isLabelCell
              ? summaryRow.label
              : ""
        return (
          <View
            key={`${key}-${column.key}`}
            style={[
              reportStyles.tableCell,
              { width: columnWidth },
              ...(isLastColumn ? [reportStyles.tableCellLast] : []),
            ]}
          >
            <Text
              style={[
                reportStyles.tableSummaryCellText,
                ...(column.kind === "metric" && isNumericMetricColumn(column)
                  ? [reportStyles.alignRight]
                  : []),
              ]}
            >
              {summaryValue}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

type BreakdownSpan = { label: string; startIndex: number; length: number }

const buildBreakdownSpans = (columns: ReportColumn[]): BreakdownSpan[] => {
  const spans: BreakdownSpan[] = []
  let current: BreakdownSpan | null = null

  columns.forEach((column, index) => {
    const label = column.kind === "metric" ? (column.breakdownGroup ?? null) : null
    if (label !== null && current && current.label === label) {
      current.length += 1
      return
    }
    if (current) spans.push(current)
    current = label !== null ? { label, startIndex: index, length: 1 } : null
  })
  if (current) spans.push(current)
  return spans
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
  const { rows: pivotHeaderRows, maxPivotDepth } = getPivotHeaderRows(pivotMetricColumns)
  const breakdownSpans = buildBreakdownSpans(result.columns)
  const hasBreakdownGroups = breakdownSpans.length > 0
  const hasNestedHeaders =
    (pivotMetricColumns.length > 0 && maxPivotDepth > 0) || hasBreakdownGroups

  const rowContext: RowRendererContext = { columns: result.columns, columnWidth }

  if (result.rows.length === 0) {
    return <Text style={reportStyles.emptyState}>No data found for the selected criteria.</Text>
  }

  return (
    <View style={reportStyles.table}>
      {hasNestedHeaders ? (
        [
          ...pivotHeaderRows.map((headerRow, rowIndex) => (
            <View key={`pivot-header-${rowIndex}`} style={reportStyles.tableHeader} fixed>
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
          ...(hasBreakdownGroups
            ? [
                <View key="breakdown-groups" style={reportStyles.tableHeader} fixed>
                  {(() => {
                    const cells: ReactElement[] = []
                    const showDimLabels = pivotHeaderRows.length === 0
                    let columnIndex = 0
                    while (columnIndex < result.columns.length) {
                      const span = breakdownSpans.find((s) => s.startIndex === columnIndex)
                      if (span) {
                        const isLast = span.startIndex + span.length === result.columns.length
                        cells.push(
                          <View
                            key={`breakdown-span-${columnIndex}`}
                            style={[
                              reportStyles.tableCell,
                              {
                                width: `${(span.length * 100) / result.columns.length}%`,
                              },
                              ...(isLast ? [reportStyles.tableCellLast] : []),
                            ]}
                          >
                            <Text style={[reportStyles.tableHeaderText, reportStyles.alignCenter]}>
                              {span.label}
                            </Text>
                          </View>,
                        )
                        columnIndex += span.length
                        continue
                      }
                      const column = result.columns[columnIndex]!
                      const isLast = columnIndex === result.columns.length - 1
                      const cellText =
                        showDimLabels && column.kind === "dimension" ? column.label : ""
                      cells.push(
                        <View
                          key={`breakdown-gap-${columnIndex}`}
                          style={[
                            reportStyles.tableCell,
                            { width: columnWidth },
                            ...(isLast ? [reportStyles.tableCellLast] : []),
                          ]}
                        >
                          <Text style={reportStyles.tableHeaderText}>{cellText}</Text>
                        </View>,
                      )
                      columnIndex += 1
                    }
                    return cells
                  })()}
                </View>,
              ]
            : []),
          <View key="header-metrics" style={reportStyles.tableHeader} fixed>
            {result.columns.map((column, index) => {
              const isLast = index === result.columns.length - 1
              const label =
                column.kind === "metric"
                  ? column.pivot
                    ? (FIELD_LABELS[column.metric] ?? column.label)
                    : column.label || (FIELD_LABELS[column.metric] ?? column.metric)
                  : column.kind === "attribute"
                    ? column.label
                    : ""
              const alignRight = column.kind === "metric" && isNumericMetricColumn(column)
              return (
                <View
                  key={`leaf-${column.key}`}
                  style={[
                    reportStyles.tableCell,
                    { width: columnWidth },
                    ...(isLast ? [reportStyles.tableCellLast] : []),
                  ]}
                >
                  <Text
                    style={[
                      reportStyles.tableHeaderText,
                      ...(alignRight ? [reportStyles.alignRight] : []),
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              )
            })}
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
                  ...(column.kind === "metric" && isNumericMetricColumn(column)
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
      {result.rows.map((row, rowIndex) => {
        const isLastDataRow =
          rowIndex === result.rows.length - 1 &&
          (!result.summaryRows || result.summaryRows.length === 0)
        return renderDataRow(rowContext, row, `row-${rowIndex}`, isLastDataRow)
      })}
      {result.summaryRows?.map((summaryRow, summaryIndex) => {
        const isLastSummaryRow = summaryIndex === (result.summaryRows?.length ?? 0) - 1
        return renderSummaryRow(
          rowContext,
          summaryRow,
          `summary-${summaryRow.kind}`,
          isLastSummaryRow,
        )
      })}
    </View>
  )
}
