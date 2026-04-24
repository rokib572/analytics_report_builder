import { Sparkles } from "lucide-react"
import {
  buildDailyOperationsReportConfig,
  REPORT_PRESETS,
  type PresetId,
  type ReportConfig,
} from "@analytics/report-builder"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@analytics/ui-shared"
import { useChannels, type Channel } from "../../../data/channels/hooks"

type PresetPickerProps = {
  currentConfig: ReportConfig
  onApply: (nextConfig: ReportConfig) => void
}

const toIsoDate = (date: Date): string => {
  const year = date.getUTCFullYear().toString().padStart(4, "0")
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const getYesterdayIsoDate = (): string => toIsoDate(new Date(Date.now() - MILLISECONDS_PER_DAY))

const mapChannels = (channels: Channel[]) =>
  channels.map((channel) => ({
    id: channel.id,
    squareSourceName: channel.squareSourceName,
    displayName: channel.displayName,
  }))

export const PresetPicker = ({ currentConfig, onApply }: PresetPickerProps) => {
  const channelsQuery = useChannels()

  const handleApply = (presetId: PresetId) => {
    const today = getYesterdayIsoDate()

    if (presetId === "daily-operations-report") {
      const channels = channelsQuery.data ? mapChannels(channelsQuery.data) : undefined
      const nextConfig = buildDailyOperationsReportConfig({ today, channels })

      const hasExisting = currentConfig.metrics.length > 0
      if (hasExisting) {
        const confirmed = window.confirm(
          "Applying a preset replaces the current report configuration. Continue?",
        )
        if (!confirmed) return
      }

      onApply(nextConfig)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Presets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {REPORT_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.id}
            onSelect={() => handleApply(preset.id)}
            className="flex flex-col items-start gap-1 py-2"
          >
            <span className="text-sm font-medium">{preset.name}</span>
            <span className="text-xs text-muted-foreground">{preset.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
