import { Card, CardContent, CardHeader, CardTitle } from "@analytics/ui-shared"
import { ArrowRight } from "lucide-react"
import { Router } from "../../router"
import type { HelpTopicListProps } from "./types"

export const HelpTopicList = ({ topics }: HelpTopicListProps) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {topics.map((topic) => (
      <a
        key={topic.id}
        href={Router.HelpTopic({ topicId: topic.id })}
        className="group block focus-visible:outline-none"
      >
        <Card className="h-full border-border/80 transition-colors group-hover:border-primary/40 group-hover:bg-accent/30 group-focus-visible:ring-2 group-focus-visible:ring-ring">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg">{topic.title}</CardTitle>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{topic.summary}</p>
          </CardContent>
        </Card>
      </a>
    ))}
  </div>
)
