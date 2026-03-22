import type { ErrorHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { z } from "zod"
import { DomainError, type DomainErrorCode } from "@analytics/shared-libs"

const STATUS_MAP: Record<DomainErrorCode, ContentfulStatusCode> = {
  BAD_REQUEST: 400,
  UNAUTHORISED: 401,
  NOT_FOUND: 404,
  UNPROCESSABLE_CONTENT: 422,
  INTERNAL_ERROR: 500,
  EXTERNAL_ERROR: 500,
  HTTP_ERROR: 500,
}

const formatZodFields = (error: z.ZodError): Record<string, string[]> =>
  error.issues.reduce<Record<string, string[]>>((acc, issue) => {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form"
    const existing = acc[key] ?? []
    existing.push(issue.message)
    acc[key] = existing
    return acc
  }, {})

export const errorHandler: ErrorHandler = (error, context) => {
  if (error instanceof z.ZodError) {
    const fields = formatZodFields(error)

    console.error("[ValidationError]", { fields })

    return context.json(
      {
        message: "Validation failed",
        errorCode: "BAD_REQUEST",
        httpStatusCode: 400,
        fields,
      },
      400,
    )
  }

  if (error instanceof DomainError) {
    const httpStatusCode = STATUS_MAP[error.code]

    console.error("[DomainError]", {
      code: error.code,
      message: error.message,
      ...(error.additionalContext && { additionalContext: error.additionalContext }),
    })

    return context.json(
      {
        message: error.clientSafeMessage ?? "INTERNAL_SERVER_ERROR",
        errorCode: error.code,
        httpStatusCode,
      },
      httpStatusCode,
    )
  }

  console.error("[UnhandledError]", {
    message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    stack: error instanceof Error ? error.stack : undefined,
  })

  return context.json(
    {
      message: "INTERNAL_SERVER_ERROR",
      errorCode: "INTERNAL_ERROR",
      httpStatusCode: 500,
    },
    500,
  )
}
