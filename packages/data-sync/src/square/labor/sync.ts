import {
  type DbClient,
  getLocationSquareIdMap,
  upsertLaborBreakType,
  upsertLaborTeamMemberWage,
  upsertLaborTimecard,
  type LaborBreakTypePayload,
  type LaborTeamMemberWagePayload,
  type LaborTimecardPayload,
} from "@analytics/database"
import { batchSearchTimecards, listBreakTypes, listTeamMemberWages } from "@analytics/square"
import type { Square } from "square"
import { computeContentHash, normalizeJsonValue } from "../../utils/content-hash"
import type { SyncRecordCollector } from "../../utils/sync-collector"

const MILLISECONDS_PER_MINUTE = 60 * 1000
const MINUTES_PER_HOUR = 60
const MILLI_HOURS_PER_HOUR = 1000

const toBigInt = (value: number | bigint | null | undefined): bigint | null => {
  if (value === null || value === undefined) return null
  return typeof value === "bigint" ? value : BigInt(Math.round(value))
}

const parseIsoToDate = (value: string | null | undefined): Date | null =>
  value ? new Date(value) : null

const computeBreakMinutes = (
  breaks: Square.Break[] | null | undefined,
  isPaid: boolean,
): number => {
  if (!breaks) return 0

  return breaks
    .filter((breakEntry) => breakEntry.isPaid === isPaid)
    .reduce((acc, breakEntry) => {
      if (!breakEntry.startAt || !breakEntry.endAt) return acc
      const durationMinutes =
        (new Date(breakEntry.endAt).getTime() - new Date(breakEntry.startAt).getTime()) /
        MILLISECONDS_PER_MINUTE
      return acc + Math.max(0, durationMinutes)
    }, 0)
}

const computeTotalPaidMilliHours = (timecard: Square.Timecard): bigint | null => {
  if (!timecard.startAt || !timecard.endAt) return null
  const totalMinutes =
    (new Date(timecard.endAt).getTime() - new Date(timecard.startAt).getTime()) /
    MILLISECONDS_PER_MINUTE
  const unpaidBreakMinutes = computeBreakMinutes(timecard.breaks, false)
  const paidMinutes = Math.max(0, totalMinutes - unpaidBreakMinutes)
  const milliHours = (paidMinutes / MINUTES_PER_HOUR) * MILLI_HOURS_PER_HOUR
  return BigInt(Math.round(milliHours))
}

const computeTotalLaborCostCents = (
  totalPaidMilliHours: bigint | null,
  hourlyWageCents: bigint | null,
): bigint | null => {
  if (totalPaidMilliHours === null || hourlyWageCents === null) return null
  return (totalPaidMilliHours * hourlyWageCents) / BigInt(MILLI_HOURS_PER_HOUR)
}

const ISO_8601_DURATION_PATTERN = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/

const parseIso8601DurationMinutes = (duration: string | null | undefined): number | null => {
  if (!duration) return null
  const match = duration.match(ISO_8601_DURATION_PATTERN)
  if (!match) return null
  const [, days, hours, minutes, seconds] = match
  const totalMinutes =
    Number(days ?? 0) * 24 * 60 +
    Number(hours ?? 0) * 60 +
    Number(minutes ?? 0) +
    Math.round(Number(seconds ?? 0) / 60)
  return totalMinutes
}

const mapTimecardPayload = (
  timecard: Square.Timecard,
  internalLocationId: string,
): LaborTimecardPayload => {
  const hourlyWageCents = toBigInt(timecard.wage?.hourlyRate?.amount ?? null)
  const totalPaidMilliHours = computeTotalPaidMilliHours(timecard)
  const totalLaborCostCents = computeTotalLaborCostCents(totalPaidMilliHours, hourlyWageCents)
  const workDate = (timecard.startAt ?? "").slice(0, 10)

  const hashInput = {
    id: timecard.id,
    locationId: timecard.locationId,
    teamMemberId: timecard.teamMemberId,
    startAt: timecard.startAt,
    endAt: timecard.endAt,
    status: timecard.status,
    wage: timecard.wage,
    breaks: timecard.breaks,
    declaredCashTipMoney: timecard.declaredCashTipMoney,
    version: timecard.version,
  }

  return {
    locationId: internalLocationId,
    squareId: timecard.id ?? "",
    teamMemberId: timecard.teamMemberId ?? "",
    jobTitle: timecard.wage?.title ?? null,
    jobId: timecard.wage?.jobId ?? null,
    workDate,
    startAt: new Date(timecard.startAt),
    endAt: parseIsoToDate(timecard.endAt ?? null),
    status: timecard.status ?? null,
    hourlyWageCents,
    totalPaidHours: totalPaidMilliHours,
    totalLaborCostCents,
    declaredCashTipsCents: toBigInt(timecard.declaredCashTipMoney?.amount ?? null),
    paidBreakMinutes: BigInt(Math.round(computeBreakMinutes(timecard.breaks, true))),
    unpaidBreakMinutes: BigInt(Math.round(computeBreakMinutes(timecard.breaks, false))),
    breaks:
      (normalizeJsonValue(timecard.breaks ?? null) as Record<string, unknown>[] | null) ?? null,
    timezone: timecard.timezone ?? null,
    contentHash: computeContentHash(hashInput as Record<string, unknown>),
    squareCreatedAt: parseIsoToDate(timecard.createdAt ?? null),
    squareUpdatedAt: parseIsoToDate(timecard.updatedAt ?? null),
  }
}

const mapBreakTypePayload = (
  breakType: Square.BreakType,
  internalLocationId: string,
): LaborBreakTypePayload => {
  const expectedDurationMinutes = parseIso8601DurationMinutes(breakType.expectedDuration)

  const hashInput = {
    id: breakType.id,
    locationId: breakType.locationId,
    breakName: breakType.breakName,
    expectedDuration: breakType.expectedDuration,
    isPaid: breakType.isPaid,
    version: breakType.version,
  }

  return {
    locationId: internalLocationId,
    squareId: breakType.id ?? "",
    breakName: breakType.breakName,
    expectedDuration: breakType.expectedDuration,
    expectedDurationMinutes,
    isPaid: breakType.isPaid,
    contentHash: computeContentHash(hashInput as Record<string, unknown>),
  }
}

const mapTeamMemberWagePayload = (wage: Square.TeamMemberWage): LaborTeamMemberWagePayload => {
  const hourlyWageCents = toBigInt(wage.hourlyRate?.amount ?? null)

  const hashInput = {
    id: wage.id,
    teamMemberId: wage.teamMemberId,
    title: wage.title,
    jobId: wage.jobId,
    hourlyRate: wage.hourlyRate?.amount?.toString() ?? null,
    tipEligible: wage.tipEligible,
  }

  return {
    squareId: wage.id ?? "",
    teamMemberId: wage.teamMemberId ?? "",
    jobTitle: wage.title ?? null,
    jobId: wage.jobId ?? null,
    hourlyWageCents,
    tipEligible: wage.tipEligible ?? null,
    contentHash: computeContentHash(hashInput as Record<string, unknown>),
  }
}

export const syncLaborTimecards = async (
  db: DbClient,
  customerId: string,
  startAt: string,
  endAt: string,
  squareLocationIds?: string[],
  collector?: SyncRecordCollector,
): Promise<{ synced: number; unchanged: number; skipped: number }> => {
  const locationMap = await getLocationSquareIdMap(db, customerId)
  const selectedSquareLocationIds = squareLocationIds?.filter((locationId) =>
    locationMap.has(locationId),
  )
  const locationIdsToSync = selectedSquareLocationIds?.length
    ? selectedSquareLocationIds
    : [...locationMap.keys()]

  if (locationIdsToSync.length === 0) {
    return { synced: 0, unchanged: 0, skipped: 0 }
  }

  const timecards = await batchSearchTimecards(customerId, locationIdsToSync, startAt, endAt)

  let synced = 0
  let unchanged = 0
  let skipped = 0

  for (const timecard of timecards) {
    if (!timecard.id || !timecard.locationId || !timecard.startAt || !timecard.teamMemberId) {
      skipped++
      continue
    }

    const internalLocationId = locationMap.get(timecard.locationId)
    if (!internalLocationId) {
      skipped++
      continue
    }

    const result = await upsertLaborTimecard(
      db,
      customerId,
      mapTimecardPayload(timecard, internalLocationId),
    )

    if (result) {
      synced++
      collector?.changed.push(timecard.id)
    } else {
      unchanged++
    }
  }

  return { synced, unchanged, skipped }
}

export const syncLaborBreakTypes = async (
  db: DbClient,
  customerId: string,
  collector?: SyncRecordCollector,
): Promise<{ synced: number; unchanged: number; skipped: number }> => {
  const locationMap = await getLocationSquareIdMap(db, customerId)

  if (locationMap.size === 0) {
    return { synced: 0, unchanged: 0, skipped: 0 }
  }

  let synced = 0
  let unchanged = 0
  let skipped = 0

  for (const [squareLocationId, internalLocationId] of locationMap.entries()) {
    const breakTypes = await listBreakTypes(customerId, squareLocationId)

    for (const breakType of breakTypes) {
      if (!breakType.id) {
        skipped++
        continue
      }

      const result = await upsertLaborBreakType(
        db,
        customerId,
        mapBreakTypePayload(breakType, internalLocationId),
      )

      if (result) {
        synced++
        collector?.changed.push(breakType.id)
      } else {
        unchanged++
      }
    }
  }

  return { synced, unchanged, skipped }
}

export const syncLaborTeamMemberWages = async (
  db: DbClient,
  customerId: string,
  collector?: SyncRecordCollector,
): Promise<{ synced: number; unchanged: number; skipped: number }> => {
  const wages = await listTeamMemberWages(customerId)

  let synced = 0
  let unchanged = 0
  let skipped = 0

  for (const wage of wages) {
    if (!wage.id || !wage.teamMemberId) {
      skipped++
      continue
    }

    const result = await upsertLaborTeamMemberWage(db, customerId, mapTeamMemberWagePayload(wage))

    if (result) {
      synced++
      collector?.changed.push(wage.id)
    } else {
      unchanged++
    }
  }

  return { synced, unchanged, skipped }
}

export type LaborSyncTotals = {
  timecards: { synced: number; unchanged: number; skipped: number }
  breakTypes: { synced: number; unchanged: number; skipped: number }
  teamMemberWages: { synced: number; unchanged: number; skipped: number }
}

export type LaborSyncCollectors = {
  timecards: SyncRecordCollector
  breakTypes: SyncRecordCollector
  teamMemberWages: SyncRecordCollector
}

export const syncLabor = async (
  db: DbClient,
  customerId: string,
  startAt: string,
  endAt: string,
  collectors?: LaborSyncCollectors,
  squareLocationIds?: string[],
): Promise<LaborSyncTotals> => {
  const [breakTypes, teamMemberWages, timecards] = await Promise.all([
    syncLaborBreakTypes(db, customerId, collectors?.breakTypes),
    syncLaborTeamMemberWages(db, customerId, collectors?.teamMemberWages),
    syncLaborTimecards(db, customerId, startAt, endAt, squareLocationIds, collectors?.timecards),
  ])

  return { timecards, breakTypes, teamMemberWages }
}
