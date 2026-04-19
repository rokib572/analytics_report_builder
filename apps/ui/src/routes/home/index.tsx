import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@analytics/ui-shared"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useDashboardSummary } from "../../data/sales/hooks"
import { authClient } from "../../lib/auth-client"

const formatCurrency = (value: bigint | string | number): string =>
  `$${(Number(value) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const pctChange = (current: bigint, previous: bigint): string => {
  if (previous === 0n) return current > 0n ? "+100%" : "0%"
  const change = (Number(current - previous) / Number(previous)) * 100
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`
}

const pctChangeNumber = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`
}

const OverviewChart = ({ data }: { data: Array<{ name: string; total: number }> }) => (
  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={data}>
      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis
        stroke="#888888"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => `$${value}`}
      />
      <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
    </BarChart>
  </ResponsiveContainer>
)

export const HomeRoute = () => {
  const { data: session } = authClient.useSession()
  const { data, isPending } = useDashboardSummary()

  const chartData = (data?.chart ?? []).map((row) => ({
    name: new Date(`${row.month}T00:00:00.000Z`).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    }),
    total: Number(row.total) / 100,
  }))

  const kpiCards = [
    {
      title: "Total Revenue",
      value: data ? formatCurrency(data.currentMonth.netSales) : "$0.00",
      description: data
        ? `${pctChange(BigInt(data.currentMonth.netSales), BigInt(data.previousMonth.netSales))} from last month`
        : "0% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: "Orders",
      value: data ? data.currentMonth.orderCount.toLocaleString() : "0",
      description: data
        ? `${pctChangeNumber(data.currentMonth.orderCount, data.previousMonth.orderCount)} from last month`
        : "0% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Gross Sales",
      value: data ? formatCurrency(data.currentMonth.grossSales) : "$0.00",
      description: data
        ? `${pctChange(BigInt(data.currentMonth.grossSales), BigInt(data.previousMonth.grossSales))} from last month`
        : "0% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M2 10h20" />
        </svg>
      ),
    },
    {
      title: "Active Locations",
      value: data ? String(data.activeLocations) : "0",
      description: "Across all integrations",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {session?.user?.name ? `Welcome back, ${session.user.name}` : "Dashboard"}
        </h1>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <>
                    <Skeleton className="mb-2 h-8 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isPending ? (
              <Skeleton className="h-87.5 w-full" />
            ) : (
              <OverviewChart data={chartData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
