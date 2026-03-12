import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

export const getDbClient = (
  connectionString: string,
  options: {
    logQueries?: boolean
    ssl?: boolean
    maxConnections?: number
    connectionTimeout?: number
    idleTimeout?: number
  } = { ssl: true, maxConnections: 20, connectionTimeout: 30, idleTimeout: 30 },
) => {
  const { logQueries, ssl, maxConnections, connectionTimeout, idleTimeout } = options
  const queryClient = postgres(connectionString, {
    max: maxConnections,
    connect_timeout: connectionTimeout,
    idle_timeout: idleTimeout,
    ssl,
  })
  const db = drizzle(queryClient, { logger: logQueries ?? true })
  return { queryClient, db }
}

type DrizzleClient = ReturnType<typeof getDbClient>["db"]
type DrizzleTransaction = Parameters<Parameters<DrizzleClient["transaction"]>[0]>[0]
export type DbClient = DrizzleClient | DrizzleTransaction
