import type { FormEventHandler } from "react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import type { z } from "zod"
import type { RequestResetSchema } from "./schemas"

export type RequestResetValues = z.infer<typeof RequestResetSchema>

export type RequestFormContentProps = {
  error: string | null
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  register: UseFormRegister<RequestResetValues>
  errors: FieldErrors<RequestResetValues>
}

export type RequestSuccessContentProps = {
  email: string
}
