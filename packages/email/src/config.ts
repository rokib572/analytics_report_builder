import { z } from "zod"
import { DomainError } from "@analytics/shared-libs"

const coerceBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return value

  const normalized = value.trim().toLowerCase()

  if (normalized === "") return undefined
  if (["true", "1", "yes", "on"].includes(normalized)) return true
  if (["false", "0", "no", "off"].includes(normalized)) return false

  return value
}, z.boolean().default(false))

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}, z.string().email().optional())

const EmailConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  secure: coerceBoolean,
  user: z.string().min(1),
  password: z.string().min(1),
  from: z.string().email(),
  replyTo: optionalEmail,
})

type EmailConfig = z.infer<typeof EmailConfigSchema>

const formatConfigError = (error: z.ZodError) =>
  error.issues.map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`).join("; ")

export const loadEmailConfig = (): EmailConfig => {
  const parsed = EmailConfigSchema.safeParse({
    host: process.env.EMAIL_SMTP_HOST,
    port: process.env.EMAIL_SMTP_PORT,
    secure: process.env.EMAIL_SMTP_SECURE,
    user: process.env.EMAIL_SMTP_USER,
    password: process.env.EMAIL_SMTP_PASSWORD,
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO,
  })

  if (!parsed.success) {
    throw DomainError.makeError({
      code: "INTERNAL_ERROR",
      message: `Email config invalid: ${formatConfigError(parsed.error)}`,
      clientSafeMessage: "Email service is not configured.",
    })
  }

  return parsed.data
}

export type { EmailConfig }
