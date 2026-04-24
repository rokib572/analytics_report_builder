import { useEffect, useState } from "react"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import {
  hasCrossModePivotConflict,
  hasIncompatibleDimensions,
  type LocationAttribute,
  type ReportConfig,
} from "@analytics/report-builder"
import { ReportConfigSchema } from "@analytics/validators"
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@analytics/ui-shared"
import { apiClient } from "../../lib/api-client"
import { Router } from "../../router"
import {
  DEFAULT_REPORT_PAGE_SIZE,
  useInfiniteReportQuery,
  usePagedReportQuery,
} from "../../data/report-builder/hooks"
import { ReportCanvas } from "./components/ReportCanvas"
import { ComparisonsPanel } from "./components/ComparisonsPanel"
import { FieldPanel } from "./components/FieldPanel"
import { PresetPicker } from "./components/PresetPicker"
import { PreviewPanel } from "./components/PreviewPanel"
import { SaveReportModal } from "./components/SaveReportModal"
import { SavedReportsList } from "./components/SavedReportsList"
import { ExportMenu } from "./components/ExportMenu"
import { getDefaultDateRange, isSupportedDimension, isSupportedMetricValue } from "./constants"

export const ReportBuilderRoute = () => {
  const route = Router.useRoute(["ReportBuilderGet"])
  const reportId = route?.params?.reportId
  const [activeTab, setActiveTab] = useState("builder")
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)
  const [config, setConfig] = useState<ReportConfig>({
    metrics: [],
    rows: [],
    columns: [],
    filters: [],
    chartType: "table",
    dateRange: getDefaultDateRange(),
  })
  const previewConfig = config.metrics.length > 0 ? config : null
  const isTableChart = config.chartType === "table"
  const pagedReportQuery = usePagedReportQuery(
    !isTableChart ? previewConfig : null,
    previewPage,
    DEFAULT_REPORT_PAGE_SIZE,
  )
  const infiniteReportQuery = useInfiniteReportQuery(
    isTableChart ? previewConfig : null,
    DEFAULT_REPORT_PAGE_SIZE,
  )

  useEffect(() => {
    setPreviewPage(1)
  }, [config])

  useEffect(() => {
    if (!reportId) return

    let isMounted = true

    const loadReport = async () => {
      const res = await apiClient.api.reports[":id"].$get({ param: { id: reportId } })
      if (!res.ok) return

      const json = (await res.json()) as unknown as {
        success: true
        data: { config: unknown }
      }

      if (!isMounted) return

      setConfig(ReportConfigSchema.parse(json.data.config))
      setActiveTab("builder")
    }

    void loadReport()

    return () => {
      isMounted = false
    }
  }, [reportId])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return

    const dragData = active.data.current
    if (!dragData) return

    const fieldType = dragData.type
    const fieldName = dragData.name

    if (typeof fieldType !== "string" || typeof fieldName !== "string") return

    setConfig((current: ReportConfig) => {
      if (
        fieldType === "metric" &&
        isSupportedMetricValue(fieldName) &&
        over.id === "metrics" &&
        !current.metrics.includes(fieldName)
      ) {
        return { ...current, metrics: [...current.metrics, fieldName] }
      }

      if (
        fieldType === "dimension" &&
        isSupportedDimension(fieldName) &&
        over.id === "rows" &&
        !current.rows.includes(fieldName) &&
        !current.columns.includes(fieldName)
      ) {
        if (hasIncompatibleDimensions([...current.rows, ...current.columns, fieldName])) {
          return current
        }

        if (
          hasCrossModePivotConflict(current.metrics, [...current.rows, fieldName], current.columns)
        ) {
          return current
        }

        return { ...current, rows: [...current.rows, fieldName] }
      }

      if (
        fieldType === "dimension" &&
        isSupportedDimension(fieldName) &&
        over.id === "columns" &&
        !current.columns.includes(fieldName) &&
        !current.rows.includes(fieldName)
      ) {
        if (hasIncompatibleDimensions([...current.rows, ...current.columns, fieldName])) {
          return current
        }

        if (
          hasCrossModePivotConflict(current.metrics, current.rows, [...current.columns, fieldName])
        ) {
          return current
        }

        return { ...current, columns: [...current.columns, fieldName] }
      }

      return current
    })
  }

  const handleOpenSavedReport = (savedConfig: ReportConfig) => {
    setConfig(savedConfig)
    setActiveTab("builder")
  }

  const tablePreviewResult = infiniteReportQuery.data
    ? {
        ...infiniteReportQuery.data.pages[0],
        columns: infiniteReportQuery.data.pages[0].columns,
        rows: infiniteReportQuery.data.pages.flatMap((page) => page.rows),
        generatedAt:
          infiniteReportQuery.data.pages[infiniteReportQuery.data.pages.length - 1]?.generatedAt ??
          infiniteReportQuery.data.pages[0].generatedAt,
        page:
          infiniteReportQuery.data.pages[infiniteReportQuery.data.pages.length - 1]?.page ??
          infiniteReportQuery.data.pages[0].page,
        hasMore:
          infiniteReportQuery.data.pages[infiniteReportQuery.data.pages.length - 1]?.hasMore ??
          false,
      }
    : undefined

  if (
    import.meta.env.DEV &&
    config.columns.length > 0 &&
    infiniteReportQuery.data &&
    infiniteReportQuery.data.pages.length > 1
  ) {
    console.warn("Pivot reports should only return a single preview page.")
  }

  const previewResult = isTableChart ? tablePreviewResult : pagedReportQuery.data
  const previewLoading = isTableChart ? infiniteReportQuery.isLoading : pagedReportQuery.isLoading
  const previewError = isTableChart
    ? (infiniteReportQuery.error ?? null)
    : (pagedReportQuery.error ?? null)
  const hasUsableConfig =
    config.metrics.length > 0 && (config.rows.length > 0 || config.columns.length > 0)

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          </TabsList>
          {activeTab === "builder" ? (
            <div className="flex items-center gap-2">
              <PresetPicker currentConfig={config} onApply={setConfig} />
              <ExportMenu config={config} disabled={!hasUsableConfig} />
              <Button
                type="button"
                onClick={() => setSaveModalOpen(true)}
                disabled={config.metrics.length === 0}
              >
                Save
              </Button>
            </div>
          ) : null}
        </div>
        <TabsContent value="builder" className="mt-0">
          <DndContext onDragEnd={handleDragEnd}>
            <div className="flex h-full min-h-[calc(100vh-8rem)]">
              <FieldPanel
                activeMetrics={config.metrics}
                activeDimensions={[...config.rows, ...config.columns]}
                activeLocationAttributes={config.locationAttributes ?? []}
                onLocationAttributesChange={(next: LocationAttribute[]) =>
                  setConfig((current) => ({
                    ...current,
                    locationAttributes: next.length > 0 ? next : undefined,
                  }))
                }
              />
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <ReportCanvas config={config} onConfigChange={setConfig} />
                <ComparisonsPanel config={config} onConfigChange={setConfig} />
                <PreviewPanel
                  result={previewResult}
                  chartType={config.chartType}
                  isLoading={previewLoading}
                  error={previewError}
                  onLoadMore={() => void infiniteReportQuery.fetchNextPage()}
                  isLoadingMore={infiniteReportQuery.isFetchingNextPage}
                  onNextPage={() => setPreviewPage((current) => current + 1)}
                  onPreviousPage={() => setPreviewPage((current) => Math.max(1, current - 1))}
                />
              </div>
            </div>
          </DndContext>
        </TabsContent>
        <TabsContent value="my-reports" className="mt-0 p-4">
          <SavedReportsList onOpen={handleOpenSavedReport} />
        </TabsContent>
      </Tabs>
      <SaveReportModal open={saveModalOpen} onOpenChange={setSaveModalOpen} config={config} />
    </>
  )
}
