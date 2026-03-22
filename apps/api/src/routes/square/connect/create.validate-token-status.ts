import { DomainError } from "@analytics/shared-libs"
import { createSquareClient } from "@analytics/square"

export const validateTokenStatus = async ({
  accessToken,
  environment,
  customerId,
}: {
  accessToken: string
  environment: string
  customerId: string
}) => {
  // Verify the token works by fetching locations from Square
  const squareClient = createSquareClient(accessToken, environment)
  try {
    const accessTokenStatus = await squareClient.oAuth.retrieveTokenStatus()
    if (!accessTokenStatus || !accessTokenStatus.clientId) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: "Invalid Square access token. Could not connect to Square API.",
        clientSafeMessage: "Invalid Square access token. Please check your token and try again.",
        additionalContext: { customerId },
      })
    }

    const scopes = accessTokenStatus.scopes || []
    if (
      !scopes.includes("MERCHANT_PROFILE_READ") &&
      !scopes.includes("ORDERS_READ") &&
      !scopes.includes("PAYMENTS_READ")
    ) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message:
          "Insufficient permissions for the provided Square access token. Please ensure it has the MERCHANT_PROFILE_READ, ORDERS_READ and PAYMENTS_READ scope.",
        clientSafeMessage:
          "Insufficient permissions for the provided Square access token. Please ensure it has the correct scopes.",
        additionalContext: { customerId },
      })
    }
  } catch {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: "Invalid Square access token. Could not connect to Square API.",
      clientSafeMessage: "Invalid Square access token. Please check your token and try again.",
      additionalContext: { customerId },
    })
  }
}
