/// <reference types="node" />
import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"
import { resolveDrizzleSslMode } from "./src/db/ssl"

config({ path: "../../.env" })

const connectionString = process.env.DATABASE_URL!
const url = new URL(connectionString)

export default defineConfig({
  schema: "./src/**/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: url.hostname,
    port: Number(url.port || "5432"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: resolveDrizzleSslMode(connectionString),
  },
})
