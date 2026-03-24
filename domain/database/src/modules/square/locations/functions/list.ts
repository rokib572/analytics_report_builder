import { and, count, eq, ilike } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LocationDto, locations } from "../schema"

type ListLocationsOptions = {
  page: number
  limit: number
  search: string
}

type ListLocationsResult = {
  locations: LocationDto[]
  totalCount: number
}

export const listLocations = async (
  db: DbClient,
  customerId: string,
  options: ListLocationsOptions,
): Promise<ListLocationsResult> => {
  const customerClause = eq(locations.customerId, customerId)
  const normalizedSearch = options.search.trim()
  const conditions = normalizedSearch ? [ilike(locations.name, `%${normalizedSearch}%`)] : []
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
