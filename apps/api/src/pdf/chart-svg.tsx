import { Fragment } from "react"
import { Line, Path, Rect, Svg, Text, View } from "@react-pdf/renderer"
import { line as d3Line } from "d3-shape"
import { scaleBand, scaleLinear } from "d3-scale"
import {
  getChartValue,
  isMonetaryColumn,
  type ReportConfig,
  type ReportColumn,
  type ReportQueryResult,
} from "@analytics/report-builder"
import { reportStyles } from "./styles"

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#8b5cf6",
  "#d946ef",
  "#0891b2",
  "#ca8a04",
  "#dc2626",
  "#0f766e",
  "#9333ea",
  "#4f46e5",
  "#be123c",
]

type ChartSvgProps = {
  config: ReportConfig
  result: ReportQueryResult
  width?: number
}

type ChartDatum = {
  x: string
  values: Record<string, number>
}

const CHART_HEIGHT = 240
const PADDING_LEFT = 44
const PADDING_RIGHT = 20
const PADDING_TOP = 20
const PADDING_BOTTOM = 44
const DEFAULT_CHART_WIDTH = 720

const truncateTick = (value: string) => (value.length > 12 ? `${value.slice(0, 11)}…` : value)

const getSeries = (_config: ReportConfig, result: ReportQueryResult) => {
  const rowDimensionColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "dimension" }> => column.kind === "dimension",
  )
  const metricColumns = result.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> => column.kind === "metric",
  )
  const xKey = rowDimensionColumns[0]?.key ?? metricColumns[0]?.key ?? null

  if (!xKey || metricColumns.length === 0) {
    return {
      xKey: null,
      metricColumns: [] as Extract<ReportColumn, { kind: "metric" }>[],
      data: [] as ChartDatum[],
    }
  }

  const data = result.rows.map((row) => ({
    x: String(row[xKey] ?? "-"),
    values: Object.fromEntries(
      metricColumns.map((column) => [
        column.key,
        Number(getChartValue(column, row[column.key] ?? null) ?? 0),
      ]),
    ),
  }))

  return { xKey, metricColumns, data }
}

export const ChartSvg = ({ config, result, width }: ChartSvgProps) => {
  const { metricColumns, data } = getSeries(config, result)
  const svgWidth = width ?? DEFAULT_CHART_WIDTH

  if (config.chartType === "table" || metricColumns.length === 0 || data.length === 0) {
    return null
  }

  const chartWidth = svgWidth - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const xScale = scaleBand<string>()
    .domain(data.map((item) => item.x))
    .range([PADDING_LEFT, PADDING_LEFT + chartWidth])
    .padding(0.2)
  const nestedScale = scaleBand<string>()
    .domain(metricColumns.map((column) => column.key))
    .range([0, xScale.bandwidth()])
    .padding(0.12)
  const maxValue = Math.max(
    0,
    ...data.flatMap((item) =>
      metricColumns.map((metricColumn) => Number(item.values[metricColumn.key] ?? 0)),
    ),
  )
  const yScale = scaleLinear()
    .domain([0, maxValue === 0 ? 1 : maxValue])
    .range([PADDING_TOP + chartHeight, PADDING_TOP])

  const yTicks = yScale.ticks(4)

  return (
    <View style={reportStyles.chartContainer}>
      <Svg width={svgWidth} height={CHART_HEIGHT}>
        <Line
          x1={PADDING_LEFT}
          y1={PADDING_TOP + chartHeight}
          x2={PADDING_LEFT + chartWidth}
          y2={PADDING_TOP + chartHeight}
          stroke="#94a3b8"
          strokeWidth={1}
        />
        <Line
          x1={PADDING_LEFT}
          y1={PADDING_TOP}
          x2={PADDING_LEFT}
          y2={PADDING_TOP + chartHeight}
          stroke="#94a3b8"
          strokeWidth={1}
        />

        {yTicks.map((tick) => (
          <Fragment key={tick}>
            <Line
              x1={PADDING_LEFT}
              y1={yScale(tick)}
              x2={PADDING_LEFT + chartWidth}
              y2={yScale(tick)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <Text
              x={PADDING_LEFT - 8}
              y={yScale(tick) + 3}
              style={{ fontSize: 8, color: "#64748b" }}
              textAnchor="end"
            >
              {isMonetaryColumn(metricColumns[0].metric)
                ? `$${tick.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}`
                : tick.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </Text>
          </Fragment>
        ))}

        {config.chartType === "bar"
          ? data.flatMap((item) =>
              metricColumns.map((metricColumn, index) => {
                const groupX = xScale(item.x)
                const value = Number(item.values[metricColumn.key] ?? 0)
                const x = (groupX ?? PADDING_LEFT) + (nestedScale(metricColumn.key) ?? 0)
                const y = yScale(value)
                const height = PADDING_TOP + chartHeight - y

                return (
                  <Rect
                    key={`${item.x}-${metricColumn.key}`}
                    x={x}
                    y={y}
                    width={nestedScale.bandwidth()}
                    height={Math.max(height, 0)}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                )
              }),
            )
          : metricColumns.map((metricColumn, index) => {
              const path = d3Line<{ x: string }>()
                .x((item) => (xScale(item.x) ?? PADDING_LEFT) + xScale.bandwidth() / 2)
                .y((item) =>
                  yScale(
                    Number(data.find((datum) => datum.x === item.x)?.values[metricColumn.key] ?? 0),
                  ),
                )(data.map((item) => ({ x: item.x })))

              if (!path) return null

              return (
                <Path
                  key={metricColumn.key}
                  d={path}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  fill="none"
                />
              )
            })}

        {data.map((item) => {
          const x = (xScale(item.x) ?? PADDING_LEFT) + xScale.bandwidth() / 2
          return (
            <Text
              key={item.x}
              x={x}
              y={PADDING_TOP + chartHeight + 14}
              style={{ fontSize: 8, color: "#64748b" }}
              textAnchor="middle"
            >
              {truncateTick(item.x)}
            </Text>
          )
        })}
      </Svg>

      <View style={reportStyles.legendRow}>
        {metricColumns.map((metricColumn, index) => (
          <View key={metricColumn.key} style={reportStyles.legendItem}>
            <View
              style={[
                reportStyles.legendSwatch,
                { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] },
              ]}
            />
            <Text style={reportStyles.legendLabel}>{metricColumn.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
