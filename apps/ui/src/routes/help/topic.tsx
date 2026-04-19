import { Button, Card, CardContent, CardHeader, CardTitle } from "@analytics/ui-shared"
import { Router } from "../../router"
import { HelpTopicView } from "./contents-topic-view"
import { findHelpTopic } from "./topics"

const HelpTopicNotFound = () => (
  <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">Help topic not found</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        The topic you requested does not exist or is no longer available.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Browse all help topics</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => Router.push("Help")}>
          Back to Help
        </Button>
      </CardContent>
    </Card>
  </div>
)

export const HelpTopicRoute = () => {
  const route = Router.useRoute(["HelpTopic"])
  const topicId = route?.params?.topicId ?? ""
  const topic = findHelpTopic(topicId)

  if (!topic) return <HelpTopicNotFound />

  return <HelpTopicView topic={topic} />
}
