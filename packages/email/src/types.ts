import type { ReactElement } from "react"
import type { EmailConfig } from "./config"

type SendEmailInput = {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  template: ReactElement
  replyTo?: string
  from?: string
  headers?: Record<string, string>
}

type SendEmailResult = {
  messageId: string
  accepted: string[]
  rejected: string[]
}

export type { SendEmailInput, SendEmailResult, EmailConfig }
