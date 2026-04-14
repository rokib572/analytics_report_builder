import { useEffect, useMemo, useState } from "react"
import {
  BulkSetPermissionsSchema,
  PermissionActionSchema,
  PermissionResourceSchema,
} from "@analytics/validators"
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@analytics/ui-shared"
import { useBulkSetPermissions, useUserPermissions } from "../../../data/permissions/hooks"

type ManagePermissionsDialogProps = {
  user: { id: string; email: string; role: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PermissionMatrixState = Record<string, Record<string, boolean>>

const resources = PermissionResourceSchema.options
const actions = PermissionActionSchema.options

const createEmptyMatrix = (): PermissionMatrixState =>
  Object.fromEntries(
    resources.map((resource) => [
      resource,
      Object.fromEntries(actions.map((action) => [action, false])),
    ]),
  )

const buildMatrix = (
  permissions: Array<{ resource: string; action: string; allowed: boolean }> = [],
): PermissionMatrixState => {
  const next = createEmptyMatrix()

  for (const permission of permissions) {
    if (!(permission.resource in next)) continue
    if (!(permission.action in next[permission.resource])) continue

    next[permission.resource][permission.action] = permission.allowed
  }

  return next
}

const toPermissionEntries = (matrix: PermissionMatrixState) =>
  BulkSetPermissionsSchema.shape.permissions.parse(
    resources.flatMap((resource) =>
      actions.map((action) => ({
        resource,
        action,
        allowed: matrix[resource]?.[action] ?? false,
      })),
    ),
  )

export const ManagePermissionsDialog = ({
  user,
  open,
  onOpenChange,
}: ManagePermissionsDialogProps) => {
  const permissionsQuery = useUserPermissions(open ? (user?.id ?? null) : null)
  const bulkSetPermissions = useBulkSetPermissions(user?.id ?? null)
  const [matrix, setMatrix] = useState<PermissionMatrixState>(createEmptyMatrix)

  useEffect(() => {
    if (!open) return
    setMatrix(buildMatrix(permissionsQuery.data))
  }, [open, permissionsQuery.data])

  const hasLoadedPermissions = useMemo(
    () => permissionsQuery.data !== undefined || !user,
    [permissionsQuery.data, user],
  )

  const handleCheckedChange = (resource: string, action: string, checked: boolean) => {
    setMatrix((current) => ({
      ...current,
      [resource]: {
        ...current[resource],
        [action]: checked,
      },
    }))
  }

  const handleSave = async () => {
    if (!user) return

    await bulkSetPermissions.savePermissions({
      permissions: toPermissionEntries(matrix),
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage permissions for {user?.email ?? ""}</DialogTitle>
          <DialogDescription>
            Set resource access for this {user?.role ?? "user"}. Owners, admins, and system admins
            bypass runtime permission checks, but only owners and system admins can edit this grid.
          </DialogDescription>
        </DialogHeader>

        {permissionsQuery.isPending && !hasLoadedPermissions ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : permissionsQuery.error ? (
          <p className="text-sm text-destructive">Failed to load permissions.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                {actions.map((action) => (
                  <TableHead key={action} className="text-center capitalize">
                    {action}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource}>
                  <TableCell className="font-medium capitalize">{resource}</TableCell>
                  {actions.map((action) => (
                    <TableCell key={`${resource}-${action}`} className="text-center">
                      <Checkbox
                        checked={matrix[resource]?.[action] ?? false}
                        onCheckedChange={(checked) =>
                          handleCheckedChange(resource, action, checked === true)
                        }
                        aria-label={`${resource} ${action}`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={bulkSetPermissions.isPending || permissionsQuery.isPending}
          >
            {bulkSetPermissions.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
