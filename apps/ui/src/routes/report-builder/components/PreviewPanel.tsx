import { useMemo } from "react"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import type { ChartType } from "@analytics/report-builder"
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
import { FIELD_LABELS, SUPPORTED_DIMENSIONS } from "../constants"

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

const MONETARY_METRICS = new Set([
  "netSales",
  "grossSales",
  "storeGrossSales",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
])

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

const formatCurrency = (value: string | number | null): string => {
  if (value === null) return "$0.00"

  return `$${(Number(value) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatAxisValue = (value: string | number): string =>
  typeof value === "number" ? value.toLocaleString() : value

const transformChartData = (result: ReportQueryResult): Record<string, unknown>[] =>
  result.rows.map((row) =>
    Object.fromEntries(
      result.columns.map((column) => [
        column,
        MONETARY_METRICS.has(column) ? Number(row[column] ?? 0) / 100 : row[column],
      ]),
    ),
  )

const renderCellValue = (column: string, value: string | number | null) => {
  if (MONETARY_METRICS.has(column)) return formatCurrency(value)
  if (column === "orderCount") return value === null ? "0" : String(value)
  return value ?? "-"
}

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
    () =>
      result?.columns.map((column) => ({
        accessorKey: column,
        header: FIELD_LABELS[column] ?? column,
        cell: ({ row }) => {
          const value = row.getValue(column) as string | number | null
          return (
            <div className={MONETARY_METRICS.has(column) ? "text-right" : undefined}>
              {renderCellValue(column, value)}
            </div>
          )
        },
      })) ?? [],
    [result],
  )

  const table = useReactTable({
    data: result?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const dimensionColumns =
    result?.columns.filter((column) =>
      SUPPORTED_DIMENSIONS.includes(column as (typeof SUPPORTED_DIMENSIONS)[number]),
    ) ?? []

  const metricColumns =
    result?.columns.filter((column) => MONETARY_METRICS.has(column) || column === "orderCount") ??
    []

  const firstDimension = dimensionColumns[0] ?? result?.columns[0]
  const chartData = result ? transformChartData(result) : []

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

        {!isLoading && !error && result && result.rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
            No data found for the selected criteria
          </div>
        ) : null}

        {!isLoading && !error && result && result.rows.length > 0 && chartType === "table" ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={
                          MONETARY_METRICS.has(header.column.id) ? "text-right" : undefined
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
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={MONETARY_METRICS.has(cell.column.id) ? "text-right" : undefined}
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
                    MONETARY_METRICS.has(String(name))
                      ? formatCurrency(value as string | number | null)
                      : String(value)
                  }
                />
                <Legend />
                {metricColumns.map((metric, index) => (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    name={FIELD_LABELS[metric] ?? metric}
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
                    MONETARY_METRICS.has(String(name))
                      ? formatCurrency(value as string | number | null)
                      : String(value)
                  }
                />
                <Legend />
                {metricColumns.map((metric, index) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={FIELD_LABELS[metric] ?? metric}
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
