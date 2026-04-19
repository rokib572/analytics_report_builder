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
import type { RequestFormContentProps } from "./types"

export const RequestResetFormContent = ({
  error,
  isSubmitting,
  onSubmit,
  register,
  errors,
}: RequestFormContentProps) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
    <img src="/images/logo/logo-v2.png" alt="AperioBI" className="mb-6 h-24 w-auto" />
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
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
