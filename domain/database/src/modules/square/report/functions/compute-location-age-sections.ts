import type {
  ReportQueryInput,
  ReportQueryResult,
  ReportSection,
  ReportSectionKey,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import {
  buildSection,
  classifyCustomerLocations,
  partitionRowsBySection,
  sectionsRequireLocationRows,
} from "./classify-location-sections"
import { computeSummaryRows } from "./compute-summary-rows"

const computeSectionSummaries = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  locationIds: string[],
): Promise<ReportSection["summaryRows"]> => {
  if (!config.comparisons) return []
  if (locationIds.length === 0) return []

  const sectionConfig: ReportQueryInput = {
    ...config,
    locationAgePartition: undefined,
    filters: [
      ...config.filters,
      {
        dimension: "locationId",
        operator: "in",
        value: locationIds,
      },
    ],
  }

  return computeSummaryRows(db, customerId, sectionConfig, config.comparisons)
}

export const computeLocationAgeSections = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  result: ReportQueryResult,
): Promise<ReportSection[] | undefined> => {
  if (!sectionsRequireLocationRows(config)) return undefined

  const thresholdDays = config.locationAgePartition!.thresholdDays
  const classified = await classifyCustomerLocations(
    db,
    customerId,
    config.dateRange.from,
    thresholdDays,
  )
  const partitioned = partitionRowsBySection(result, classified.byName)

  const [matureSummary, newSummary] = await Promise.all([
    computeSectionSummaries(
      db,
      customerId,
      config,
      classified.locationIdsByKey.get("mature") ?? [],
    ),
    computeSectionSummaries(db, customerId, config, classified.locationIdsByKey.get("new") ?? []),
  ])

  const orderedKeys: ReportSectionKey[] = ["mature", "new"]
  const sections: ReportSection[] = []

  for (const key of orderedKeys) {
    const rows = key === "mature" ? partitioned.mature : partitioned.new
    const summaryRows = key === "mature" ? matureSummary : newSummary
    sections.push(buildSection(key, rows, summaryRows))
  }

  return sections
}
