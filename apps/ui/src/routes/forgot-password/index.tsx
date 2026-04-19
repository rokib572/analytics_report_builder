import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForgotPassword } from "../../data/auth/hooks"
import { RequestResetFormContent } from "./contents-request-form"
import { RequestResetSuccessContent } from "./contents-request-success"
import { RequestResetSchema } from "./schemas"
import type { RequestResetValues } from "./types"

export const ForgotPasswordRoute = () => {
  const forgotPassword = useForgotPassword()
  const [error, setError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetValues>({
    resolver: zodResolver(RequestResetSchema),
  })

  const onSubmit = async (values: RequestResetValues) => {
    setError(null)

    try {
      await forgotPassword.mutateAsync({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setSubmittedEmail(values.email)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send reset link")
    }
  }

  if (submittedEmail) {
    return <RequestResetSuccessContent email={submittedEmail} />
  }

  return (
    <RequestResetFormContent
      error={error}
      isSubmitting={isSubmitting || forgotPassword.isPending}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      errors={errors}
    />
  )
}
