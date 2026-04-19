import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@analytics/ui-shared"
import { Router } from "../../router"
import type { ResetFormContentProps } from "./types"

export const ResetPasswordFormContent = ({
  error,
  isSubmitting,
  onSubmit,
  register,
  errors,
}: ResetFormContentProps) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
    <img src="/images/logo/logo-v2.png" alt="AperioBI" className="mb-6 h-24 w-auto" />
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" {...register("newPassword")} />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <a href={Router.Login()} className="text-primary underline-offset-4 hover:underline">
            Back to login
          </a>
        </p>
      </CardContent>
    </Card>
  </div>
)
