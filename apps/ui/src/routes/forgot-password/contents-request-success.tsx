import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@analytics/ui-shared"
import { Router } from "../../router"
import type { RequestSuccessContentProps } from "./types"

export const RequestResetSuccessContent = ({ email }: RequestSuccessContentProps) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
    <img src="/images/logo/logo-v2.png" alt="AperioBI" className="mb-6 h-24 w-auto" />
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          If an account exists for <span className="font-medium text-foreground">{email}</span>,
          we&apos;ve sent reset instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The reset link expires in 1 hour. If you don&apos;t see the email, check your spam folder
          or request another link.
        </p>

        <p className="text-center text-sm text-muted-foreground">
          <a href={Router.Login()} className="text-primary underline-offset-4 hover:underline">
            Back to login
          </a>
        </p>
      </CardContent>
    </Card>
  </div>
)
