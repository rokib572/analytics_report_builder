import { Button } from "@analytics/ui-shared"
import { useAuth } from "../../lib/auth-context"
import { setAssumedCustomerId } from "../../lib/api-client"

export const ImpersonationBanner = () => {
  const { impersonation } = useAuth()

  if (!impersonation?.active) return null

  const handleSwitchBack = () => {
    setAssumedCustomerId(null)
    window.location.reload()
  }

  return (
    <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="flex items-center justify-between gap-4">
        <p>Acting as {impersonation.assumedCustomerName} - system admin actions are paused.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
          onClick={handleSwitchBack}
        >
          Switch back as System Admin
        </Button>
      </div>
    </div>
  )
}
