import type { FormEventHandler } from "react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import type { z } from "zod"
import type { PasswordFormSchema, ProfileFormSchema } from "./schemas"

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>
export type PasswordFormValues = z.infer<typeof PasswordFormSchema>

export type ProfileFormContentProps = {
  email: string
  error: string | null
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  register: UseFormRegister<ProfileFormValues>
  errors: FieldErrors<ProfileFormValues>
}

export type PasswordFormContentProps = {
  error: string | null
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  register: UseFormRegister<PasswordFormValues>
  errors: FieldErrors<PasswordFormValues>
}
