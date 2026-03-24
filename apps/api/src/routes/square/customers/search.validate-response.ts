import type { searchSquareCustomer } from "@analytics/square"
import { DomainError } from "@analytics/shared-libs"

type SearchCustomerResponse = Awaited<ReturnType<typeof searchSquareCustomer>>

export const validateCustomerSearchResponse = (searchResponse: SearchCustomerResponse) => {
  if (searchResponse.errors) {
    throw DomainError.makeError({
      code: "EXTERNAL_ERROR",
      message: "Error searching customers from Square API",
      clientSafeMessage:
        "There was an error searching your Square customer. Please try again later.",
      additionalContext: {
        errors: JSON.stringify(searchResponse.errors),
      },
    })
  }

  if (!searchResponse.customers) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: "No customers data returned from Square API",
      clientSafeMessage: "Customer data not found.",
    })
  }

  return searchResponse.customers
}
