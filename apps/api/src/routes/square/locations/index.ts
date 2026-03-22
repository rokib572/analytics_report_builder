import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import listSquareLocationRouter from "./list"

const squareLocationRouter = new Hono<AuthEnv>().route("/square/list", listSquareLocationRouter)

export default squareLocationRouter
