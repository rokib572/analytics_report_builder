import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@analytics/ui-shared"
import { useAuth } from "../../lib/auth-context"
import { useUsers } from "../../data/users/hooks"
import {
  useInvitations,
  useCreateInvitation,
  useRevokeInvitation,
} from "../../data/invitations/hooks"
import { ManagePermissionsDialog } from "./components/manage-permissions-dialog"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "admin"]),
})

type InviteValues = z.infer<typeof inviteSchema>

export const TeamRoute = () => {
  const { user: currentUser, isSystemAdmin } = useAuth()
  const { data: usersData, isPending: usersLoading } = useUsers()
  const { data: invitationsData, isPending: invitationsLoading } = useInvitations()
  const createInvitation = useCreateInvitation()
  const revokeInvitation = useRevokeInvitation()
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "member" },
  })

  const onSubmit = async (values: InviteValues) => {
    setError(null)
    setInviteLink(null)
    try {
      const result = await createInvitation.mutateAsync(values)
      setInviteLink(result.data.link)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvitation.mutateAsync(id)
    } catch {
      // Error handled by React Query
    }
  }

  const users = usersData?.data ?? []
  const invitations = invitationsData?.data ?? []
  const pendingInvitations = invitations.filter((i) => i.status === "pending")
  const selectedPermissionsUser =
    users.find((teamUser) => teamUser.id === permissionsUserId) ?? null

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage your team members and invitations.</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          {showInviteForm ? "Cancel" : "Invite User"}
        </Button>
      </div>

      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a New Member</CardTitle>
            <CardDescription>Send an invitation link to add someone to your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="user@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="w-40 space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                    {...register("role")}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {inviteLink && (
                <div className="rounded-md border bg-muted p-3">
                  <p className="mb-1 text-sm font-medium">Invitation link created:</p>
                  <code className="block break-all text-xs">{inviteLink}</code>
                </div>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Create Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Users who have access to this account.</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground">No team members found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="capitalize">{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={user.isActive} />
                    </TableCell>
                    <TableCell>
                      {(isSystemAdmin || currentUser.role === "owner") &&
                      user.id !== currentUser.id &&
                      (user.role === "admin" || user.role === "member") ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPermissionsUserId(user.id)}
                        >
                          Manage permissions
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Invitations that have not yet been accepted.</CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : pendingInvitations.length === 0 ? (
            <p className="text-muted-foreground">No pending invitations.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <span className="capitalize">{invitation.role}</span>
                    </TableCell>
                    <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={revokeInvitation.isPending}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ManagePermissionsDialog
        user={selectedPermissionsUser}
        open={permissionsUserId !== null}
        onOpenChange={(open) => {
          if (!open) setPermissionsUserId(null)
        }}
      />
    </div>
  )
}

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      active
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
)
