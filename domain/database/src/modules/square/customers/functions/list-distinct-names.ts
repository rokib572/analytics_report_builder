import { asc, eq, sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { squareCustomers } from "../schema"

const fullNameExpression = sql<string>`
  coalesce(
    nullif(trim(concat_ws(' ', ${squareCustomers.givenName}, ${squareCustomers.familyName})), ''),
    'Unknown'
  )
`

export const listDistinctSquareCustomerNames = async (
  db: DbClient,
  customerId: string,
): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ name: fullNameExpression })
    .from(squareCustomers)
    .where(eq(squareCustomers.customerId, customerId))
    .orderBy(asc(fullNameExpression))

  return rows.map((row) => row.name).filter((name): name is string => Boolean(name))
}
