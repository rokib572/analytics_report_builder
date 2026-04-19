export type HelpTopic = {
  id: string
  title: string
  summary: string
  body: string
}

export type HelpTopicListProps = {
  topics: readonly HelpTopic[]
}

export type HelpTopicViewProps = {
  topic: HelpTopic
}
