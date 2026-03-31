import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import summaryRouter from "./summary"
import jitRouter from "./jit"

const dailySalesRouter = new Hono<AuthEnv>().route("/summary", summaryRouter).route("/", jitRouter)

export default dailySalesRouter
