import type { ReportColumn, ReportConfig } from "./types"
import { pivotReportResult, PIVOT_CARDINALITY_CAP } from "./utils"

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

const assertDeepEqual = (actual: unknown, expected: unknown, message: string) => {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message)
}

const baseConfig: ReportConfig = {
  metrics: ["netSales", "orderCount"],
  rows: ["locationId"],
  columns: ["saleDate"],
  filters: [],
  chartType: "table",
  dateRange: {
    from: "2026-04-01",
    to: "2026-04-07",
  },
}

const baseColumns: ReportColumn[] = [
  {
    kind: "dimension",
    key: "locationId",
    label: "Location",
    dimension: "locationId",
  },
  {
    kind: "dimension",
    key: "saleDate",
    label: "Sale Date",
    dimension: "saleDate",
  },
  {
    kind: "metric",
    key: "netSales",
    label: "Net Sales",
    metric: "netSales",
  },
  {
    kind: "metric",
    key: "orderCount",
    label: "Order Count",
    metric: "orderCount",
  },
]

const runPivotReportResultTests = () => {
  const flatRowsWithoutPivot = [
    { locationId: "loc-1", netSales: "100", orderCount: 2 },
    { locationId: "loc-2", netSales: "250", orderCount: 5 },
  ]

  const unchanged = pivotReportResult(
    {
      ...baseConfig,
      columns: [],
    },
    baseColumns.filter((column) => column.key !== "saleDate"),
    flatRowsWithoutPivot,
  )

  assertDeepEqual(
    unchanged.columns,
    baseColumns.filter((column) => column.key !== "saleDate"),
    "expected non-pivot columns to stay unchanged",
  )
  assertDeepEqual(unchanged.rows, flatRowsWithoutPivot, "expected non-pivot rows to stay unchanged")

  const singlePivot = pivotReportResult(baseConfig, baseColumns, [
    { locationId: "loc-1", saleDate: "2026-04-01", netSales: "100", orderCount: 2 },
    { locationId: "loc-1", saleDate: "2026-04-02", netSales: "250", orderCount: 5 },
    { locationId: "loc-1", saleDate: "2026-04-03", netSales: "80", orderCount: 1 },
  ])

  assert(
    singlePivot.columns.length === 1 + 3 * 2,
    "expected one row dimension plus three pivot coordinates times two metrics",
  )
  assertDeepEqual(
    singlePivot.columns.slice(1).map((column) => column.key),
    [
      "pivot::2026-04-01::netSales",
      "pivot::2026-04-01::orderCount",
      "pivot::2026-04-02::netSales",
      "pivot::2026-04-02::orderCount",
      "pivot::2026-04-03::netSales",
      "pivot::2026-04-03::orderCount",
    ],
    "expected deterministic pivot metric column ordering",
  )

  const sparseNestedPivot = pivotReportResult(
    {
      ...baseConfig,
      rows: ["locationId"],
      columns: ["saleDate", "dayOfWeek"],
      metrics: ["netSales"],
    },
    [
      baseColumns[0]!,
      baseColumns[1]!,
      {
        kind: "dimension",
        key: "dayOfWeek",
        label: "Day of Week",
        dimension: "dayOfWeek",
      },
      {
        kind: "metric",
        key: "netSales",
        label: "Net Sales",
        metric: "netSales",
      },
    ],
    [
      {
        locationId: "loc-1",
        saleDate: "2026-04-01",
        dayOfWeek: "Wednesday",
        netSales: "100",
      },
      {
        locationId: "loc-1",
        saleDate: "2026-04-02",
        dayOfWeek: "Thursday",
        netSales: "110",
      },
      {
        locationId: "loc-2",
        saleDate: "2026-04-01",
        dayOfWeek: "Wednesday",
        netSales: "90",
      },
    ],
  )

  assertDeepEqual(
    sparseNestedPivot.rows,
    [
      {
        locationId: "loc-1",
        "pivot::2026-04-01::Wednesday::netSales": "100",
        "pivot::2026-04-02::Thursday::netSales": "110",
      },
      {
        locationId: "loc-2",
        "pivot::2026-04-01::Wednesday::netSales": "90",
        "pivot::2026-04-02::Thursday::netSales": null,
      },
    ],
    "expected sparse pivot rows to fill missing metric cells with null",
  )

  let didThrow = false

  try {
    pivotReportResult(
      baseConfig,
      baseColumns,
      Array.from({ length: PIVOT_CARDINALITY_CAP + 1 }, (_, index) => ({
        locationId: "loc-1",
        saleDate: `2026-05-${String(index + 1).padStart(2, "0")}`,
        netSales: String(index),
        orderCount: index,
      })),
    )
  } catch (error) {
    didThrow = (error as { code?: string }).code === "BAD_REQUEST"
  }

  assert(didThrow, "expected pivot cardinality overflow to throw BAD_REQUEST")
}

runPivotReportResultTests()
