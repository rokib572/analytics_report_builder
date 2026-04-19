import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, getApiAccountId } from "../../lib/api-client"
import { authClient } from "../../lib/auth-client"

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["current-user", getApiAccountId() ?? "default"],
    queryFn: async () => {
      const res = await apiClient.api["current-user"].$get()
      if (!res.ok) throw new Error("Failed to fetch current user")
      return res.json()
    },
  })

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const res = await apiClient.api["current-user"].$patch({
        json: payload,
      })

      if (!res.ok) {
        const error = (await res.json()) as { message?: string }
        throw new Error(error.message ?? "Failed to update profile")
      }

      return res.json()
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["current-user"] }),
        authClient.getSession({
          query: { disableCookieCache: true },
        }),
      ])
    },
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const result = await authClient.changePassword(payload)

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to change password")
      }

      return result.data
    },
  })

export const useForgotPassword = () =>
  useMutation({
    mutationFn: async (payload: { email: string; redirectTo: string }) => {
      const result = await authClient.requestPasswordReset(payload)

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to send reset link")
      }

      return result.data
    },
  })

export const useResetPassword = () =>
  useMutation({
    mutationFn: async (payload: { newPassword: string; token: string }) => {
      const result = await authClient.resetPassword(payload)

      if (result.error) {
        const code = "code" in result.error ? String(result.error.code) : ""

        if (code === "INVALID_TOKEN") {
          throw new Error("This reset link is invalid or has already been used.")
        }

        if (code === "TOKEN_EXPIRED") {
          throw new Error("This reset link has expired. Request a new one and try again.")
        }

        throw new Error(result.error.message ?? "Failed to reset password")
      }

      return result.data
    },
  })
