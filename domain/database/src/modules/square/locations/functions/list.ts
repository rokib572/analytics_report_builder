import { and, count, eq, ilike, or, sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type ListLocationsOptions, type ListLocationsResult, locations } from "../schema"
import { toContainsIlike } from "@analytics/shared-libs"

export const listLocations = async (
  db: DbClient,
  customerId: string,
  options: ListLocationsOptions,
): Promise<ListLocationsResult> => {
  const customerClause = eq(locations.customerId, customerId)
  const trimmed = options.search.trim()
  const conditions = trimmed
    ? [
        (() => {
          const safePattern = toContainsIlike(trimmed)
          return or(
            ilike(locations.name, safePattern),
            ilike(sql`coalesce(${locations.address} ->> 'addressLine1', '')`, safePattern),
            ilike(sql`coalesce(${locations.address} ->> 'locality', '')`, safePattern),
            ilike(
              sql`coalesce(${locations.address} ->> 'administrativeDistrictLevel1', '')`,
              safePattern,
            ),
            ilike(sql`coalesce(${locations.address} ->> 'postalCode', '')`, safePattern),
            ilike(sql`coalesce(${locations.address} ->> 'country', '')`, safePattern),
          )
        })(),
      ]
    : []
  const whereClause = conditions.length > 0 ? and(customerClause, ...conditions) : customerClause
  const offset = (options.page - 1) * options.limit

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(locations)
      .where(whereClause)
      .orderBy(locations.name)
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(locations).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    locations: rows,
    totalCount: countResult?.totalCount ?? 0,
  }
}
