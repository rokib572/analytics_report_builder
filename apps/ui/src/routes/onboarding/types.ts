import type { FormEventHandler } from "react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import type { z } from "zod"
import type { OnboardingFormSchema } from "./schemas"

export type OnboardingFormValues = z.infer<typeof OnboardingFormSchema>

export type OnboardingFormProps = {
  error: string | null
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  register: UseFormRegister<OnboardingFormValues>
  errors: FieldErrors<OnboardingFormValues>
}
