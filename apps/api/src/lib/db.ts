import { getDbClient } from "@analytics/database"

export const { db, queryClient } = getDbClient(process.env.DATABASE_URL!, { logQueries: false })
