import { sql, type SQL } from "drizzle-orm"
import { requireBetweenValues, type Dimension } from "@analytics/report-builder"
import type { GroupableExpression } from "./type"

export const buildExpressionCondition = (
  dimension: Dimension,
  expression: GroupableExpression,
  operator: "eq" | "in" | "between",
  value: string | string[],
): SQL => {
  if (operator === "eq") {
    return sql`${expression} = ${String(value)}`
  }

  if (operator === "in") {
    const values = Array.isArray(value) ? value : [value]
    return sql`${expression} in (${sql.join(
      values.map((item) => sql`${item}`),
      sql`, `,
    )})`
  }

  const { from, to } = requireBetweenValues(dimension, operator, value)
  return sql`${expression} >= ${from} and ${expression} <= ${to}`
}
