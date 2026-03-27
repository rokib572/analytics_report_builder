import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import listSquareCustomers from "./list"

const squareCustomerRouter = new Hono<AuthEnv>().route("/list", listSquareCustomers)

export default squareCustomerRouter
