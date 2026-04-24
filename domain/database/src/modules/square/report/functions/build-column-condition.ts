import { and, eq, gte, inArray, lte, type SQL } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import { requireBetweenValues, type Dimension } from "@analytics/report-builder"

export const buildColumnCondition = (
  column: AnyPgColumn,
  dimension: Dimension,
  operator: "eq" | "in" | "between",
  value: string | string[],
): SQL => {
  if (operator === "eq") {
    return eq(column, String(value))
  }

  if (operator === "in") {
    return inArray(column, Array.isArray(value) ? value : [value])
  }

  const { from, to } = requireBetweenValues(dimension, operator, value)
  return and(gte(column, from), lte(column, to))!
}
