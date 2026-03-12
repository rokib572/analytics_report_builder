import { type SQL, sql } from "drizzle-orm"
import { type AnyPgColumn, char, pgSchema } from "drizzle-orm/pg-core"
import { ulid } from "ulidx"

export const coreSchema = pgSchema("core_data")
export const authSchema = pgSchema("auth_data")
export const reportSchema = pgSchema("report_data")
export const auditSchema = pgSchema("audit_data")
export const migrationSchema = pgSchema("migration_data")
export const jobSchema = pgSchema("job_data")

export const primaryKey = (columnName = "id") =>
  char(columnName, { length: 26 }).primaryKey().$defaultFn(ulid)
export const foreignKey = (columnName: string) => char(columnName, { length: 26 })
export const lowerCase = (text: AnyPgColumn): SQL => sql`lower(${text})`
export const generatedRandomIdColumn = (columnName: string) =>
  char(columnName, { length: 26 }).$defaultFn(ulid)
