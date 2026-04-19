import type { FormEventHandler } from "react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import type { z } from "zod"
import type { ResetPasswordSchema } from "./schemas"

export type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>

export type ResetFormContentProps = {
  error: string | null
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  register: UseFormRegister<ResetPasswordValues>
  errors: FieldErrors<ResetPasswordValues>
}

export type InvalidTokenContentProps = {
  message: string
}
