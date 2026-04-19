import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useResetPassword } from "../../data/auth/hooks"
import { Router } from "../../router"
import { InvalidResetTokenContent } from "./contents-invalid-token"
import { ResetPasswordFormContent } from "./contents-reset-form"
import { ResetPasswordSchema } from "./schemas"
import type { ResetPasswordValues } from "./types"

export const ResetPasswordRoute = () => {
  const token = new URLSearchParams(window.location.search).get("token")
  const resetPassword = useResetPassword()
  const [error, setError] = useState<string | null>(null)
  const [invalidMessage, setInvalidMessage] = useState<string | null>(
    token ? null : "This reset link is missing a token. Request a new password reset email.",
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) return

    setError(null)

    try {
      await resetPassword.mutateAsync({
        newPassword: values.newPassword,
        token,
      })
      toast.success("Password reset. You can now sign in.")
      Router.replace("Login")
    } catch (error) {
      const message = error instanceof Error ? error.message : "This reset link is invalid."
      setError(message)
      setInvalidMessage(message)
      toast.error(message)
    }
  }

  if (invalidMessage) {
    return <InvalidResetTokenContent message={invalidMessage} />
  }

  return (
    <ResetPasswordFormContent
      error={error}
      isSubmitting={isSubmitting || resetPassword.isPending}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      errors={errors}
    />
  )
}
