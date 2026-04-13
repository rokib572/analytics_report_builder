import { useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from "@analytics/ui-shared"
import { apiClient } from "../../lib/api-client"
import { useIntegrations, SUPPORTED_APPS } from "../../data/integrations/hooks"
import { Router } from "../../router"

const BACKFILL_SCOPE_OPTIONS = [
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "24m", label: "24 months" },
  { value: "all", label: "All history" },
] as const

const SquareConnectOAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [backfillScope, setBackfillScope] = useState<"30d" | "3m" | "6m" | "12m" | "24m" | "all">(
    "12m",
  )

  // Check for error from OAuth callback redirect
  const urlParams = new URLSearchParams(window.location.search)
  const callbackError = urlParams.get("error")

  const handleConnect = async () => {
    setError(null)
    setIsRedirecting(true)

    try {
      const res = await apiClient.api.square.oauth.authorize.$get({
        query: { backfillScope },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(
          (body as { message?: string } | null)?.message ??
            "Failed to initiate connection. Please try again.",
        )
        setIsRedirecting(false)
        return
      }

      const data = await res.json()
      window.location.href = (data as { url: string }).url
    } catch {
      setError("Failed to initiate connection. Please try again.")
      setIsRedirecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="backfillScope">History to import</Label>
        <select
          id="backfillScope"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          value={backfillScope}
          onChange={(e) =>
            setBackfillScope(e.target.value as "30d" | "3m" | "6m" | "12m" | "24m" | "all")
          }
        >
          {BACKFILL_SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {(error ?? callbackError) && (
        <p className="text-sm text-destructive">
          {error ?? decodeURIComponent(callbackError!.replace(/\+/g, " "))}
        </p>
      )}

      <Button onClick={handleConnect} disabled={isRedirecting}>
        {isRedirecting ? "Redirecting to Square..." : "Connect with Square"}
      </Button>
    </div>
  )
}

export const ConnectRoute = () => {
  const { data, isPending } = useIntegrations()

  if (isPending) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  const integrations = (data?.data ?? []) as { appName: string; isActive: boolean }[]
  const connectedApps = new Set(
    integrations
      .filter((integration) => integration.isActive)
      .map((integration) => integration.appName),
  )
  const unconnectedApps = SUPPORTED_APPS.filter((app) => !connectedApps.has(app))

  if (unconnectedApps.length === 0) {
    Router.replace("Integrations")
    return null
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connect Your Services</h1>
        <p className="text-muted-foreground">
          Link your POS and delivery platforms to start syncing data.
        </p>
      </div>

      {unconnectedApps.includes("square") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <rect width="24" height="24" rx="4" />
                <rect x="4" y="4" width="16" height="16" rx="2" fill="white" />
              </svg>
              Square
            </CardTitle>
            <CardDescription>
              Connect your Square account to sync locations, orders, and sales data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SquareConnectOAuth />
          </CardContent>
        </Card>
      )}

      {unconnectedApps.includes("uber") && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <circle cx="12" cy="12" r="12" />
                <text
                  x="12"
                  y="16"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  U
                </text>
              </svg>
              Uber Eats
            </CardTitle>
            <CardDescription>Sync your Uber Eats orders and delivery data.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
