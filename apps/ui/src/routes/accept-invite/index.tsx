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
} from "@analytics/ui-shared"
import { authClient } from "../../lib/auth-client"
import { useValidateInvitation, useAcceptInvitation } from "../../data/invitations/hooks"
import { Router } from "../../router"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type RegisterValues = z.infer<typeof registerSchema>

export const AcceptInviteRoute = () => {
  const token = new URLSearchParams(window.location.search).get("token") ?? ""
  const { data: validation, isPending: validating } = useValidateInvitation(token)
  const acceptMutation = useAcceptInvitation()
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  const { data: session, isPending: sessionPending } = authClient.useSession()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  if (!token) {
    return (
      <CenteredCard title="Invalid Link" description="No invitation token provided.">
        <a href={Router.Login()} className="text-primary underline-offset-4 hover:underline">
          Go to login
        </a>
      </CenteredCard>
    )
  }

  if (validating || sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Validating invitation...</p>
      </div>
    )
  }

  if (!validation || !validation.valid) {
    return (
      <CenteredCard
        title="Invalid Invitation"
        description={
          (validation as { reason?: string })?.reason ?? "This invitation is no longer valid."
        }
      >
        <a href={Router.Login()} className="text-primary underline-offset-4 hover:underline">
          Go to login
        </a>
      </CenteredCard>
    )
  }

  if (accepted) {
    return (
      <CenteredCard
        title="Invitation Accepted"
        description={`You have joined ${validation.customerName}.`}
      >
        <a href={Router.Login()} className="text-primary underline-offset-4 hover:underline">
          Go to login
        </a>
      </CenteredCard>
    )
  }

  // Existing user who is logged in — show accept button
  if (validation.existingAccount && session) {
    const handleAccept = async () => {
      setError(null)
      try {
        await acceptMutation.mutateAsync(token)
        setAccepted(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept invitation")
      }
    }

    return (
      <CenteredCard
        title="Accept Invitation"
        description={`You've been invited to join ${validation.customerName} as ${validation.role}.`}
      >
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleAccept} className="w-full" disabled={acceptMutation.isPending}>
          {acceptMutation.isPending ? "Accepting..." : "Accept Invitation"}
        </Button>
      </CenteredCard>
    )
  }

  // Existing user who is NOT logged in — prompt to log in
  if (validation.existingAccount && !session) {
    return (
      <CenteredCard
        title="Accept Invitation"
        description={`You've been invited to join ${validation.customerName} as ${validation.role}. Log in to accept.`}
      >
        <a
          href={`${Router.Login()}?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
          className="inline-block"
        >
          <Button className="w-full">Log in to Accept</Button>
        </a>
      </CenteredCard>
    )
  }

  // New user — show registration form
  const onSubmit = async (values: RegisterValues) => {
    setError(null)

    const result = await authClient.signUp.email({
      name: values.name,
      email: validation.email,
      password: values.password,
    })

    if (result.error) {
      setError(result.error.message ?? "Registration failed")
      return
    }

    setAccepted(true)
  }

  return (
    <CenteredCard
      title="Create Your Account"
      description={`You've been invited to join ${validation.customerName} as ${validation.role}.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={validation.email} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" placeholder="Your name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </CenteredCard>
  )
}

const CenteredCard = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </div>
)
