import { eq } from "drizzle-orm"
import type {
  ReportQueryInput,
  ReportQueryResult,
  ReportSection,
  ReportSectionKey,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const SECTION_LABELS: Record<ReportSectionKey, string> = {
  mature: "Mature Stores",
  new: "New Stores",
}

const parseIsoDate = (value: string): Date | null => {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

const classifyOpenedAt = (
  openedAtIso: string | null,
  rangeStartMs: number,
  thresholdMs: number,
): ReportSectionKey => {
  if (!openedAtIso) return "new"

  const openedDate = parseIsoDate(openedAtIso.slice(0, 10))
  if (!openedDate) return "new"

  const daysSinceOpenMs = rangeStartMs - openedDate.getTime()
  return daysSinceOpenMs >= thresholdMs ? "mature" : "new"
}

export type ClassifiedLocations = {
  byName: Map<string, ReportSectionKey>
  byId: Map<string, ReportSectionKey>
  locationIdsByKey: Map<ReportSectionKey, string[]>
}

export const classifyCustomerLocations = async (
  db: DbClient,
  customerId: string,
  rangeFromIso: string,
  thresholdDays: number,
): Promise<ClassifiedLocations> => {
  const rangeStart = parseIsoDate(rangeFromIso)
  const rangeStartMs = rangeStart?.getTime() ?? 0
  const thresholdMs = thresholdDays * MILLISECONDS_PER_DAY

  const locationRows = await db
    .select({
      id: locations.id,
      name: locations.name,
      openedAt: locations.openedAt,
    })
    .from(locations)
    .where(eq(locations.customerId, customerId))

  const byName = new Map<string, ReportSectionKey>()
  const byId = new Map<string, ReportSectionKey>()
  const locationIdsByKey = new Map<ReportSectionKey, string[]>([
    ["mature", []],
    ["new", []],
  ])

  for (const row of locationRows) {
    const key = classifyOpenedAt(row.openedAt ?? null, rangeStartMs, thresholdMs)
    const nameKey = row.name ?? "Unknown"

    if (!byName.has(nameKey)) byName.set(nameKey, key)
    byId.set(row.id, key)
    locationIdsByKey.get(key)!.push(row.id)
  }

  return { byName, byId, locationIdsByKey }
}

export const partitionRowsBySection = (
  result: ReportQueryResult,
  byName: Map<string, ReportSectionKey>,
): { mature: ReportQueryResult["rows"]; new: ReportQueryResult["rows"] } => {
  const matureRows: ReportQueryResult["rows"] = []
  const newRows: ReportQueryResult["rows"] = []

  for (const row of result.rows) {
    const locationName = row["locationId"]
    const sectionKey =
      typeof locationName === "string" ? (byName.get(locationName) ?? "new") : "new"

    if (sectionKey === "mature") matureRows.push(row)
    else newRows.push(row)
  }

  return { mature: matureRows, new: newRows }
}

export const getSectionLabel = (key: ReportSectionKey): string => SECTION_LABELS[key]

export const sectionsRequireLocationRows = (config: ReportQueryInput): boolean =>
  Boolean(config.locationAgePartition?.enabled) && config.rows.includes("locationId")

export const buildSection = (
  key: ReportSectionKey,
  rows: ReportQueryResult["rows"],
  summaryRows?: ReportSection["summaryRows"],
): ReportSection => ({
  key,
  label: getSectionLabel(key),
  rows,
  ...(summaryRows && summaryRows.length > 0 ? { summaryRows } : {}),
})
