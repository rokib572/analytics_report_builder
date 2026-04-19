import { Button } from "@analytics/ui-shared"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Router } from "../../router"
import type { HelpTopicViewProps } from "./types"

export const HelpTopicView = ({ topic }: HelpTopicViewProps) => (
  <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{topic.summary}</p>
      <Button variant="outline" size="sm" onClick={() => Router.push("Help")}>
        Back to Help
      </Button>
    </div>

    <article className="prose prose-stone max-w-none prose-headings:tracking-tight prose-a:text-primary prose-code:text-foreground prose-pre:border prose-pre:border-border prose-pre:bg-muted/50 prose-td:align-top prose-th:text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.body}</ReactMarkdown>
    </article>
  </div>
)
