import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@analytics/ui-shared"
import { Router } from "../../router"
import type { InvalidTokenContentProps } from "./types"

export const InvalidResetTokenContent = ({ message }: InvalidTokenContentProps) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
    <img src="/images/logo/logo-v2.png" alt="AperioBI" className="mb-6 h-24 w-auto" />
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset link invalid</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">
          <a
            href={Router.ForgotPassword()}
            className="text-primary underline-offset-4 hover:underline"
          >
            Request a new link
          </a>
        </p>
      </CardContent>
    </Card>
  </div>
)
