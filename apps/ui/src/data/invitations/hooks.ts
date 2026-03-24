import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

export const useInvitations = () =>
  useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const res = await apiClient.api.invitations.list.$get()
      if (!res.ok) throw new Error("Failed to fetch invitations")
      return res.json()
    },
  })

export const useCreateInvitation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      email: string
      role: "member" | "admin"
      expiresInHours?: number
    }) => {
      const res = await apiClient.api.invitations.create.$post({ json: data })
      if (!res.ok) {
        const error = await res.json()
        throw new Error((error as { message?: string }).message ?? "Failed to create invitation")
      }
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invitations"] })
    },
  })
}

export const useRevokeInvitation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.api.invitations.revoke.$post({ json: { id } })
      if (!res.ok) throw new Error("Failed to revoke invitation")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invitations"] })
    },
  })
}

export const useValidateInvitation = (token: string) =>
  useQuery({
    queryKey: ["invitation-validate", token],
    queryFn: async () => {
      const res = await apiClient.api.invitations.validate.$get({ query: { token } })
      if (!res.ok) throw new Error("Failed to validate invitation")
      return res.json()
    },
    enabled: !!token,
  })

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await apiClient.api.invitations.accept.$post({ json: { token } })
      if (!res.ok) {
        const error = await res.json()
        throw new Error((error as { message?: string }).message ?? "Failed to accept invitation")
      }
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["current-user"] })
    },
  })
}
