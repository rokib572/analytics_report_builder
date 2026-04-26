import browsingData from "./content/browsing-data.md?raw"
import connectingSquare from "./content/connecting-square.md?raw"
import dashboard from "./content/dashboard.md?raw"
import faq from "./content/faq.md?raw"
import gettingStarted from "./content/getting-started.md?raw"
import reports from "./content/reports.md?raw"
import team from "./content/team.md?raw"
import type { HelpTopic } from "./types"

export const helpTopics: readonly HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "First steps after sign-in, from completing setup to building your first report.",
    body: gettingStarted,
  },
  {
    id: "connecting-square",
    title: "Connecting Square",
    summary: "OAuth connect flow, backfill scope, reconnect, and what gets imported.",
    body: connectingSquare,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    summary: "What each KPI card means, how the monthly chart is computed, and what's not on it.",
    body: dashboard,
  },
  {
    id: "reports",
    title: "Report Builder",
    summary:
      "Full guide: fields, dimensions, pivots, YTD, channel breakdown, comparisons, filters, exports.",
    body: reports,
  },
  {
    id: "browsing-data",
    title: "Browsing your data",
    summary: "Locations, Orders, and Inventory pages — what you can see and how data lands here.",
    body: browsingData,
  },
  {
    id: "team",
    title: "Team management",
    summary: "Invite teammates, understand roles, and grant resource permissions.",
    body: team,
  },
  {
    id: "faq",
    title: "FAQ",
    summary: "Quick answers about access, sync timing, missing data, exports, and report rules.",
    body: faq,
  },
]

export const findHelpTopic = (id: string) => helpTopics.find((topic) => topic.id === id)
