import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import listInventoryRouter from "./list"

const inventoryRouter = new Hono<AuthEnv>().route("/list", listInventoryRouter)

export default inventoryRouter
