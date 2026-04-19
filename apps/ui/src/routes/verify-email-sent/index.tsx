import { useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@analytics/ui-shared"
import { authClient } from "../../lib/auth-client"
import { Router } from "../../router"

export const VerifyEmailSentRoute = () => {
  const route = Router.useRoute(["VerifyEmailSent"])
  const email = route?.params?.email ?? ""
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleResend = async () => {
    if (!email) {
      setError("Missing email address for verification.")
      return
    }

    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/onboarding`,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error.message ?? "Failed to resend verification email")
      return
    }

    setSuccess("Verification email sent.")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <img src="/images/logo/logo-v2.png" alt="AperioBI" className="mb-6 h-24 w-auto" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{email}</span>. Open the email and click
            the link to continue to onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The link expires in 1 hour. If it does not arrive, you can resend it.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <Button className="w-full" onClick={handleResend} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Resend verification email"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <a href={Router.Login()} className="text-primary underline-offset-4 hover:underline">
              Back to login
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
