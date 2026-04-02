import type { SQL } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"

export type MetricDefinition = {
  select: SQL<bigint | number>
}

export type GroupableExpression = SQL | AnyPgColumn

export type SelectExpression = SQL<string | number> | AnyPgColumn

export type DimensionDefinition = {
  select: SelectExpression
  groupBy: GroupableExpression
  orderBy: GroupableExpression
}
