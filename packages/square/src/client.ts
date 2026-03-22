import { SquareClient, SquareEnvironment } from "square"
import { getAppIntegrationSecret, getDbClient } from "@analytics/database"
import { DomainError } from "../../shared-libs/src"

const SQUARE_APP_NAME = "square"

export const createSquareClient = async (customerId: string) => {
  const { db } = getDbClient(process.env.DATABASE_URL!, { logQueries: false })
  const integration = await getAppIntegrationSecret(db, { customerId, appName: SQUARE_APP_NAME })

  if (!integration) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: "No active Square integration found for this customer",
      clientSafeMessage:
        "No active Square integration found. Please connect your Square account to view locations.",
    })
  }

  return new SquareClient({
    token: integration.appSecret,
    environment:
      integration.environment === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  })
}

export const createSquareClientWithToken = ({
  appSecret,
  environment,
}: {
  appSecret: string
  environment: string
}) =>
  new SquareClient({
    token: appSecret,
    environment:
      environment === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  })
