type DomainErrorCode =
  | "BAD_REQUEST"
  | "UNPROCESSABLE_CONTENT"
  | "NOT_FOUND"
  | "UNAUTHORISED"
  | "INTERNAL_ERROR"
  | "EXTERNAL_ERROR"
  | "HTTP_ERROR"

type DomainErrorParams = {
  message: string
  code: DomainErrorCode
  clientSafeMessage?: string
  additionalContext?: Record<string, string | number | boolean | string[]>
}

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly clientSafeMessage?: string
  readonly additionalContext?: Record<string, string | number | boolean | string[]>

  protected constructor({
    message,
    code,
    clientSafeMessage,
    additionalContext,
  }: DomainErrorParams) {
    super(message)
    this.code = code
    this.clientSafeMessage = clientSafeMessage
    this.additionalContext = additionalContext
    Object.setPrototypeOf(this, DomainError.prototype)
  }

  static makeError = (params: DomainErrorParams): DomainError => new DomainError(params)
}

export type { DomainErrorCode, DomainErrorParams }
