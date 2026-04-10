import { serve } from "@hono/node-server"
import app from "./api-client"
import { startBackgroundJobs } from "./jobs/nightly-sync"

startBackgroundJobs()

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3001) })
