import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@analytics/ui-shared"
import { useIntegrations, SUPPORTED_APPS } from "../../lib/use-integrations"
import { Router } from "../../router"

export const IntegrationsRoute = () => {
  const { data, isPending } = useIntegrations()

  if (isPending) {
    return <p className="text-muted-foreground">Loading integrations...</p>
  }

  const integrations = data?.data ?? []
  const connectedApps = new Set(integrations.map((i) => i.appName))
  const hasUnconnectedApps = SUPPORTED_APPS.some((app) => !connectedApps.has(app))

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
                <CardDescription>
                  Environment: {integration.environment} · Connected{" "}
                  {new Date(integration.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
