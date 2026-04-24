import { useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  FIELD_LABELS,
  formatReportCell,
  formatSummaryCell,
  getChartValue,
  getColumnMetric,
  isMonetaryReportColumn,
  type ChartType,
  type ReportColumn,
  type ReportSection,
} from "@analytics/report-builder"
import type { ReportQueryResult } from "@analytics/validators"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@analytics/ui-shared"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
type PreviewPanelProps = {
  result: ReportQueryResult | undefined
  chartType: ChartType
  isLoading: boolean
  error: Error | null
  onLoadMore: () => void
  isLoadingMore: boolean
  onNextPage: () => void
  onPreviousPage: () => void
}

type PreviewRow = Record<string, string | number | null>
type PreviewColumnMeta = {
  metricColumn?: Extract<ReportColumn, { kind: "metric" }>
}
type PivotColumnGroup = {
  id: string
  header: string
  children: Map<string, PivotColumnGroup>
  leaves: ColumnDef<PreviewRow>[]
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#8b5cf6",
  "#d946ef",
  "#0891b2",
  "#ca8a04",
  "#dc2626",
]

const formatAxisValue = (value: string | number): string =>
  typeof value === "number" ? value.toLocaleString("en-US") : value

const isNumericMetricColumn = (column: Extract<ReportColumn, { kind: "metric" }>) =>
  isMonetaryReportColumn(column) || column.metric === "orderCount"

const buildPreviewColumns = (reportColumns: ReportColumn[]): ColumnDef<PreviewRow>[] => {
  const rowDimensionColumns = reportColumns.filter(
    (column): column is Extract<ReportColumn, { kind: "dimension" }> => column.kind === "dimension",
  )
  const attributeColumns = reportColumns.filter(
    (column): column is Extract<ReportColumn, { kind: "attribute" }> => column.kind === "attribute",
  )
  const pivotMetricColumns = reportColumns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> =>
      column.kind === "metric" && Boolean(column.pivot),
  )
  const unpivotedMetricColumns = reportColumns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> =>
      column.kind === "metric" && !column.pivot,
  )

  const leafColumn = (
    column: ReportColumn,
    header: string,
    metricColumn?: Extract<ReportColumn, { kind: "metric" }>,
  ): ColumnDef<PreviewRow> => ({
    accessorKey: column.key,
    header,
    meta: metricColumn ? ({ metricColumn } satisfies PreviewColumnMeta) : undefined,
    cell: ({ row }) => {
      const value = row.getValue(column.key) as string | number | null
      const metric = getColumnMetric(column)
      return (
        <div
          className={
            metricColumn && isNumericMetricColumn(metricColumn)
              ? "text-right"
              : metric === "orderCount"
                ? "text-right"
                : undefined
          }
        >
          {formatReportCell(column, value)}
        </div>
      )
    },
  })

  const pivotRoots = new Map<string, PivotColumnGroup>()

  for (const column of pivotMetricColumns) {
    let siblings = pivotRoots

    column.pivot?.values.forEach(({ dimension, value }, index) => {
      const path = `${dimension}:${String(value)}:${index}`
      const existing = siblings.get(path)

      if (existing) {
        siblings = existing.children
        return
      }

      const nextGroup: PivotColumnGroup = {
        id: path,
        header: formatReportCell(dimension, value),
        children: new Map(),
        leaves: [],
      }

      siblings.set(path, nextGroup)
      siblings = nextGroup.children
    })

    const metricHeader = FIELD_LABELS[column.metric] ?? column.label
    const parentGroup = column.pivot?.values.length
      ? column.pivot.values.reduce<PivotColumnGroup | null>(
          (group, { dimension, value }, index) => {
            const path = `${dimension}:${String(value)}:${index}`
            return (group ? group.children : pivotRoots).get(path) ?? null
          },
          null,
        )
      : null

    if (parentGroup) {
      parentGroup.leaves.push(leafColumn(column, metricHeader, column))
    }
  }

  const materializeGroups = (groups: Map<string, PivotColumnGroup>): ColumnDef<PreviewRow>[] =>
    [...groups.values()].map((group) => {
      const nestedChildren = materializeGroups(group.children)
      return {
        id: group.id,
        header: group.header,
        columns: [...nestedChildren, ...group.leaves],
      }
    })

  const groupedUnpivotedColumns: ColumnDef<PreviewRow>[] = []
  let cursor = 0
  while (cursor < unpivotedMetricColumns.length) {
    const current = unpivotedMetricColumns[cursor]!
    if (!current.breakdownGroup) {
      groupedUnpivotedColumns.push(
        leafColumn(
          current,
          current.label || (FIELD_LABELS[current.metric] ?? current.metric),
          current,
        ),
      )
      cursor += 1
      continue
    }
    const groupLabel = current.breakdownGroup
    const members: Extract<ReportColumn, { kind: "metric" }>[] = []
    while (
      cursor < unpivotedMetricColumns.length &&
      unpivotedMetricColumns[cursor]!.breakdownGroup === groupLabel
    ) {
      members.push(unpivotedMetricColumns[cursor]!)
      cursor += 1
    }
    groupedUnpivotedColumns.push({
      id: `breakdown-group-${groupLabel}-${members[0]!.key}`,
      header: groupLabel,
      columns: members.map((member) =>
        leafColumn(member, member.label || (FIELD_LABELS[member.metric] ?? member.metric), member),
      ),
    })
  }

  return [
    ...rowDimensionColumns.map((column) => leafColumn(column, column.label)),
    ...attributeColumns.map((column) =>
      leafColumn(column, column.label || (FIELD_LABELS[column.attribute] ?? column.attribute)),
    ),
    ...materializeGroups(pivotRoots),
    ...groupedUnpivotedColumns,
  ]
}

type SectionBodyProps = {
  section: ReportSection
  leafColumns: Column<PreviewRow, unknown>[]
}

const SectionBody = ({ section, leafColumns }: SectionBodyProps) => {
  const columnCount = leafColumns.length

  return (
    <>
      <TableRow className="bg-muted font-semibold">
        <TableCell colSpan={columnCount || 1}>{section.label}</TableCell>
      </TableRow>
      {section.rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={columnCount || 1} className="text-sm text-muted-foreground">
            No rows in this section.
          </TableCell>
        </TableRow>
      ) : (
        section.rows.map((row, rowIndex) => (
          <TableRow key={`${section.key}-${rowIndex}`}>
            {leafColumns.map((leafColumn) => {
              const leafMeta = leafColumn.columnDef.meta as PreviewColumnMeta | undefined
              const metricColumnForCell = leafMeta?.metricColumn
              const cellKey = leafColumn.id
              const rawValue = row[cellKey] ?? null
              return (
                <TableCell
                  key={`${section.key}-${rowIndex}-${cellKey}`}
                  className={
                    metricColumnForCell && isNumericMetricColumn(metricColumnForCell)
                      ? "text-right"
                      : undefined
                  }
                >
                  {metricColumnForCell
                    ? formatReportCell(metricColumnForCell, rawValue)
                    : rawValue === null
                      ? "-"
                      : String(rawValue)}
                </TableCell>
              )
            })}
          </TableRow>
        ))
      )}
      {section.summaryRows?.map((summaryRow) => (
        <TableRow key={`${section.key}-${summaryRow.kind}`} className="bg-muted/50 font-semibold">
          {leafColumns.map((leafColumn, leafIndex) => {
            const leafMeta = leafColumn.columnDef.meta as PreviewColumnMeta | undefined
            const metricColumnForCell = leafMeta?.metricColumn
            const cellKey = leafColumn.id
            const metricCellValue = metricColumnForCell
              ? (summaryRow.values[cellKey] ?? null)
              : null
            const labelCellValue = leafIndex === 0 ? summaryRow.label : ""
            return (
              <TableCell
                key={`${section.key}-${summaryRow.kind}-${cellKey}`}
                className={
                  metricColumnForCell && isNumericMetricColumn(metricColumnForCell)
                    ? "text-right"
                    : undefined
                }
              >
                {metricColumnForCell
                  ? formatSummaryCell(summaryRow.kind, metricColumnForCell, metricCellValue)
                  : labelCellValue}
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}

const transformChartData = (result: ReportQueryResult): Record<string, unknown>[] =>
  result.rows.map((row) =>
    Object.fromEntries(
      result.columns.map((column) => [column.key, getChartValue(column, row[column.key] ?? null)]),
    ),
  )

export const PreviewPanel = ({
  result,
  chartType,
  isLoading,
  error,
  onLoadMore,
  isLoadingMore,
  onNextPage,
  onPreviousPage,
}: PreviewPanelProps) => {
  const columns = useMemo<ColumnDef<PreviewRow>[]>(
    () => (result ? buildPreviewColumns(result.columns) : []),
    [result],
  )

  const table = useReactTable({
    data: result?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const dimensionColumns =
    result?.columns.filter(
      (column): column is Extract<ReportColumn, { kind: "dimension" }> =>
        column.kind === "dimension",
    ) ?? []

  const metricColumns =
    result?.columns.filter(
      (column): column is Extract<ReportColumn, { kind: "metric" }> => column.kind === "metric",
    ) ?? []

  const firstDimension = dimensionColumns[0]?.key ?? metricColumns[0]?.key
  const chartData = result ? transformChartData(result) : []

  const hasSectionsEnabled = (result?.sections?.length ?? 0) > 0
  const overallSummaryHasContent = (result?.summaryRows?.length ?? 0) > 0
  const hasDisplayableContent = Boolean(
    result && (result.rows.length > 0 || hasSectionsEnabled || overallSummaryHasContent),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          {chartType === "table"
            ? "Table previews can append additional pages without reloading prior rows."
            : "Charts render the current page only to keep preview data bounded."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!result && !isLoading && !error ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
            Select metrics and a date range to preview results
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

        {!isLoading && !error && result && !hasDisplayableContent ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
            No data found for the selected criteria
          </div>
        ) : null}

        {!isLoading && !error && result && hasDisplayableContent && chartType === "table" ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={
                          !header.subHeaders.length &&
                          (header.column.columnDef.meta as PreviewColumnMeta | undefined)
                            ?.metricColumn &&
                          isNumericMetricColumn(
                            (header.column.columnDef.meta as PreviewColumnMeta).metricColumn!,
                          )
                            ? "text-right"
                            : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {result.sections && result.sections.length > 0 ? (
                  result.sections.map((section) => (
                    <SectionBody
                      key={section.key}
                      section={section}
                      leafColumns={table.getVisibleLeafColumns()}
                    />
                  ))
                ) : (
                  <>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={
                              (cell.column.columnDef.meta as PreviewColumnMeta | undefined)
                                ?.metricColumn &&
                              isNumericMetricColumn(
                                (cell.column.columnDef.meta as PreviewColumnMeta).metricColumn!,
                              )
                                ? "text-right"
                                : undefined
                            }
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {result.summaryRows && result.summaryRows.length > 0
                      ? result.summaryRows.map((summaryRow) => (
                          <TableRow
                            key={`summary-${summaryRow.kind}`}
                            className="bg-muted/50 font-semibold"
                          >
                            {table.getVisibleLeafColumns().map((leafColumn, leafIndex) => {
                              const leafMeta = leafColumn.columnDef.meta as
                                | PreviewColumnMeta
                                | undefined
                              const metricColumnForCell = leafMeta?.metricColumn
                              const cellKey = leafColumn.id
                              const metricCellValue = metricColumnForCell
                                ? (summaryRow.values[cellKey] ?? null)
                                : null
                              const labelCellValue = leafIndex === 0 ? summaryRow.label : ""
                              return (
                                <TableCell
                                  key={`${summaryRow.kind}-${cellKey}`}
                                  className={
                                    metricColumnForCell &&
                                    isNumericMetricColumn(metricColumnForCell)
                                      ? "text-right"
                                      : undefined
                                  }
                                >
                                  {metricColumnForCell
                                    ? formatSummaryCell(
                                        summaryRow.kind,
                                        metricColumnForCell,
                                        metricCellValue,
                                      )
                                    : labelCellValue}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))
                      : null}
                  </>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Loaded {result.rows.length.toLocaleString()} row(s)
                {typeof result.totalRows === "number"
                  ? ` of ${result.totalRows.toLocaleString()}`
                  : ""}
              </span>
              {result.hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Load More"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isLoading &&
        !error &&
        result &&
        result.rows.length > 0 &&
        chartType === "bar" &&
        firstDimension ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={firstDimension} />
                <YAxis tickFormatter={formatAxisValue} />
                <Tooltip
                  formatter={(value, name) =>
                    formatReportCell(
                      metricColumns.find((column) => column.key === String(name)) ?? String(name),
                      value as string | number | null,
                    )
                  }
                />
                <Legend />
                {metricColumns.map((metricColumn, index) => (
                  <Bar
                    key={metricColumn.key}
                    dataKey={metricColumn.key}
                    name={metricColumn.label}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onPreviousPage}
                disabled={result.page === 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onNextPage}
                disabled={!result.hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading &&
        !error &&
        result &&
        result.rows.length > 0 &&
        chartType === "line" &&
        firstDimension ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={firstDimension} />
                <YAxis tickFormatter={formatAxisValue} />
                <Tooltip
                  formatter={(value, name) =>
                    formatReportCell(
                      metricColumns.find((column) => column.key === String(name)) ?? String(name),
                      value as string | number | null,
                    )
                  }
                />
                <Legend />
                {metricColumns.map((metricColumn, index) => (
                  <Line
                    key={metricColumn.key}
                    type="monotone"
                    dataKey={metricColumn.key}
                    name={metricColumn.label}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onPreviousPage}
                disabled={result.page === 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onNextPage}
                disabled={!result.hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
