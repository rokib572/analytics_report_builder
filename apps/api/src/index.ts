import { serve } from "@hono/node-server"
import app from "./api-client"
import { startNightlySyncJob } from "./jobs/nightly-sync"

startNightlySyncJob()

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3001) })
