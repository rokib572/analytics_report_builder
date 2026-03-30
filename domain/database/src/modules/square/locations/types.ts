import type { LocationDto } from "./schema"

export type ListLocationsOptions = {
  page: number
  limit: number
  search: string
}

export type ListLocationsResult = {
  locations: LocationDto[]
  totalCount: number
}
