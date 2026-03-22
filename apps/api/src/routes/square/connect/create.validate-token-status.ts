import { DomainError } from "@analytics/shared-libs"
import type { createSquareClientWithToken } from "@analytics/square/src/client"

type SquareClient = ReturnType<typeof createSquareClientWithToken>

export const validateTokenStatus = async ({ squareClient }: { squareClient: SquareClient }) => {
  // Verify the token works by fetching locations from Square
  try {
    const accessTokenStatus = await squareClient.oAuth.retrieveTokenStatus()
    if (!accessTokenStatus || !accessTokenStatus.clientId) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: "Invalid Square access token. Could not connect to Square API.",
        clientSafeMessage: "Invalid Square access token. Please check your token and try again.",
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
      })
    }
  } catch {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: "Invalid Square access token. Could not connect to Square API.",
      clientSafeMessage: "Invalid Square access token. Please check your token and try again.",
    })
  }
}
