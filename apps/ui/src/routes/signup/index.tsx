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
import { apiClient } from "../../lib/api-client"
import { Router } from "../../router"

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(1, "Company name is required"),
  businessType: z.string().min(1, "Business type is required"),
  businessSize: z.string().min(1, "Business size is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type SignupValues = z.infer<typeof signupSchema>

const businessTypes = [
  "Restaurant",
  "Retail",
  "Service",
  "E-commerce",
  "Healthcare",
  "Education",
  "Other",
]

const businessSizes = ["1-5 employees", "6-20 employees", "21-50 employees", "50+ employees"]

export const SignupRoute = () => {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupValues) => {
    setError(null)

    const result = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    })

    if (result.error) {
      setError(result.error.message ?? "Sign up failed")
      return
    }

    const onboardingRes = await apiClient.api.onboarding.$post({
      json: {
        companyName: values.companyName,
        businessType: values.businessType,
        businessSize: values.businessSize,
        phone: values.phone,
        address: values.address,
      },
    })

    if (!onboardingRes.ok) {
      setError("Account created but failed to save business details")
    }

    Router.push("Home")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" placeholder="Your name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

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

            <hr className="border-border" />

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc."
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <select
                id="businessType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                defaultValue=""
                {...register("businessType")}
              >
                <option value="" disabled>
                  Select type
                </option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.businessType && (
                <p className="text-sm text-destructive">{errors.businessType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessSize">Business Size</Label>
              <select
                id="businessSize"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                defaultValue=""
                {...register("businessSize")}
              >
                <option value="" disabled>
                  Select size
                </option>
                {businessSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              {errors.businessSize && (
                <p className="text-sm text-destructive">{errors.businessSize.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, City, State"
                {...register("address")}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href={Router.Login()} className="text-primary underline-offset-4 hover:underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
