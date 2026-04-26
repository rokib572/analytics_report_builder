import { useMemo } from "react"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import {
  FIELD_LABELS,
  formatReportCell,
  getChartValue,
  getColumnMetric,
  isMonetaryReportColumn,
  type ChartType,
  type ReportColumn,
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
  const distinctPivotMetrics = new Set(pivotMetricColumns.map((column) => column.metric))
  const useDimensionValueAsLeafHeader = distinctPivotMetrics.size === 1

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

    const lastPivotValue = column.pivot?.values[column.pivot.values.length - 1]
    const leafHeader =
      useDimensionValueAsLeafHeader && lastPivotValue
        ? formatReportCell(lastPivotValue.dimension, lastPivotValue.value)
        : (FIELD_LABELS[column.metric] ?? column.label)
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
      parentGroup.leaves.push(leafColumn(column, leafHeader, column))
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

  const hasDisplayableContent = Boolean(result && result.rows.length > 0)

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
                {(() => {
                  const leafColumns = table.getVisibleLeafColumns()
                  const columnByKey = new Map(result.columns.map((column) => [column.key, column]))
                  const orderedColumns = leafColumns
                    .map((leaf) => columnByKey.get(leaf.id))
                    .filter((column): column is ReportColumn => Boolean(column))
                  const columnLabelByKey = new Map(
                    leafColumns.map((leaf) => {
                      const header = leaf.columnDef.header
                      const resolved = typeof header === "string" ? header : String(leaf.id)
                      return [leaf.id, resolved]
                    }),
                  )
                  const hasBreakdownGroups = orderedColumns.some(
                    (column) => column.kind === "metric" && Boolean(column.breakdownGroup),
                  )

                  type TopCell = {
                    key: string
                    label: string
                    colSpan: number
                    rowSpan: number
                    alignCenter: boolean
                    alignRight: boolean
                  }
                  type LeafCell = {
                    key: string
                    label: string
                    alignRight: boolean
                  }

                  const topCells: TopCell[] = []
                  const leafCells: LeafCell[] = []

                  let cursor = 0
                  while (cursor < orderedColumns.length) {
                    const column = orderedColumns[cursor]!
                    const groupLabel =
                      column.kind === "metric" ? (column.breakdownGroup ?? null) : null
                    if (!groupLabel) {
                      const alignRight = column.kind === "metric" && isNumericMetricColumn(column)
                      const label = columnLabelByKey.get(column.key) ?? column.label
                      topCells.push({
                        key: `top-${column.key}`,
                        label,
                        colSpan: 1,
                        rowSpan: hasBreakdownGroups ? 2 : 1,
                        alignCenter: false,
                        alignRight,
                      })
                      cursor += 1
                      continue
                    }
                    const groupStart = cursor
                    while (
                      cursor < orderedColumns.length &&
                      orderedColumns[cursor]!.kind === "metric" &&
                      (orderedColumns[cursor] as Extract<ReportColumn, { kind: "metric" }>)
                        .breakdownGroup === groupLabel
                    ) {
                      const member = orderedColumns[cursor]! as Extract<
                        ReportColumn,
                        { kind: "metric" }
                      >
                      leafCells.push({
                        key: `leaf-${member.key}`,
                        label: columnLabelByKey.get(member.key) ?? member.label,
                        alignRight: isNumericMetricColumn(member),
                      })
                      cursor += 1
                    }
                    topCells.push({
                      key: `group-${groupStart}-${groupLabel}`,
                      label: groupLabel,
                      colSpan: cursor - groupStart,
                      rowSpan: 1,
                      alignCenter: true,
                      alignRight: false,
                    })
                  }

                  return (
                    <>
                      <TableRow>
                        {topCells.map((cell) => (
                          <TableHead
                            key={cell.key}
                            colSpan={cell.colSpan}
                            rowSpan={cell.rowSpan}
                            className={
                              cell.alignCenter
                                ? "text-center"
                                : cell.alignRight
                                  ? "text-right"
                                  : undefined
                            }
                          >
                            {cell.label}
                          </TableHead>
                        ))}
                      </TableRow>
                      {hasBreakdownGroups && (
                        <TableRow>
                          {leafCells.map((cell) => (
                            <TableHead
                              key={cell.key}
                              className={cell.alignRight ? "text-right" : undefined}
                            >
                              {cell.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      )}
                    </>
                  )
                })()}
              </TableHeader>
              <TableBody>
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
