import type { SQL } from "drizzle-orm"
import { type dailySales } from "../../daily-sales/schema"
import { type locations } from "../../locations/schema"

export type MetricDefinition = {
  select: SQL<bigint | number>
}

export type GroupableExpression =
  | SQL
  | typeof dailySales.locationId
  | typeof dailySales.saleDate
  | typeof locations.name

export type SelectExpression =
  | SQL<string | number>
  | typeof dailySales.locationId
  | typeof dailySales.saleDate
  | typeof locations.name

export type DimensionDefinition = {
  select: SelectExpression
  groupBy: GroupableExpression
  orderBy: GroupableExpression
}
