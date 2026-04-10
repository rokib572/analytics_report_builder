const DAY_MS = 24 * 60 * 60 * 1000
const CHUNK_DAYS = 30

const parseDate = (value: string) => new Date(`${value}T00:00:00.000Z`)

const formatDate = (value: Date) => value.toISOString().split("T")[0]!

const addDays = (value: string, days: number) => {
  const next = parseDate(value)
  next.setUTCDate(next.getUTCDate() + days)
  return formatDate(next)
}

export const getBackfillChunk = (cursor: string, floor: string) => {
  const cursorDate = parseDate(cursor)
  const floorDate = parseDate(floor)

  if (cursorDate < floorDate) {
    return null
  }

  const earliestChunkStartDate = new Date(cursorDate.getTime() - DAY_MS * (CHUNK_DAYS - 1))
  const chunkStartDate = earliestChunkStartDate < floorDate ? floorDate : earliestChunkStartDate
  const chunkStart = formatDate(chunkStartDate)
  const nextCursor = addDays(chunkStart, -1)

  return {
    chunkStart,
    chunkEnd: cursor,
    nextCursor,
    isFinalChunk: chunkStart === floor,
  }
}
