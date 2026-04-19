import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
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
import { authClient } from "../../lib/auth-client"
import { Router } from "../../router"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginValues = z.infer<typeof loginSchema>

export const LoginRoute = () => {
  const [error, setError] = useState<string | null>(null)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const [isResendingVerification, setIsResendingVerification] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get("error")

    if (errorCode === "TOKEN_EXPIRED") {
      toast.error("That verification link expired. Request a new one and try again.")
    }

    if (errorCode === "INVALID_TOKEN") {
      toast.error("That verification link is invalid or has already been used.")
    }
  }, [])

  const onSubmit = async (values: LoginValues) => {
    setError(null)
    setPendingVerificationEmail(null)
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: `${window.location.origin}/onboarding`,
    })

    if (result.error) {
      const code = "code" in result.error ? String(result.error.code) : ""

      if (code === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email before signing in.")
        setPendingVerificationEmail(values.email)
        return
      }

      const message = result.error.message ?? "Sign in failed"
      setError(message)
      return
    }

    const redirectParam = new URLSearchParams(window.location.search).get("redirect")
    if (redirectParam) {
      window.location.href = redirectParam
      return
    }
    Router.replace("Home")
  }

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return

    setError(null)
    setIsResendingVerification(true)

    const result = await authClient.sendVerificationEmail({
      email: pendingVerificationEmail,
      callbackURL: `${window.location.origin}/onboarding`,
    })

    setIsResendingVerification(false)

    if (result.error) {
      setError(result.error.message ?? "Failed to resend verification email")
      return
    }

    toast.success("Verification email sent.")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <img src="/images/logo/logo-v2.png" alt="AperioBI" className="mb-6 h-24 w-auto" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <p className="text-sm">
              <a
                href={Router.ForgotPassword()}
                className="text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {pendingVerificationEmail && (
              <button
                type="button"
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
              >
                {isResendingVerification
                  ? "Sending verification email..."
                  : "Resend verification email"}
              </button>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href={Router.Signup()} className="text-primary underline-offset-4 hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
