import { render } from "@react-email/render"
import { DomainError } from "@analytics/shared-libs"
import { getTransporter } from "./client"
import { loadEmailConfig } from "./config"
import type { SendEmailInput, SendEmailResult } from "./types"

export const sendEmail = async (input: SendEmailInput): Promise<SendEmailResult> => {
  const config = loadEmailConfig()
  const transporter = getTransporter()

  const [html, text] = await Promise.all([
    render(input.template),
    render(input.template, { plainText: true }),
  ])

  try {
    const info = await transporter.sendMail({
      from: input.from ?? config.from,
      replyTo: input.replyTo ?? config.replyTo,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      html,
      text,
      headers: input.headers,
    })

    return {
      messageId: info.messageId,
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
    }
  } catch (error) {
    throw DomainError.makeError({
      code: "INTERNAL_ERROR",
      message: `Email send failed: ${error instanceof Error ? error.message : String(error)}`,
      clientSafeMessage: "Failed to send email. Please try again later.",
    })
  }
}
