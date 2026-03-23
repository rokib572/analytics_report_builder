import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@analytics/ui-shared"
import { apiClient } from "../../lib/api-client"
import { useIntegrations, SUPPORTED_APPS } from "../../data/integrations/hooks"
import { Router } from "../../router"

const connectSquareSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  environment: z.enum(["sandbox", "production"]),
})

type ConnectSquareValues = z.infer<typeof connectSquareSchema>

const SquareConnectForm = () => {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConnectSquareValues>({
    resolver: zodResolver(connectSquareSchema),
    defaultValues: { environment: "sandbox" },
  })

  const onSubmit = async (values: ConnectSquareValues) => {
    setError(null)
    const res = await apiClient.api.square.connect.create.$post({
      json: {
        accessToken: values.accessToken,
        environment: values.environment,
      },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(
        (body as { message?: string } | null)?.message ??
          "Failed to connect. Please check your token.",
      )
      return
    }

    setSuccess(true)
    await queryClient.invalidateQueries({ queryKey: ["app-integrations"] })
    setTimeout(() => Router.replace("Integrations"), 1500)
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
        Square connected successfully! Redirecting...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accessToken">Access Token</Label>
        <Input
          id="accessToken"
          type="password"
          placeholder="Enter your Square access token"
          {...register("accessToken")}
        />
        {errors.accessToken && (
          <p className="text-sm text-destructive">{errors.accessToken.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="environment">Environment</Label>
        <select
          id="environment"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          {...register("environment")}
        >
          <option value="sandbox">Sandbox</option>
          <option value="production">Production</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connecting..." : "Connect Square"}
      </Button>
    </form>
  )
}

export const ConnectRoute = () => {
  const { data, isPending } = useIntegrations()

  if (isPending) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  const integrations = data?.data ?? []
  const connectedApps = new Set(integrations.map((i) => i.appName))
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
            <SquareConnectForm />
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
