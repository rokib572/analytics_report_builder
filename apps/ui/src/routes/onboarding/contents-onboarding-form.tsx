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
import { businessSizes, businessTypes } from "./schemas"
import type { OnboardingFormProps } from "./types"

export const OnboardingFormContent = ({
  error,
  isSubmitting,
  register,
  errors,
  onSubmit,
}: OnboardingFormProps) => (
  <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center justify-center">
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete your onboarding</CardTitle>
        <CardDescription>Add your business details to continue to integrations.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
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
            {isSubmitting ? "Saving details..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
)
