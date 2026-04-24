import { eq } from "drizzle-orm"
import {
  formatReportColumn,
  type LocationAttribute,
  type ReportColumn,
  type ReportQueryInput,
  type ReportQueryResult,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const parseIsoDate = (value: string): Date | null => {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

const computeDaysOpen = (
  openedAtIso: string,
  rangeFromIso: string,
  rangeToIso: string,
): number | null => {
  const openedDate = parseIsoDate(openedAtIso.slice(0, 10))
  const rangeStartDate = parseIsoDate(rangeFromIso)
  const rangeEndDate = parseIsoDate(rangeToIso)

  if (!openedDate || !rangeStartDate || !rangeEndDate) return null

  const effectiveStartMs = Math.max(openedDate.getTime(), rangeStartDate.getTime())

  if (effectiveStartMs > rangeEndDate.getTime()) return 0

  const days = Math.floor((rangeEndDate.getTime() - effectiveStartMs) / MILLISECONDS_PER_DAY) + 1
  const periodLengthDays =
    Math.floor((rangeEndDate.getTime() - rangeStartDate.getTime()) / MILLISECONDS_PER_DAY) + 1
  return Math.max(0, Math.min(periodLengthDays, days))
}

export const enrichLocationAttributes = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  result: ReportQueryResult,
): Promise<ReportQueryResult> => {
  const requestedAttributes = config.locationAttributes ?? []
  if (requestedAttributes.length === 0) return result
  if (!config.rows.includes("locationId")) return result

  const locationRows = await db
    .select({
      id: locations.id,
      name: locations.name,
      openedAt: locations.openedAt,
    })
    .from(locations)
    .where(eq(locations.customerId, customerId))

  const byName = new Map<string, { openedAt: string | null }>()
  for (const row of locationRows) {
    const nameKey = row.name ?? "Unknown"
    if (!byName.has(nameKey)) {
      byName.set(nameKey, { openedAt: row.openedAt ?? null })
    }
  }

  const attributeColumns: ReportColumn[] = requestedAttributes.map((attribute) => {
    const column: ReportColumn = {
      kind: "attribute",
      key: attribute,
      attribute,
      label: "",
    }
    return { ...column, label: formatReportColumn(column) }
  })

  const enrichedRows = result.rows.map((row) => {
    const locationName = row["locationId"]
    const locationInfo = typeof locationName === "string" ? byName.get(locationName) : undefined
    const openedAt = locationInfo?.openedAt ?? null
    const next: Record<string, string | number | null> = { ...row }

    for (const attribute of requestedAttributes) {
      next[attribute] = computeAttributeValue(attribute, openedAt, config.dateRange)
    }

    return next
  })

  return {
    ...result,
    columns: [...result.columns, ...attributeColumns],
    rows: enrichedRows,
  }
}

const computeAttributeValue = (
  attribute: LocationAttribute,
  openedAt: string | null,
  dateRange: ReportQueryInput["dateRange"],
): string | number | null => {
  if (!openedAt) return null

  if (attribute === "dateOpened") {
    return openedAt.slice(0, 10)
  }

  return computeDaysOpen(openedAt, dateRange.from, dateRange.to)
}
