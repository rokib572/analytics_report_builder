import { SquareClient, SquareEnvironment } from "square"

export const createSquareClient = (token: string, environment: string = "sandbox") =>
  new SquareClient({
    token,
    environment:
      environment === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  })
