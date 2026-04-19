import connectingSquare from "./content/connecting-square.md?raw"
import faq from "./content/faq.md?raw"
import gettingStarted from "./content/getting-started.md?raw"
import reports from "./content/reports.md?raw"
import team from "./content/team.md?raw"
import type { HelpTopic } from "./types"

export const helpTopics: readonly HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Learn the first steps after sign-in, from completing setup to finding your data.",
    body: gettingStarted,
  },
  {
    id: "connecting-square",
    title: "Connecting Square",
    summary: "Connect your Square account, understand sync timing, and confirm locations.",
    body: connectingSquare,
  },
  {
    id: "reports",
    title: "Reports",
    summary: "Use the report builder to explore sales data and answer common business questions.",
    body: reports,
  },
  {
    id: "team",
    title: "Team management",
    summary: "Invite teammates, understand roles, and know what members can access.",
    body: team,
  },
  {
    id: "faq",
    title: "FAQ",
    summary: "Find quick answers about access, syncs, missing data, and who to contact next.",
    body: faq,
  },
]

export const findHelpTopic = (id: string) => helpTopics.find((topic) => topic.id === id)
