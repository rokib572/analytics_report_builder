import { useEffect, useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@analytics/ui-shared"
import { useIntegrations, useDisconnectSquare, SUPPORTED_APPS } from "../../data/integrations/hooks"
import { Router } from "../../router"

export const IntegrationsRoute = () => {
  const { data, isPending } = useIntegrations()
  const disconnectMutation = useDisconnectSquare()
  const [showSuccess, setShowSuccess] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("connected") === "square") {
      setShowSuccess(true)
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname)
      const timer = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (isPending) {
    return <p className="text-muted-foreground">Loading integrations...</p>
  }

  const integrations = data?.data ?? []
  const connectedApps = new Set(
    integrations
      .filter((integration) => integration.isActive)
      .map((integration) => integration.appName),
  )
  const hasUnconnectedApps = SUPPORTED_APPS.some((app) => !connectedApps.has(app))

  const handleDisconnect = (_integrationId: string) => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => setConfirmDisconnect(null),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Manage your connected services.</p>
        </div>
        {hasUnconnectedApps && (
          <button
            onClick={() => Router.push("Connect")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Connect New App
          </button>
        )}
      </div>

      {showSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          Square connected successfully! Your data sync has started.
        </div>
      )}

      {disconnectMutation.isError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          Failed to disconnect. Please try again.
        </div>
      )}

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No integrations connected yet.</p>
            <button
              onClick={() => Router.push("Connect")}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Connect Your First App
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {integration.label ?? integration.appName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        integration.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {integration.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <CardDescription>
                  Environment: {integration.environment} · Connected{" "}
                  {new Date(integration.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integration.isActive ? (
                  confirmDisconnect === integration.id ? (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Are you sure? Your synced data will be kept.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={disconnectMutation.isPending}
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        {disconnectMutation.isPending ? "Disconnecting..." : "Confirm"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDisconnect(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDisconnect(integration.id)}
                    >
                      Disconnect
                    </Button>
                  )
                ) : integration.appName === "square" ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Reconnect Square to resume syncing data and receiving webhooks.
                    </p>
                    <Button size="sm" onClick={() => Router.push("Connect")}>
                      Reconnect
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
