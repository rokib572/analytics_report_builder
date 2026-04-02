import { useEffect, useState } from "react"
import type { ReportConfig } from "@analytics/report-builder"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@analytics/ui-shared"
import { useSaveReport } from "../../../data/report-builder/hooks"

type SaveReportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ReportConfig
}

export const SaveReportModal = ({ open, onOpenChange, config }: SaveReportModalProps) => {
  const [name, setName] = useState("")
  const saveReport = useSaveReport()

  useEffect(() => {
    if (!open) {
      setName("")
    }
  }, [open])

  const handleSave = async () => {
    await saveReport.mutateAsync({ name: name.trim(), config })
    setName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Report</DialogTitle>
          <DialogDescription>Give your report a name to save it for later.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="report-name">Report Name</Label>
          <Input
            id="report-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Monthly Sales by Location"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || saveReport.isPending}
          >
            {saveReport.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
