import type { Metric, ReportColumn, ReportQueryResult } from "@analytics/report-builder"

type MetricColumn = Extract<ReportColumn, { kind: "metric" }>

type ColumnGroup = {
  anchor: Metric | null
  columns: ReportColumn[]
}

export const reorderColumnsByMetricSequence = (
  result: ReportQueryResult,
  metricSequence: Metric[],
): ReportQueryResult => {
  if (metricSequence.length === 0) return result

  const dimensionColumns: ReportColumn[] = []
  const attributeColumns: ReportColumn[] = []
  const metricColumns: MetricColumn[] = []

  for (const column of result.columns) {
    if (column.kind === "dimension") dimensionColumns.push(column)
    else if (column.kind === "attribute") attributeColumns.push(column)
    else metricColumns.push(column)
  }

  if (metricColumns.some((column) => Boolean(column.pivot))) return result

  const sequenceSet = new Set<Metric>(metricSequence)
  const groups: ColumnGroup[] = []
  let currentGroup: ColumnGroup | null = null

  for (const column of metricColumns) {
    const isAnchor = column.key === column.metric && sequenceSet.has(column.metric)
    if (isAnchor) {
      currentGroup = { anchor: column.metric, columns: [column] }
      groups.push(currentGroup)
      continue
    }
    if (currentGroup) {
      currentGroup.columns.push(column)
      continue
    }
    groups.push({ anchor: null, columns: [column] })
  }

  const orphanGroups = groups.filter((group) => group.anchor === null)
  const anchorGroups = groups.filter((group) => group.anchor !== null)
  const anchorByMetric = new Map(anchorGroups.map((group) => [group.anchor as Metric, group]))

  const orderedAnchorGroups: ColumnGroup[] = []
  const placedAnchors = new Set<Metric>()

  for (const metric of metricSequence) {
    const group = anchorByMetric.get(metric)
    if (group && !placedAnchors.has(metric)) {
      orderedAnchorGroups.push(group)
      placedAnchors.add(metric)
    }
  }

  for (const group of anchorGroups) {
    if (group.anchor && !placedAnchors.has(group.anchor)) {
      orderedAnchorGroups.push(group)
      placedAnchors.add(group.anchor)
    }
  }

  const reorderedMetricColumns = [
    ...orphanGroups.flatMap((group) => group.columns),
    ...orderedAnchorGroups.flatMap((group) => group.columns),
  ]

  return {
    ...result,
    columns: [...dimensionColumns, ...reorderedMetricColumns, ...attributeColumns],
  }
}
