import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useAuth } from "../../lib/auth-context"
import { Router } from "../../router"
import { OnboardingFormContent } from "./contents-onboarding-form"
import { OnboardingFormSchema } from "./schemas"
import type { OnboardingFormValues } from "./types"

export const OnboardingRoute = () => {
  const { isSystemAdmin, user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingFormSchema),
    defaultValues: {
      companyName: user.companyName,
      businessType: "",
      businessSize: "",
      phone: "",
      address: "",
    },
  })

  useEffect(() => {
    if (isSystemAdmin) {
      Router.replace("Home")
      return
    }

    if (user.companyName) {
      Router.replace("Home")
    }
  }, [isSystemAdmin, user.companyName])

  const onSubmit = async (values: OnboardingFormValues) => {
    setError(null)

    const res = await apiClient.api.onboarding.$post({
      json: values,
    })

    if (!res.ok) {
      setError("Failed to save business details")
      return
    }

    await queryClient.invalidateQueries({ queryKey: ["current-user"] })
    Router.push("Connect")
  }

  if (isSystemAdmin || user.companyName) {
    return null
  }

  return (
    <OnboardingFormContent
      error={error}
      isSubmitting={isSubmitting}
      register={register}
      errors={errors}
      onSubmit={handleSubmit(onSubmit)}
    />
  )
}
