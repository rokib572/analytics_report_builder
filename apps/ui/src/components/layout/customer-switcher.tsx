import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useAuth } from "../../lib/auth-context"

const useCustomers = () =>
  useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiClient.api.customers.$get()
      if (!res.ok) throw new Error("Failed to fetch customers")
      return res.json()
    },
  })

export const CustomerSwitcher = () => {
  const { selectedCustomerId, setSelectedCustomerId } = useAuth()
  const { data, isPending } = useCustomers()

  if (isPending) return null

  const customers = data?.data ?? []

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="customer-switcher" className="text-sm font-medium text-muted-foreground">
        Customer:
      </label>
      <select
        id="customer-switcher"
        value={selectedCustomerId ?? ""}
        onChange={(e) => setSelectedCustomerId(e.target.value || null)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">All Customers</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
