import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useAuth } from "../../lib/auth-context"
import { useChangePassword, useUpdateProfile } from "../../data/auth/hooks"
import { PasswordFormContent } from "./contents-password-form"
import { ProfileFormContent } from "./contents-profile-form"
import { PasswordFormSchema, ProfileFormSchema } from "./schemas"
import type { PasswordFormValues, ProfileFormValues } from "./types"

export const ProfileRoute = () => {
  const { user } = useAuth()
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: user.name,
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    profileForm.reset({ name: user.name })
  }, [profileForm, user.name])

  const onSubmitProfile = async (values: ProfileFormValues) => {
    setProfileError(null)

    try {
      await updateProfile.mutateAsync({ name: values.name })
      profileForm.reset({ name: values.name })
      toast.success("Profile updated.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      setProfileError(message)
      toast.error(message)
    }
  }

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setPasswordError(null)

    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      passwordForm.reset()
      toast.success("Password updated.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password"
      setPasswordError(message)
      toast.error(message)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your display name and password.</p>
      </div>

      <ProfileFormContent
        email={user.email}
        error={profileError}
        isSubmitting={profileForm.formState.isSubmitting || updateProfile.isPending}
        onSubmit={profileForm.handleSubmit(onSubmitProfile)}
        register={profileForm.register}
        errors={profileForm.formState.errors}
      />

      <PasswordFormContent
        error={passwordError}
        isSubmitting={passwordForm.formState.isSubmitting || changePassword.isPending}
        onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
        register={passwordForm.register}
        errors={passwordForm.formState.errors}
      />
    </div>
  )
}
