import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import summaryRouter from "./summary"

const dailySalesRouter = new Hono<AuthEnv>().route("/summary", summaryRouter)

export default dailySalesRouter
