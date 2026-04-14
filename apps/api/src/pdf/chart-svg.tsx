import { Fragment } from "react"
import { Line, Path, Rect, Svg, Text, View } from "@react-pdf/renderer"
import { line as d3Line } from "d3-shape"
import { scaleBand, scaleLinear } from "d3-scale"
import {
  getChartValue,
  getReportColumnLabel,
  isMonetaryColumn,
  mergeReportDimensions,
  type ReportConfig,
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
]

type ChartSvgProps = {
  config: ReportConfig
  result: ReportQueryResult
}

type ChartDatum = {
  label: string
  metrics: Record<string, number>
}

const CHART_WIDTH = 720
const CHART_HEIGHT = 240
const PADDING_LEFT = 44
const PADDING_RIGHT = 20
const PADDING_TOP = 20
const PADDING_BOTTOM = 44

const truncateTick = (value: string) => (value.length > 12 ? `${value.slice(0, 11)}…` : value)

const getMetricColumns = (config: ReportConfig, columns: string[]) =>
  columns.filter((column) => config.metrics.includes(column as (typeof config.metrics)[number]))

const getDimensionColumn = (config: ReportConfig, columns: string[]) => {
  const dimension = mergeReportDimensions(config.rows, config.columns)[0]

  if (dimension && columns.includes(dimension)) return dimension
  return columns[0] ?? null
}

const getSeries = (config: ReportConfig, result: ReportQueryResult) => {
  const xKey = getDimensionColumn(config, result.columns)
  const metricColumns = getMetricColumns(config, result.columns)

  if (!xKey || metricColumns.length === 0) {
    return { xKey: null, metricColumns: [] as string[], data: [] as ChartDatum[] }
  }

  const data = result.rows.map((row) => ({
    label: String(row[xKey] ?? "-"),
    metrics: Object.fromEntries(
      metricColumns.map((column) => [
        column,
        Number(getChartValue(column, row[column] ?? null) ?? 0),
      ]),
    ),
  }))

  return { xKey, metricColumns, data }
}

export const ChartSvg = ({ config, result }: ChartSvgProps) => {
  const { metricColumns, data } = getSeries(config, result)

  if (config.chartType === "table" || metricColumns.length === 0 || data.length === 0) {
    return null
  }

  const chartWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const xScale = scaleBand<string>()
    .domain(data.map((item) => item.label as string))
    .range([PADDING_LEFT, PADDING_LEFT + chartWidth])
    .padding(0.2)
  const nestedScale = scaleBand<string>()
    .domain(metricColumns)
    .range([0, xScale.bandwidth()])
    .padding(0.12)
  const maxValue = Math.max(
    0,
    ...data.flatMap((item) => metricColumns.map((metric) => Number(item.metrics[metric] ?? 0))),
  )
  const yScale = scaleLinear()
    .domain([0, maxValue === 0 ? 1 : maxValue])
    .range([PADDING_TOP + chartHeight, PADDING_TOP])

  const yTicks = yScale.ticks(4)

  return (
    <View style={reportStyles.chartContainer}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
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
              {isMonetaryColumn(metricColumns[0])
                ? `$${tick.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}`
                : tick.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </Text>
          </Fragment>
        ))}

        {config.chartType === "bar"
          ? data.flatMap((item) =>
              metricColumns.map((metric, index) => {
                const groupX = xScale(item.label as string)
                const value = Number(item.metrics[metric] ?? 0)
                const x = (groupX ?? PADDING_LEFT) + (nestedScale(metric) ?? 0)
                const y = yScale(value)
                const height = PADDING_TOP + chartHeight - y

                return (
                  <Rect
                    key={`${item.label}-${metric}`}
                    x={x}
                    y={y}
                    width={nestedScale.bandwidth()}
                    height={Math.max(height, 0)}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                )
              }),
            )
          : metricColumns.map((metric, index) => {
              const path = d3Line<{ label: string }>()
                .x((item) => (xScale(item.label) ?? PADDING_LEFT) + xScale.bandwidth() / 2)
                .y((item) =>
                  yScale(
                    Number(data.find((datum) => datum.label === item.label)?.metrics[metric] ?? 0),
                  ),
                )(data.map((item) => ({ label: item.label })))

              if (!path) return null

              return (
                <Path
                  key={metric}
                  d={path}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  fill="none"
                />
              )
            })}

        {data.map((item) => {
          const x = (xScale(item.label as string) ?? PADDING_LEFT) + xScale.bandwidth() / 2
          return (
            <Text
              key={item.label as string}
              x={x}
              y={PADDING_TOP + chartHeight + 14}
              style={{ fontSize: 8, color: "#64748b" }}
              textAnchor="middle"
            >
              {truncateTick(item.label as string)}
            </Text>
          )
        })}
      </Svg>

      <View style={reportStyles.legendRow}>
        {metricColumns.map((metric, index) => (
          <View key={metric} style={reportStyles.legendItem}>
            <View
              style={[
                reportStyles.legendSwatch,
                { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] },
              ]}
            />
            <Text style={reportStyles.legendLabel}>{getReportColumnLabel(metric)}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
