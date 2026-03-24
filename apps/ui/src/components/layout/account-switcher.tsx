import { useAuth } from "../../lib/auth-context"

export const AccountSwitcher = () => {
  const { user, accounts, switchAccount } = useAuth()

  if (accounts.length <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="account-switcher" className="text-sm font-medium text-muted-foreground">
        Account:
      </label>
      <select
        id="account-switcher"
        value={user.customerId}
        onChange={(e) => switchAccount(e.target.value)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {accounts.map((a) => (
          <option key={a.customerId} value={a.customerId}>
            {a.customerName || a.customerId} ({a.role})
          </option>
        ))}
      </select>
    </div>
  )
}
