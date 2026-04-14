import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Permission, PermissionEntry } from "@analytics/validators"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

type BulkSetPermissions = {
  permissions: PermissionEntry[]
}

export const useUserPermissions = (userId: string | null) => {
  const scopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["user-permissions", scopeKey, userId],
    queryFn: async () => {
      const res = await apiClient.api.permissions.users[":userId"].$get({
        param: { userId: userId! },
      })
      if (!res.ok) throw new Error("Failed to fetch permissions")
      const json = (await res.json()) as { success: true; data: Permission[] }
      return json.data
    },
    enabled: !!userId,
  })
}

export const useBulkSetPermissions = (userId: string | null) => {
  const scopeKey = useApiScopeKey()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: BulkSetPermissions) => {
      const res = await apiClient.api.permissions.users[":userId"].$put({
        param: { userId: userId! },
        json: payload,
      })

      if (!res.ok) {
        const error = (await res.json()) as { message?: string }
        throw new Error(error.message ?? "Failed to update permissions")
      }

      const json = (await res.json()) as { success: true; data: Permission[] }
      return json.data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-permissions", scopeKey, userId] }),
        queryClient.invalidateQueries({ queryKey: ["users", scopeKey] }),
      ])
    },
  })

  return {
    ...mutation,
    savePermissions: (payload: BulkSetPermissions) =>
      toast.promise(mutation.mutateAsync(payload), {
        loading: "Saving permissions...",
        success: "Permissions updated.",
        error: (error) => (error instanceof Error ? error.message : "Failed to update permissions"),
      }),
  }
}
