import { Text, View } from "@react-pdf/renderer"
import {
  formatReportCell,
  getReportColumnLabel,
  isMonetaryColumn,
  type ReportQueryResult,
} from "@analytics/report-builder"
import { reportStyles } from "./styles"

type ReportTableProps = {
  result: ReportQueryResult
}

export const ReportTable = ({ result }: ReportTableProps) => {
  const columnWidth = `${100 / Math.max(result.columns.length, 1)}%`

  if (result.rows.length === 0) {
    return <Text style={reportStyles.emptyState}>No data found for the selected criteria.</Text>
  }

  return (
    <View style={reportStyles.table}>
      <View style={reportStyles.tableHeader} fixed>
        {result.columns.map((column, index) => (
          <View
            key={column}
            style={[
              reportStyles.tableCell,
              { width: columnWidth },
              ...(index === result.columns.length - 1 ? [reportStyles.tableCellLast] : []),
            ]}
          >
            <Text
              style={[
                reportStyles.tableHeaderText,
                ...(isMonetaryColumn(column) || column === "orderCount"
                  ? [reportStyles.alignRight]
                  : []),
              ]}
            >
              {getReportColumnLabel(column)}
            </Text>
          </View>
        ))}
      </View>
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
              key={`${rowIndex}-${column}`}
              style={[
                reportStyles.tableCell,
                { width: columnWidth },
                ...(columnIndex === result.columns.length - 1 ? [reportStyles.tableCellLast] : []),
              ]}
            >
              <Text
                style={[
                  reportStyles.tableCellText,
                  ...(isMonetaryColumn(column) || column === "orderCount"
                    ? [reportStyles.alignRight]
                    : []),
                ]}
              >
                {formatReportCell(column, row[column] ?? null)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
