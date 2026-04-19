import { HelpTopicList } from "./contents-topic-list"
import { helpTopics } from "./topics"

export const HelpRoute = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">Help</h1>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
        Find quick guidance for getting started, connecting Square, building reports, and
        collaborating with your team.
      </p>
    </div>

    <HelpTopicList topics={helpTopics} />
  </div>
)
